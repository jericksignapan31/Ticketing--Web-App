import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  conversation_id!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'This is a message',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message_id!: string;

  @ApiProperty()
  conversation_id!: string;

  @ApiProperty()
  sender_id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  is_read!: boolean;

  @ApiProperty()
  created_at!: Date;
}
