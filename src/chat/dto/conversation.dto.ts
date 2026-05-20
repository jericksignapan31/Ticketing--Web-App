import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Conversation type (DIRECT, TICKET, or GROUP)',
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType)
  type!: ConversationType;

  @ApiProperty({
    description: 'Conversation name',
    example: 'Chat with John',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Participant user IDs',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsOptional()
  participant_ids?: string[];

  @ApiProperty({
    description: 'Ticket ID (if type is TICKET)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  ticket_id?: string;
}

export class ConversationResponseDto {
  @ApiProperty()
  conversation_id!: string;

  @ApiProperty()
  type!: ConversationType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  participant_ids?: string[];

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
