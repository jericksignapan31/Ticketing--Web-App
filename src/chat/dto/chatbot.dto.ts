import { IsString, IsUUID, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChatbotResponseType } from '../entities/chatbot-interaction.entity';

/**
 * DTO for sending a message to chatbot
 */
export class ChatbotMessageDto {
  @ApiProperty({ example: 'e3f2a1b0-5c8d-4e2f-8a1b-3c5d7e9f2a4b' })
  @IsUUID()
  conversation_id!: string;

  @ApiProperty({ example: 'How do I reset my password?' })
  @IsString()
  message!: string;
}

/**
 * DTO for chatbot response
 */
export class ChatbotResponseDto {
  @ApiProperty({ example: 'To reset your password, follow these steps...' })
  response!: string;

  @ApiProperty({ example: 'FAQ' })
  intent!: string;

  @ApiProperty({ example: 0.85, description: 'Confidence score 0-1' })
  confidence!: number;

  @ApiProperty({ example: 'GENERAL', enum: ChatbotResponseType })
  responseType!: ChatbotResponseType;

  @ApiProperty({ example: 'uuid-here', description: 'Interaction ID for tracking' })
  interactionId!: string;

  @ApiProperty({ required: false, nullable: true })
  suggestedAction?: {
    type: string;
    data?: any;
  };
}

/**
 * DTO for adding knowledge base entry (Admin only)
 */
export class CreateKnowledgeEntryDto {
  @ApiProperty({ example: 'Password Management' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'How do I reset my password?' })
  @IsString()
  question!: string;

  @ApiProperty({
    example: 'To reset your password, visit the login page and click "Forgot Password"...',
  })
  @IsString()
  answer!: string;

  @ApiProperty({ example: ['password', 'reset', 'account'], required: false })
  @IsOptional()
  keywords?: string[];
}

/**
 * DTO for knowledge base entry response
 */
export class KnowledgeEntryResponseDto {
  @ApiProperty()
  knowledge_id!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty()
  answer!: string;

  @ApiProperty()
  confidence_score!: number;

  @ApiProperty()
  usage_count!: number;

  @ApiProperty()
  helpful_count!: number;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}

/**
 * DTO for submitting feedback on chatbot response
 */
export class ChatbotFeedbackDto {
  @ApiProperty({ example: 'e3f2a1b0-5c8d-4e2f-8a1b-3c5d7e9f2a4b' })
  @IsUUID()
  interaction_id!: string;

  @ApiProperty({ example: 5, description: 'Rating 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction_score!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_helpful!: boolean;

  @ApiProperty({
    example: 'Could have been more detailed',
    required: false,
  })
  @IsOptional()
  @IsString()
  user_feedback?: string;
}

/**
 * DTO for knowledge base search
 */
export class KnowledgeSearchDto {
  @ApiProperty({ example: 'password reset' })
  @IsString()
  query!: string;

  @ApiProperty({ example: 5, required: false, description: 'Number of results' })
  @IsOptional()
  @IsInt()
  limit?: number;
}

/**
 * DTO for ticket creation from chat
 */
export class ChatbotTicketCreationDto {
  @ApiProperty({ example: 'e3f2a1b0-5c8d-4e2f-8a1b-3c5d7e9f2a4b' })
  @IsUUID()
  conversation_id!: string;

  @ApiProperty({ example: 'Hardware', description: 'Category extracted from chatbot' })
  @IsString()
  category?: string;

  @ApiProperty({ example: 'High', description: 'Priority extracted from chatbot' })
  @IsString()
  priority?: string;

  @ApiProperty({ example: 'Monitor not turning on' })
  @IsString()
  subject!: string;

  @ApiProperty({ example: 'External monitor connected to laptop is not turning on' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'uuid-of-asset', required: false })
  @IsOptional()
  @IsUUID()
  asset_id?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;
}

/**
 * DTO for chatbot statistics response
 */
export class ChatbotStatsDto {
  @ApiProperty({ example: 150 })
  totalInteractions!: number;

  @ApiProperty({ example: 0.82 })
  averageConfidence!: number;

  @ApiProperty({ example: 45 })
  knowledgeBaseSize!: number;

  @ApiProperty({ example: 23 })
  resolvedSolutions!: number;
}
