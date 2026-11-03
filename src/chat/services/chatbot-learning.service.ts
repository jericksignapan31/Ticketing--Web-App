import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketSolution } from '../entities/ticket-solution.entity';
import { ChatbotKnowledge } from '../entities/chatbot-knowledge.entity';
import { ChatbotInteraction, ChatbotResponseType } from '../entities/chatbot-interaction.entity';

interface ResolvedTicket {
  ticket_id: string;
  subject: string;
  description: string;
  category?: string;
  status: string;
  resolution_notes?: string;
  resolution_time_minutes?: number;
  assigned_to?: string;
  resolved_at?: Date;
}

@Injectable()
export class ChatbotLearningService {
  private readonly logger = new Logger('ChatbotLearningService');

  constructor(
    @InjectRepository(TicketSolution)
    private solutionRepository: Repository<TicketSolution>,
    @InjectRepository(ChatbotKnowledge)
    private knowledgeRepository: Repository<ChatbotKnowledge>,
    @InjectRepository(ChatbotInteraction)
    private interactionRepository: Repository<ChatbotInteraction>,
  ) {}

  /**
   * Extract and store solution from resolved ticket
   */
  async extractSolutionFromTicket(ticket: ResolvedTicket): Promise<TicketSolution> {
    this.logger.log(`[Learning] Extracting solution from ticket: ${ticket.ticket_id}`);

    // Check if solution already exists
    const existingSolution = await this.solutionRepository.findOne({
      where: { ticket_id: ticket.ticket_id },
    });

    if (existingSolution) {
      this.logger.log(`Solution already exists for ticket ${ticket.ticket_id}`);
      return existingSolution;
    }

    // Extract keywords from subject and description
    const keywords = this.extractKeywords(
      `${ticket.subject} ${ticket.description}`.toLowerCase(),
    );

    // Categorize the issue
    const issueType = this.categorizeIssueType(ticket.category || '');

    // Generate solution summary
    const solutionSummary = this.generateSolutionSummary(ticket);

    // Create solution record
    const solution = this.solutionRepository.create({
      ticket_id: ticket.ticket_id,
      category: ticket.category,
      issue_type: issueType,
      solution_summary: solutionSummary,
      resolution_notes: ticket.resolution_notes,
      resolution_time_minutes: ticket.resolution_time_minutes,
      tags: keywords,
      prevent_tips: this.generatePreventionTips(ticket),
      is_active: true,
      usage_count: 0,
    });

    const savedSolution = await this.solutionRepository.save(solution);
    this.logger.log(`✅ Solution extracted: ${savedSolution.solution_id}`);

    return savedSolution;
  }

  /**
   * Auto-populate knowledge base from ticket solution
   */
  async populateKBFromSolution(solution: TicketSolution): Promise<ChatbotKnowledge | null> {
    this.logger.log(`[Learning] Populating KB from solution: ${solution.solution_id}`);

    // Check if similar KB entry exists
    const existingEntry = await this.findSimilarKBEntry(solution);

    if (existingEntry) {
      this.logger.log(`Similar KB entry exists, updating instead of creating new`);
      // Update existing entry with new information
      return await this.enrichKBEntry(existingEntry, solution);
    }

    // Generate FAQ question from solution
    const question = this.generateFAQQuestion(solution);
    const answer = this.generateFAQAnswer(solution);

    // Create KB entry
    const kbEntry = this.knowledgeRepository.create({
      category: solution.category || 'General IT Issues',
      question,
      answer,
      keywords: solution.tags || [],
      relevant_ticket_ids: [solution.ticket_id],
      confidence_score: 0.75, // Start with medium confidence
      usage_count: 0,
      helpful_count: 0,
      is_active: true,
    });

    const savedEntry = await this.knowledgeRepository.save(kbEntry);
    this.logger.log(`✅ KB entry created: ${savedEntry.knowledge_id}`);

    // Link solution to KB entry
    solution.tags = solution.tags || [];
    if (!solution.tags.includes(`kb:${savedEntry.knowledge_id}`)) {
      solution.tags.push(`kb:${savedEntry.knowledge_id}`);
      await this.solutionRepository.save(solution);
    }

    return savedEntry;
  }

  /**
   * Update confidence score based on ticket resolution
   */
  async updateConfidenceFromResolution(
    ticket: ResolvedTicket,
    kbEntry: ChatbotKnowledge,
  ): Promise<void> {
    this.logger.log(
      `[Learning] Updating confidence for KB entry: ${kbEntry.knowledge_id}`,
    );

    // If resolution was successful (implied by status = 'resolved'), increase confidence
    if (ticket.status.toLowerCase().includes('resolved') || ticket.status === 'closed') {
      kbEntry.confidence_score = Math.min(1.0, kbEntry.confidence_score + 0.1);
      this.logger.log(`✅ Confidence increased: ${kbEntry.confidence_score}`);
    }

    await this.knowledgeRepository.save(kbEntry);
  }

