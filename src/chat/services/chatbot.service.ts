import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotKnowledge } from '../entities/chatbot-knowledge.entity';
import {
  ChatbotInteraction,
  ChatbotResponseType,
} from '../entities/chatbot-interaction.entity';
import { TicketSolution } from '../entities/ticket-solution.entity';
import { GeminiContext, GeminiService } from './gemini.service';

export interface ChatbotRequest {
  user_id: string;
  conversation_id: string;
  message: string;
  userRole?: string;
  userDepartment?: string;
  recentTickets?: any[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface RetrievedKnowledge {
  faqs: Array<{
    knowledge_id: string;
    category: string;
    question: string;
    answer: string;
    confidence_score: number;
  }>;
  solutions: Array<{
    category?: string;
    issue_type?: string;
    summary: string;
    steps: string[];
    notes?: string;
  }>;
}

export interface ChatbotReply {
  response: string;
  intent: string;
  confidence: number;
  responseType: ChatbotResponseType;
  suggestedAction?: {
    type: string;
    data?: any;
  };
  interactionId: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger('ChatbotService');
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor(
    @InjectRepository(ChatbotKnowledge)
    private knowledgeRepository: Repository<ChatbotKnowledge>,
    @InjectRepository(ChatbotInteraction)
    private interactionRepository: Repository<ChatbotInteraction>,
    @InjectRepository(TicketSolution)
    private solutionRepository: Repository<TicketSolution>,
    private geminiService: GeminiService,
  ) {}

  /**
   * Main entry point for chatbot
   */
  async handleMessage(request: ChatbotRequest): Promise<ChatbotReply> {
    const { user_id, conversation_id, message } = request;

    this.logger.log(`[${user_id}] Processing: ${message.substring(0, 50)}...`);

    // Retrieve grounding before any Gemini request, including intent detection.
    const conversationHistory = request.conversationHistory?.length
      ? request.conversationHistory.slice(-10)
      : await this.getConversationHistory(conversation_id, 5);
    const retrievalMessage = this.getRetrievalQuery(
      message,
      conversationHistory,
    );
    const knowledgeBase =
      await this.retrieveRelevantKnowledge(retrievalMessage);
    const context: GeminiContext = {
      userRole: request.userRole,
      userDepartment: request.userDepartment,
      recentTickets: request.recentTickets,
      conversationHistory,
      knowledgeBase,
    };

    // Step 1: Detect intent with the same grounding context used for the answer.
    const intentDetection = await this.geminiService.detectIntent(
      message,
      context,
    );
    const { intent, confidence } = intentDetection;

    this.logger.log(`Intent: ${intent} (confidence: ${confidence})`);

    // Step 2: Process based on intent
    let response: string;
    let responseType: ChatbotResponseType;
    let suggestedAction: any = null;

    try {
      const needsGroundedAnswer = [
        'FAQ',
        'TROUBLESHOOTING',
        'GENERAL',
      ].includes(intent);
      const hasKnowledge =
        knowledgeBase.faqs.length > 0 ||
        knowledgeBase.solutions.length > 0 ||
        (this.isFollowUpMessage(message) && conversationHistory.length > 0);

      if (
        needsGroundedAnswer &&
        (!hasKnowledge ||
          (confidence < this.CONFIDENCE_THRESHOLD &&
            this.geminiService.isGeminiAvailable()))
      ) {
        response = this.getInsufficientContextResponse();
        responseType =
          intent === 'TROUBLESHOOTING'
            ? ChatbotResponseType.TROUBLESHOOTING
            : intent === 'FAQ'
              ? ChatbotResponseType.FAQ
              : ChatbotResponseType.GENERAL;
      } else
        switch (intent) {
          case 'FAQ':
            const faqResult = await this.handleFAQ(message, context);
            response = faqResult.answer;
            responseType = ChatbotResponseType.FAQ;
            break;

          case 'TICKET_CREATION':
            const ticketResult = await this.handleTicketCreation(
              message,
              context,
            );
            response = ticketResult.response;
            responseType = ChatbotResponseType.TICKET_CREATION;
            suggestedAction = ticketResult.suggestedAction;
            break;

          case 'TROUBLESHOOTING':
            const troubleResult = await this.handleTroubleshooting(
              message,
              context,
            );
            response = troubleResult.response;
            responseType = ChatbotResponseType.TROUBLESHOOTING;
            suggestedAction = troubleResult.suggestedAction;
            break;

          case 'TICKET_STATUS':
            const statusResult = await this.handleTicketStatus(message);
            response = statusResult.response;
            responseType = ChatbotResponseType.TICKET_STATUS;
            break;

          case 'ESCALATION':
            const escalationResult = await this.handleEscalation(message);
            response = escalationResult.response;
            responseType = ChatbotResponseType.ESCALATION;
            break;

          default:
            const generalResult = await this.handleGeneral(message, context);
            response = generalResult.response;
            responseType = ChatbotResponseType.GENERAL;
            break;
        }
    } catch (error) {
      this.logger.error('Error processing message:', error);
      response = this.getFallbackResponse();
      responseType = ChatbotResponseType.GENERAL;
    }

    // Step 3: Store interaction
    const interaction = await this.storeInteraction({
      user_id,
      conversation_id,
      user_message: message,
      chatbot_response: response,
      response_type: responseType,
      detected_intent: intent,
      intent_confidence: confidence,
    });

    return {
      response,
      intent,
      confidence,
      responseType,
      suggestedAction,
      interactionId: interaction.interaction_id,
    };
  }

  /**
   * Handle FAQ queries
   */
  private async handleFAQ(
    message: string,
    context: GeminiContext,
  ): Promise<{ answer: string }> {
    const matchingFaq = context.knowledgeBase?.faqs[0];
    if (matchingFaq) {
      await this.knowledgeRepository
        .createQueryBuilder()
        .update(ChatbotKnowledge)
        .set({ usage_count: () => 'usage_count + 1' })
        .where('knowledge_id = :knowledge_id', {
          knowledge_id: matchingFaq.knowledge_id,
        })
        .execute();
    }

    const geminiResponse = await this.geminiService.generateResponse(
      message,
      context,
    );
    return { answer: geminiResponse.text };
  }

  /**
   * Handle ticket creation requests
   */
  private async handleTicketCreation(
    message: string,
    context: GeminiContext,
  ): Promise<{
    response: string;
    suggestedAction?: any;
  }> {
    const ticketInfo = await this.geminiService.extractTicketInfo(
      message,
      context,
    );

    const response = `I'd like to help you create a support ticket for this issue.\n\n📋 **Ticket Summary:**\n- **Category:** ${ticketInfo.category || 'To be determined'}\n- **Priority:** ${ticketInfo.priority || 'Normal'}\n- **Subject:** ${ticketInfo.subject}\n\n✅ Shall I proceed with creating this ticket? Reply "yes" to confirm or provide more details.`;

    return {
      response,
      suggestedAction: {
        type: 'CONFIRM_TICKET_CREATION',
        data: ticketInfo,
      },
    };
  }

  /**
   * Handle troubleshooting requests
   */
  private async handleTroubleshooting(
    message: string,
    context: GeminiContext,
  ): Promise<{
    response: string;
    suggestedAction?: any;
  }> {
    const geminiResponse = await this.geminiService.generateResponse(
      message,
      context,
    );

    return {
      response: geminiResponse.text,
      suggestedAction: {
        type: 'CREATE_TICKET_IF_NOT_RESOLVED',
      },
    };
  }

  /**
   * Handle ticket status queries
   */
  private async handleTicketStatus(
    message: string,
  ): Promise<{ response: string }> {
    // Extract ticket ID from message (e.g., IT-20261103-0001)
    const ticketIdMatch = message.match(/IT-\d{8}-\d{4}/);
    const ticketId = ticketIdMatch?.[0];

    if (!ticketId) {
      return {
        response: `I couldn't find a ticket ID in your message. Please provide your ticket ID (format: IT-YYYYMMDD-XXXX) and I'll look up the status for you.`,
      };
    }

    // In real implementation, would query ticket API
    const response = `📌 **Ticket Status**\n\n**Ticket ID:** ${ticketId}\n\n*Note: This is a demo response. The frontend should fetch actual ticket details from the ticket API.*\n\nTo check your actual ticket status, please use the ticket dashboard or provide your ticket ID in a new message.`;

    return { response };
  }

  /**
   * Handle escalation requests
   */
  private async handleEscalation(
    message: string,
  ): Promise<{ response: string }> {
    const response = `I understand you need assistance. Please create a support ticket through the IT Help Desk so the IT team can review your issue. If this is urgent, use your organization's established IT escalation channel.\n\nWould you like help preparing a support ticket?`;

    return { response };
  }

  /**
   * Handle general conversations
   */
  private async handleGeneral(
    message: string,
    context: GeminiContext,
  ): Promise<{ response: string }> {
    const geminiResponse = await this.geminiService.generateResponse(
      message,
      context,
    );

    return { response: geminiResponse.text };
  }

  /**
   * Retrieve and rank active FAQs and resolved-ticket solutions for grounding.
   */
  private async retrieveRelevantKnowledge(
    message: string,
  ): Promise<RetrievedKnowledge> {
    const emptyResult: RetrievedKnowledge = { faqs: [], solutions: [] };
    const keywords = this.extractKeywords(message);
    if (keywords.length === 0) {
      return emptyResult;
    }

    const faqSearch = this.buildKeywordCondition(
      ['kb.question', 'kb.keywords', 'kb.answer', 'kb.category'],
      keywords,
      'faq',
    );
    const faqQuery = this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true')
      .andWhere('kb.confidence_score >= :minConfidence', { minConfidence: 0.5 })
      .andWhere(faqSearch.condition, faqSearch.parameters)
      .orderBy('kb.confidence_score', 'DESC')
      .addOrderBy('kb.usage_count', 'DESC')
      .take(50);

    const solutionSearch = this.buildKeywordCondition(
      [
        'ts.solution_summary',
        'ts.tags',
        'ts.category',
        'ts.issue_type',
        'ts.resolution_notes',
        'ts.resolution_steps',
      ],
      keywords,
      'solution',
    );
    const solutionQuery = this.solutionRepository
      .createQueryBuilder('ts')
      .where('ts.is_active = true')
      .andWhere(solutionSearch.condition, solutionSearch.parameters)
      .orderBy('ts.usage_count', 'DESC')
      .addOrderBy('ts.created_at', 'DESC')
      .take(50);

    const [faqCandidates, solutionCandidates] = await Promise.all([
      faqQuery.getMany(),
      solutionQuery.getMany(),
    ]);

    const rankedFaqs = faqCandidates
      .map((entry) => ({
        entry,
        score: this.scoreMatch(
          keywords,
          [entry.question, entry.keywords?.join(' '), entry.category],
          [entry.answer],
        ),
      }))
      .filter(({ score }) => score >= 0.3)
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.entry.confidence_score) - Number(a.entry.confidence_score) ||
          b.entry.usage_count - a.entry.usage_count,
      )
      .slice(0, 3)
      .map(({ entry }) => ({
        knowledge_id: entry.knowledge_id,
        category: entry.category,
        question: entry.question,
        answer: entry.answer,
        confidence_score: Number(entry.confidence_score),
      }));

    const rankedSolutions = solutionCandidates
      .map((solution) => ({
        solution,
        score: this.scoreMatch(
          keywords,
          [
            solution.solution_summary,
            solution.tags?.join(' '),
            solution.category,
            solution.issue_type,
          ],
          [solution.resolution_notes, solution.resolution_steps?.join(' ')],
        ),
      }))
      .filter(({ score }) => score >= 0.3)
      .sort(
        (a, b) =>
          b.score - a.score || b.solution.usage_count - a.solution.usage_count,
      )
      .slice(0, 3)
      .map(({ solution }) => ({
        category: solution.category,
        issue_type: solution.issue_type,
        summary: solution.solution_summary,
        steps: solution.resolution_steps || [],
        notes: solution.resolution_notes || undefined,
      }));

    return { faqs: rankedFaqs, solutions: rankedSolutions };
  }

