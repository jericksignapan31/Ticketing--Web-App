import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';

/**
 * DTO for extracting solution from resolved ticket
 */
export class ExtractSolutionDto {
  @ApiProperty({
    example: 'TKT-20261103-0001',
    description: 'Unique ticket identifier',
  })
  @IsString()
  ticket_id: string;

  @ApiProperty({
    example: 'Monitor not detected after Windows update',
    description: 'Ticket subject line',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: 'User reported monitor showing "no signal" after Windows 11 update. Resolved by reinstalling display drivers.',
    description: 'Detailed problem description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Hardware',
    description: 'Issue category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'resolved',
    description: 'Final ticket status',
  })
  @IsString()
  status: string;

  @ApiProperty({
    example: 'Reinstalled NVIDIA drivers from manufacturer website. Issue resolved after system restart.',
    description: 'Notes on how the issue was resolved',
  })
  @IsOptional()
  @IsString()
  resolution_notes?: string;

  @ApiProperty({
    example: 45,
    description: 'Time taken to resolve in minutes',
  })
  @IsOptional()
  @IsNumber()
  resolution_time_minutes?: number;

  @ApiProperty({
    example: ['Restart device', 'Download latest drivers', 'Restart again'],
    description: 'Step-by-step resolution steps',
  })
  @IsOptional()
  @IsArray()
  resolution_steps?: string[];

  @ApiProperty({
    example: 'john.smith',
    description: 'IT staff who resolved the ticket',
  })
  @IsOptional()
  @IsString()
  assigned_to?: string;

  @ApiProperty({
    example: '2026-11-03T15:30:00Z',
    description: 'When the ticket was resolved',
  })
  @IsOptional()
  @IsString()
  resolved_at?: Date;
}

/**
 * DTO for learning service response
 */
export class LearningResultDto {
  @ApiProperty({
    example: 'uuid-string',
    description: 'Extracted solution ID',
  })
  solution_id: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'Generated KB entry ID (if created)',
  })
  knowledge_id?: string;

  @ApiProperty({
    example: 'How do I resolve display driver issues?',
    description: 'Generated FAQ question',
  })
  faq_question?: string;

  @ApiProperty({
    example: 0.75,
    description: 'Confidence score for new KB entry',
  })
  confidence_score?: number;

  @ApiProperty({
    example: true,
    description: 'Whether learning was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Solution extracted and KB populated',
    description: 'Learning operation message',
  })
  message: string;
}

/**
 * DTO for batch learning request
 */
export class BatchLearningDto {
  @ApiProperty({
    description: 'Array of resolved tickets to learn from',
    type: [ExtractSolutionDto],
  })
  @IsArray()
  tickets: ExtractSolutionDto[];
}

/**
 * DTO for batch learning response
 */
export class BatchLearningResponseDto {
  @ApiProperty({
    example: 10,
    description: 'Number of tickets processed',
  })
  processed: number;

  @ApiProperty({
    example: 9,
    description: 'Number of solutions extracted',
  })
  solutions: number;

  @ApiProperty({
    example: 8,
    description: 'Number of KB entries created or updated',
  })
  kbEntries: number;

  @ApiProperty({
    example: 'Batch learning completed successfully',
    description: 'Operation summary',
  })
  message: string;
}

/**
 * DTO for improvement recommendations
 */
export class ImprovementRecommendationDto {
  @ApiProperty({
    description: 'KB entries with low confidence scores',
    example: [
      {
        knowledge_id: 'uuid',
        question: 'How do I X?',
        confidence_score: 0.45,
        usage_count: 3,
      },
    ],
  })
  lowConfidenceEntries: Array<{
    knowledge_id: string;
    question: string;
    confidence_score: number;
    usage_count: number;
  }>;

  @ApiProperty({
    description: 'Patterns in unrecognized user messages',
    example: ['How to fix network connectivity', 'Printer offline issues'],
  })
  unknownIssuePatterns: string[];

  @ApiProperty({
    description: 'Most common escalation reasons',
    example: ['Hardware replacement needed', 'Requires physical access'],
  })
  frequentEscalations: string[];

  @ApiProperty({
    example: 'Review items below to improve chatbot training',
    description: 'Recommendation summary',
  })
  summary: string;
}

/**
 * DTO for syncing confidence scores
 */
export class SyncConfidenceDto {
  @ApiProperty({
    example: 15,
    description: 'Number of KB entries updated',
  })
  updated: number;

  @ApiProperty({
    example: 'Confidence scores synced with user feedback',
    description: 'Operation message',
  })
  message: string;
}