  /**
   * Batch learn from recent resolutions
   */
  async batchLearnFromTickets(tickets: ResolvedTicket[]): Promise<{
    processed: number;
    solutions: number;
    kbEntries: number;
  }> {
    this.logger.log(`[Learning] Batch processing ${tickets.length} tickets`);

    let solutionCount = 0;
    let kbCount = 0;

    for (const ticket of tickets) {
      try {
        // Extract solution
        const solution = await this.extractSolutionFromTicket(ticket);
        solutionCount++;

        // Populate KB
        const kbEntry = await this.populateKBFromSolution(solution);
        if (kbEntry) {
          kbCount++;
          // Update confidence
          await this.updateConfidenceFromResolution(ticket, kbEntry);
        }
      } catch (error) {
        this.logger.error(`Failed to learn from ticket ${ticket.ticket_id}:`, error);
      }
    }

    this.logger.log(
      `✅ Batch learning complete: ${solutionCount} solutions, ${kbCount} KB entries`,
    );

    return {
      processed: tickets.length,
      solutions: solutionCount,
      kbEntries: kbCount,
    };
  }

  /**
   * Get recommendations for chatbot improvement
   */
  async getImprovementRecommendations(): Promise<{
    lowConfidenceEntries: ChatbotKnowledge[];
    unknownIssuePatterns: string[];
    frequentEscalations: string[];
  }> {
    // Low confidence KB entries (< 0.6)
    const lowConfidence = await this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true')
      .andWhere('kb.confidence_score < :threshold', { threshold: 0.6 })
      .orderBy('kb.usage_count', 'DESC')
      .limit(5)
      .getMany();

    // Unknown issue patterns (GENERAL intents with low confidence)
    const unknownPatterns = await this.interactionRepository
      .createQueryBuilder('ci')
      .where('ci.detected_intent = :intent', { intent: 'GENERAL' })
      .andWhere('ci.intent_confidence < :confidence', { confidence: 0.5 })
      .select('ci.user_message', 'message')
      .groupBy('ci.user_message')
      .limit(5)
      .getRawMany();

    // Frequent escalations
    const escalations = await this.interactionRepository
      .createQueryBuilder('ci')
      .where('ci.response_type = :type', { type: ChatbotResponseType.ESCALATION })
      .select('ci.user_message', 'message')
      .groupBy('ci.user_message')
      .limit(5)
      .getRawMany();

    return {
      lowConfidenceEntries: lowConfidence,
      unknownIssuePatterns: unknownPatterns.map((r) => r.message),
      frequentEscalations: escalations.map((r) => r.message),
    };
  }

  /**
   * Find similar KB entry by keywords
   */
  private async findSimilarKBEntry(solution: TicketSolution): Promise<ChatbotKnowledge | null> {
    if (!solution.tags || solution.tags.length === 0) {
      return null;
    }

    const query = this.knowledgeRepository
      .createQueryBuilder('kb')
      .where('kb.is_active = true');

    // Search by keywords
    let orConditions: string[] = [];
    solution.tags.slice(0, 3).forEach((tag) => {
      orConditions.push(`kb.keywords LIKE '%${tag}%'`);
    });

    if (orConditions.length > 0) {
      query.andWhere(`(${orConditions.join(' OR ')})`);
    }

    return await query.orderBy('kb.confidence_score', 'DESC').getOne();
  }