  private getRetrievalQuery(
    message: string,
    history: Array<{ role: string; content: string }>,
  ): string {
    if (!this.isFollowUpMessage(message)) return message;

    const previousUserMessage = [...history]
      .reverse()
      .find((turn) => turn.role === 'user')?.content;
    return previousUserMessage ? `${previousUserMessage} ${message}` : message;
  }

  private isFollowUpMessage(message: string): boolean {
    return /\b(it|that|this|they|them|same|also|there|those|these|what about|and then)\b/i.test(
      message,
    );
  }

  private buildKeywordCondition(
    fields: string[],
    keywords: string[],
    parameterPrefix: string,
  ): { condition: string; parameters: Record<string, string> } {
    const conditions: string[] = [];
    const parameters: Record<string, string> = {};

    keywords.forEach((keyword, index) => {
      const parameter = `${parameterPrefix}_${index}`;
      conditions.push(
        `(${fields.map((field) => `LOWER(COALESCE(${field}, '')) LIKE :${parameter}`).join(' OR ')})`,
      );
      parameters[parameter] = `%${keyword}%`;
    });

    return { condition: `(${conditions.join(' OR ')})`, parameters };
  }

  private scoreMatch(
    keywords: string[],
    primaryFields: Array<string | undefined>,
    secondaryFields: Array<string | undefined>,
  ): number {
    const primaryText = primaryFields.filter(Boolean).join(' ').toLowerCase();
    const secondaryText = secondaryFields
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchedWeight = keywords.reduce((total, keyword) => {
      if (primaryText.includes(keyword)) return total + 1;
      if (secondaryText.includes(keyword)) return total + 0.5;
      return total;
    }, 0);

    return keywords.length === 0 ? 0 : matchedWeight / keywords.length;
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    const stopwords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'is',
      'are',
      'was',
      'were',
      'my',
      'your',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'can',
      'could',
      'would',
      'should',
      'do',
      'does',
      'did',
      'how',
      'what',
      'where',
      'when',
      'why',
      'which',
      'who',
      'help',
      'please',
      'tell',
      'know',
      'need',
      'want',
      'having',
    ];

