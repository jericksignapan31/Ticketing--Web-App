import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotKnowledge } from '../entities/chatbot-knowledge.entity';
import { ChatbotInteraction, ChatbotResponseType } from '../entities/chatbot-interaction.entity';
import { TicketSolution } from '../entities/ticket-solution.entity';
import { GeminiService } from './gemini.service';

export interface ChatbotRequest {
  user_id: string;
  conversation_id: string;
  message: string;
  userRole?: string;
  userDepartment?: string;
  recentTickets?: any[];
  conversationHistory?: Array<{ role: string; content: string }>;
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

    // Step 1: Detect intent
    const intentDetection = await this.geminiService.detectIntent(message);
    const { intent, confidence } = intentDetection;

    this.logger.log(`Intent: ${intent} (confidence: ${confidence})`);

    // Step 2: Process based on intent
    let response: string;
    let responseType: ChatbotResponseType;
    let suggestedAction: any = null;

    try {
      switch (intent) {
        case 'FAQ':
          const faqResult = await this.handleFAQ(message);
          response = faqResult.answer;
          responseType = ChatbotResponseType.FAQ;
          break;

        case 'TICKET_CREATION':
          const ticketResult = await this.handleTicketCreation(message);
          response = ticketResult.response;
          responseType = ChatbotResponseType.TICKET_CREATION;
          suggestedAction = ticketResult.suggestedAction;
          break;

        case 'TROUBLESHOOTING':
          const troubleResult = await this.handleTroubleshooting(message);
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
          const generalResult = await this.handleGeneral(message, request);
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
  private async handleFAQ(message: string): Promise<{ answer: string }> {
    // Try to find in knowledge base first
    const keywords = this.extractKeywords(message);
    const kbEntry = await this.searchKnowledgeBase(keywords);

    if (kbEntry && kbEntry.confidence_score >= this.CONFIDENCE_THRESHOLD) {
      // Update usage count
      await this.knowledgeRepository.update(
        { knowledge_id: kbEntry.knowledge_id },
        { usage_count: () => 'usage_count + 1' },
      );

      return {
        answer: kbEntry.answer,
      };
    }

    // Fallback to Gemini if not found in KB
    const geminiResponse = await this.geminiService.generateResponse(message);
    return {
      answer: geminiResponse.text,
    };
  }

  /**
   * Handle ticket creation requests
   */
  private async handleTicketCreation(message: string): Promise<{
    response: string;
    suggestedAction?: any;
  }> {
    const ticketInfo = await this.geminiService.extractTicketInfo(message);

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
  private async handleTroubleshooting(message: string): Promise<{
    response: string;
    suggestedAction?: any;
  }> {
    // Search for similar solutions in ticket history
    const similarSolutions = await this.findSimilarSolutions(message);

    if (similarSolutions.length > 0) {
      const solution = similarSolutions[0];
      const steps = solution.resolution_steps?.join('\n') || '';

      const response = `I found a similar issue that was resolved. Here are the steps:\n\n${steps}\n\n❓ Did this help resolve your issue? If not, I can help you create a support ticket.`;

      return {
        response,
        suggestedAction: {
          type: 'CREATE_TICKET_IF_NEEDED',
          data: { solution_id: solution.solution_id },
        },
      };
    }

    // Generate troubleshooting steps with Gemini
    const geminiResponse = await this.geminiService.generateResponse(
      `Provide clear troubleshooting steps for: ${message}`,
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
  private async handleTicketStatus(message: string): Promise<{ response: string }> {
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
  private async handleEscalation(message: string): Promise<{ response: string }> {
    const response = `I understand you need immediate assistance. 🚨\n\n**Next Steps:**\n1. **Create a support ticket** - This will route your issue to our IT team\n2. **Call IT Support** - ext. 1234 (M-F, 8AM-5PM)\n3. **Email:** it-support@company.com\n\nWould you like me to help you create a support ticket? If yes, please describe your issue.`;

    return { response };
  }

  /**
   * Handle general conversations
   */
  private async handleGeneral(
    message: string,
    request: ChatbotRequest,
  ): Promise<{ response: string }> {
    const geminiResponse = await this.geminiService.generateResponse(message, {
      userRole: request.userRole,
      userDepartment: request.userDepartment,
      recentTickets: request.recentTickets,
    });

    return { response: geminiResponse.text };
  }

  /**
   * Search knowledge base by keywords
   */
  private async searchKnowledgeBase(keywords: string[]): Promise<ChatbotKnowledge | null> {
    if (keywords.length === 0) {
      return null;
    }

    // Search for matching entries with highest confidence
    const query = this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true')
      .andWhere('kb.confidence_score >= :minConfidence', { minConfidence: 0.5 })
      .orderBy('kb.confidence_score', 'DESC')
      .orderBy('kb.usage_count', 'DESC')
      .limit(1);

    // Add keyword filters
    let whereCondition = '(';
    keywords.forEach((keyword, idx) => {
      if (idx > 0) whereCondition += ' OR ';
      whereCondition += `kb.keywords LIKE '%${keyword}%'`;
    });
    whereCondition += ')';

    query.andWhere(whereCondition);

    return await query.getOne();
  }

  /**
   * Find similar solutions from resolved tickets
   */
  private async findSimilarSolutions(message: string): Promise<TicketSolution[]> {
    const keywords = this.extractKeywords(message);

    const query = this.solutionRepository
      .createQueryBuilder('ts')
      .where('ts.is_active = true')
      .orderBy('ts.usage_count', 'DESC')
      .limit(3);

    // Filter by keywords in tags, category, or issue_type
    if (keywords.length > 0) {
      let whereCondition = '(';
      keywords.forEach((keyword, idx) => {
        if (idx > 0) whereCondition += ' OR ';
        whereCondition += `ts.tags LIKE '%${keyword}%' OR ts.category LIKE '%${keyword}%'`;
      });
      whereCondition += ')';
      query.andWhere(whereCondition);
    }

    return await query.getMany();
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    const stopwords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'my', 'your', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'can', 'could', 'would', 'should', 'do', 'does', 'did',
      'how', 'what', 'where', 'when', 'why', 'which', 'who',
    ];

    return message
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !stopwords.includes(word) &&
          !/[^a-z0-9]/.test(word),
      )
      .slice(0, 5);
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
      entry.confidence_score = Math.min(
        1.0,
        entry.confidence_score + 0.05,
      );
    } else {
      // Decrease confidence score
      entry.confidence_score = Math.max(
        0.0,
        entry.confidence_score - 0.1,
      );
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
    const totalInteractions = await this.interactionRepository.count();
    const avgConfidenceResult = await this.interactionRepository
      .createQueryBuilder()
      .select('AVG(intent_confidence)', 'avg')
      .getRawOne();

    const knowledgeBaseSize = await this.knowledgeRepository.count({
      where: { is_active: true },
    });

    const resolvedSolutions = await this.solutionRepository.count({
      where: { is_active: true },
    });

    return {
      totalInteractions,
      averageConfidence: avgConfidenceResult?.avg || 0,
      knowledgeBaseSize,
      resolvedSolutions,
    };
  }
}