  /**
   * Enrich existing KB entry with solution info
   */
  private async enrichKBEntry(
    entry: ChatbotKnowledge,
    solution: TicketSolution,
  ): Promise<ChatbotKnowledge> {
    // Add ticket to relevant tickets
    if (!entry.relevant_ticket_ids) {
      entry.relevant_ticket_ids = [];
    }
    if (!entry.relevant_ticket_ids.includes(solution.ticket_id)) {
      entry.relevant_ticket_ids.push(solution.ticket_id);
    }

    // Merge keywords
    if (solution.tags) {
      entry.keywords = [...new Set([...(entry.keywords || []), ...solution.tags])];
    }

    // Increase confidence slightly
    entry.confidence_score = Math.min(0.95, entry.confidence_score + 0.05);

    return await this.knowledgeRepository.save(entry);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopwords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'my', 'your', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'can', 'could', 'would', 'should', 'do', 'does', 'did',
    ];

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !stopwords.includes(word) &&
          !/[^a-z0-9]/.test(word),
      )
      .slice(0, 8);
  }

  /**
   * Categorize issue type
   */
  private categorizeIssueType(category: string): string {
    const categoryMap: Record<string, string> = {
      'hardware': 'Hardware Issue',
      'software': 'Software Issue',
      'network': 'Network Issue',
      'password': 'Access Issue',
      'email': 'Communication',
      'printer': 'Peripherals',
      'monitor': 'Peripherals',
      'laptop': 'Hardware',
      'keyboard': 'Hardware',
      'mouse': 'Hardware',
    };

    return categoryMap[category.toLowerCase()] || 'IT Issue';
  }

  /**
   * Generate solution summary from ticket
   */
  private generateSolutionSummary(ticket: ResolvedTicket): string {
    if (ticket.resolution_notes) {
      return ticket.resolution_notes.substring(0, 200);
    }

    return `Issue: ${ticket.subject}. Status: Resolved. Time to resolution: ${ticket.resolution_time_minutes || 'Unknown'} minutes.`;
  }

  /**
   * Generate FAQ question from solution
   */
  private generateFAQQuestion(solution: TicketSolution): string {
    if (solution.solution_summary) {
      // Extract a question-like format
      return `How to: ${solution.solution_summary.substring(0, 50)}?`;
    }

    return `How do I resolve: ${solution.issue_type || 'this issue'}?`;
  }

  /**
   * Generate FAQ answer from solution
   */
  private generateFAQAnswer(solution: TicketSolution): string {
    let answer = '';

    if (solution.resolution_steps && solution.resolution_steps.length > 0) {
      answer += '**Steps to resolve:**\n';
      solution.resolution_steps.forEach((step, idx) => {
        answer += `${idx + 1}. ${step}\n`;
      });
      answer += '\n';
    }

    if (solution.resolution_notes) {
      answer += `**Details:** ${solution.resolution_notes}\n\n`;
    }

    if (solution.prevent_tips && solution.prevent_tips.length > 0) {
      answer += '**Prevention tips:**\n';
      solution.prevent_tips.forEach((tip) => {
        answer += `- ${tip}\n`;
      });
    }

    return answer || `See resolution notes for details on: ${solution.category}`;
  }

  /**
   * Generate prevention tips from ticket
   */
  private generatePreventionTips(ticket: ResolvedTicket): string[] {
    const tips: string[] = [];

    if (ticket.resolution_notes?.toLowerCase().includes('update')) {
      tips.push('Keep your software and drivers up to date');
    }

    if (ticket.resolution_notes?.toLowerCase().includes('restart')) {
      tips.push('Restart your device regularly');
    }

    if (ticket.resolution_notes?.toLowerCase().includes('password')) {
      tips.push('Use strong, unique passwords');
      tips.push('Change passwords regularly');
    }

    if (ticket.resolution_notes?.toLowerCase().includes('backup')) {
      tips.push('Maintain regular backups of important files');
    }

    if (tips.length === 0) {
      tips.push('Follow IT best practices for your category');
      tips.push('Report issues immediately to prevent escalation');
    }

    return tips.slice(0, 3);
  }

  /**
   * Sync confidence scores with feedback data
   */
  async syncConfidenceWithFeedback(): Promise<{ updated: number }> {
    this.logger.log('[Learning] Syncing confidence scores with feedback data');

    // Get all KB entries
    const entries = await this.knowledgeRepository.find({ where: { is_active: true } });
    let updatedCount = 0;

    for (const entry of entries) {
      // Get interactions for this knowledge entry
      const interactions = await this.interactionRepository.find({
        where: { knowledge_id: entry.knowledge_id },
      });

      if (interactions.length === 0) continue;

      // Calculate feedback score
      const helpful = interactions.filter((i) => i.is_helpful === true).length;
      const total = interactions.filter((i) => i.is_helpful !== null).length;

      if (total > 0) {
        const helpfulRatio = helpful / total;
        const avgRating =
          interactions.reduce((sum, i) => sum + (i.satisfaction_score || 0), 0) / total;

        // Adjust confidence based on feedback
        const newConfidence = (helpfulRatio * 0.6 + avgRating / 5 * 0.4);
        entry.confidence_score = Math.round(newConfidence * 100) / 100;

        await this.knowledgeRepository.save(entry);
        updatedCount++;
      }
    }

    this.logger.log(`✅ Updated ${updatedCount} KB entries from feedback`);
    return { updated: updatedCount };
  }
}