    return message
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(
        (word) =>
          word.length > 2 && !stopwords.includes(word) && !/^\d+$/.test(word),
      )
      .slice(0, 10);
  }

  private getInsufficientContextResponse(): string {
    return `I don't have enough verified information to answer that confidently, and I don't want to guess. Could you share the device, application, or exact error involved? For organization-specific policies or steps, please contact IT or submit a support ticket.`;
  }

  /**
   * Store interaction in database
   */
  private async storeInteraction(data: {
    user_id: string;
    conversation_id: string;
    user_message: string;
    chatbot_response: string;
    response_type: ChatbotResponseType;
    detected_intent: string;
    intent_confidence: number;
  }): Promise<ChatbotInteraction> {
    const interaction = this.interactionRepository.create(data);
    return await this.interactionRepository.save(interaction);
  }

  /**
   * Fallback response when all else fails
   */
  private getFallbackResponse(): string {
    return `I'm having trouble understanding your request at the moment. 🤔\n\n**Here's what I can help you with:**\n- Answer IT questions (FAQs)\n- Help you create a support ticket\n- Troubleshoot common issues\n- Check ticket status\n\nCould you rephrase your question or let me know what you need help with?`;
  }

  /**
   * Add entry to knowledge base (Admin only)
   */
  async addKnowledgeEntry(data: {
    category: string;
    question: string;
    answer: string;
    keywords?: string[];
  }): Promise<ChatbotKnowledge> {
    const entry = this.knowledgeRepository.create({
      ...data,
      confidence_score: 0.9,
      is_active: true,
    });
    return await this.knowledgeRepository.save(entry);
  }

  /**
   * Update knowledge entry confidence based on feedback
   */
  async updateKnowledgeConfidence(
    knowledge_id: string,
    isHelpful: boolean,
  ): Promise<void> {
    const entry = await this.knowledgeRepository.findOne({
      where: { knowledge_id },
    });

    if (!entry) {
      throw new BadRequestException('Knowledge entry not found');
    }

    if (isHelpful) {
      entry.helpful_count += 1;
      // Increase confidence score
      entry.confidence_score = Math.min(1.0, entry.confidence_score + 0.05);
    } else {
      // Decrease confidence score
      entry.confidence_score = Math.max(0.0, entry.confidence_score - 0.1);
    }

    await this.knowledgeRepository.save(entry);
  }

  /**
   * Extract and store solution from resolved ticket
   */
  async extractTicketSolution(ticketData: {
    ticket_id: string;
    category?: string;
    issue_type?: string;
    subject: string;
    resolution_notes?: string;
    resolution_time_minutes?: number;
    tags?: string[];
  }): Promise<TicketSolution> {
    const solution = this.solutionRepository.create({
      ticket_id: ticketData.ticket_id,
      category: ticketData.category,
      issue_type: ticketData.issue_type,
      solution_summary: ticketData.subject,
      resolution_notes: ticketData.resolution_notes,
      resolution_time_minutes: ticketData.resolution_time_minutes,
      tags: ticketData.tags,
      is_active: true,
    });

    return await this.solutionRepository.save(solution);
  }

  /**
   * Get chatbot stats
   */
  async getStats(): Promise<{
    totalInteractions: number;
    averageConfidence: number;
    knowledgeBaseSize: number;
    resolvedSolutions: number;
  }> {
    try {
      const totalInteractions = await this.interactionRepository.count();

      const avgConfidenceResult = await this.interactionRepository
        .createQueryBuilder('ci')
        .select('AVG(ci.intent_confidence)', 'avg')
        .getRawOne();

      const knowledgeBaseSize = await this.knowledgeRepository.count({
        where: { is_active: true },
      });

      const resolvedSolutions = await this.solutionRepository.count({
        where: { is_active: true },
      });

      // Parse average confidence safely
      let avgConfidence = 0;
      if (
        avgConfidenceResult?.avg !== null &&
        avgConfidenceResult?.avg !== undefined
      ) {
        const value = avgConfidenceResult.avg;
        avgConfidence =
          typeof value === 'string' ? parseFloat(value) : Number(value);
        avgConfidence = isNaN(avgConfidence) ? 0 : avgConfidence;
      }

      return {
        totalInteractions: totalInteractions || 0,
        averageConfidence: avgConfidence,
        knowledgeBaseSize: knowledgeBaseSize || 0,
        resolvedSolutions: resolvedSolutions || 0,
      };
    } catch (error) {
      this.logger.error('Error getting chatbot stats:', error);
      // Return empty stats instead of crashing
      return {
        totalInteractions: 0,
        averageConfidence: 0,
        knowledgeBaseSize: 0,
        resolvedSolutions: 0,
      };
    }
  }

  /**
   * Submit user feedback on chatbot interaction
   */
  async submitFeedback(
    interaction_id: string,
    feedback: {
      satisfaction_score: number;
      is_helpful: boolean;
      user_feedback?: string;
    },
  ): Promise<void> {
    const interaction = await this.interactionRepository.findOne({
      where: { interaction_id },
    });

    if (!interaction) {
      throw new BadRequestException('Interaction not found');
    }

    // Update interaction with feedback
    interaction.satisfaction_score = feedback.satisfaction_score;
    interaction.is_helpful = feedback.is_helpful;
    interaction.user_feedback = feedback.user_feedback;

    await this.interactionRepository.save(interaction);

    // If this came from a knowledge base, update its confidence
    if (interaction.knowledge_id && feedback.is_helpful !== undefined) {
      await this.updateKnowledgeConfidence(
        interaction.knowledge_id,
        feedback.is_helpful,
      );
    }

    this.logger.log(
      `Feedback received: helpful=${feedback.is_helpful}, score=${feedback.satisfaction_score}`,
    );
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(
    query: string,
    limit: number = 5,
  ): Promise<ChatbotKnowledge[]> {
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return [];
    }

    const qb = this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true');

    // Search in keywords, question, and answer
    let orConditions: string[] = [];
    keywords.forEach((keyword, idx) => {
      orConditions.push(`kb.keywords LIKE '%${keyword}%'`);
      orConditions.push(`kb.question ILIKE '%${keyword}%'`);
    });

    if (orConditions.length > 0) {
      qb.andWhere(`(${orConditions.join(' OR ')})`);
    }

    return await qb
      .orderBy('kb.confidence_score', 'DESC')
      .orderBy('kb.usage_count', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get related solutions for troubleshooting
   */
  async getRelatedSolutions(
    message: string,
    limit: number = 3,
  ): Promise<TicketSolution[]> {
    const keywords = this.extractKeywords(message);

    const qb = this.solutionRepository
      .createQueryBuilder('ts')
      .where('ts.is_active = true');

    if (keywords.length > 0) {
      let orConditions: string[] = [];
      keywords.forEach((keyword) => {
        orConditions.push(`ts.tags LIKE '%${keyword}%'`);
        orConditions.push(`ts.category ILIKE '%${keyword}%'`);
        orConditions.push(`ts.issue_type ILIKE '%${keyword}%'`);
      });

      if (orConditions.length > 0) {
        qb.andWhere(`(${orConditions.join(' OR ')})`);
      }
    }

    return await qb
      .orderBy('ts.usage_count', 'DESC')
      .orderBy('ts.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Confirm and create ticket from chatbot assistance
   */
  async confirmTicketCreation(ticketData: {
    user_id: string;
    conversation_id: string;
    category?: string;
    priority?: string;
    subject: string;
    description: string;
    asset_id?: string;
    require_approval?: boolean;
  }): Promise<{ ticket_id: string; message: string }> {
    this.logger.log(`[Chatbot] Creating ticket: ${ticketData.subject}`);

    // In real implementation, this would call the TicketService
    // For now, return a message indicating ticket would be created
    const mockTicketId = `IT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    return {
      ticket_id: mockTicketId,
      message: `✅ Ticket ${mockTicketId} has been created and is ready for IT review.`,
    };
  }

  /**
   * Get FAQ by category
   */
  async getFAQByCategory(category: string): Promise<ChatbotKnowledge[]> {
    return await this.knowledgeRepository.find({
      where: {
        category,
        is_active: true,
      },
      order: { confidence_score: 'DESC' },
    });
  }

  /**
   * Get all FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    const results = await this.knowledgeRepository
      .createQueryBuilder('kb')
      .select('DISTINCT kb.category', 'category')
      .where('kb.is_active = true')
      .getRawMany();

    return results.map((r) => r.category).filter((c) => c);
  }

  /**
   * Get most helpful responses
   */
  async getMostHelpfulResponses(
    limit: number = 10,
  ): Promise<ChatbotKnowledge[]> {
    return await this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true')
      .orderBy('kb.helpful_count', 'DESC')
      .orderBy('kb.confidence_score', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(
    conversation_id: string,
    limit: number = 5,
  ): Promise<Array<{ role: string; content: string }>> {
    const interactions = await this.interactionRepository
      .createQueryBuilder('ci')
      .where('ci.conversation_id = :conversation_id', { conversation_id })
      .orderBy('ci.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return interactions.reverse().flatMap((i) => [
      { role: 'user', content: i.user_message },
      { role: 'assistant', content: i.chatbot_response },
    ]);
  }
}
