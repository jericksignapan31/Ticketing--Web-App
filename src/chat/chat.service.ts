import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { CreateMessageDto } from './dto/message.dto';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  // ============ CONVERSATION METHODS ============

  async createConversation(
    createConversationDto: CreateConversationDto,
    userId: string,
  ): Promise<Conversation> {
    // Add current user as participant
    const participants = createConversationDto.participant_ids || [];
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      participant_ids: participants,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversations(userId: string, page: number = 1, limit: number = 50): Promise<{ data: Conversation[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [conversations, total] = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.messages', 'm')
      .where('c.participant_ids LIKE :userId', { userId: `%${userId}%` })
      .orWhere('c.ticket_id IS NOT NULL')
      .orderBy('c.updated_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: conversations,
      total,
      page,
      limit,
    };
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
      relations: ['messages', 'messages.sender'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const result = await this.conversationRepository.delete(conversationId);
    if (result.affected === 0) {
      throw new NotFoundException('Conversation not found');
    }
  }

  // ============ MESSAGE METHODS ============

  async sendMessage(
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<Message> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: createMessageDto.conversation_id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is participant
    const isParticipant =
      conversation.participant_ids?.includes(userId) ||
      conversation.type === 'TICKET';

    if (!isParticipant) {
      throw new BadRequestException('User is not a participant in this chat');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      sender_id: userId,
    });

    // Update conversation updated_at timestamp
    await this.conversationRepository.update(
      { conversation_id: createMessageDto.conversation_id },
      { updated_at: new Date() },
    );

    return this.messageRepository.save(message);
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .leftJoinAndSelect('m.sender', 'sender')
      .orderBy('m.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    return messages.reverse(); // Return in chronological order
  }

  async markAsRead(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { message_id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.is_read = true;
    return this.messageRepository.save(message);
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .execute();
  }

  async deleteMessage(messageId: string): Promise<void> {
    const result = await this.messageRepository.delete(messageId);
    if (result.affected === 0) {
      throw new NotFoundException('Message not found');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.messageRepository.count({
      where: {
        is_read: false,
        sender_id: userId,
      },
    });

    return count;
  }

  async createDirectConversation(
    otherUserId: string,
    currentUserId: string,
  ): Promise<Conversation> {
    // Check if direct conversation already exists
    const conversations = await this.conversationRepository.find({
      where: {
        type: 'DIRECT' as any,
      },
    });

    let conversation = conversations.find((c) =>
      c.participant_ids?.includes(otherUserId),
    );

    if (
      conversation &&
      conversation.participant_ids?.includes(currentUserId)
    ) {
      return conversation;
    }

    // Create new direct conversation
    const newConversation = new Conversation();
    newConversation.type = 'DIRECT' as ConversationType;
    newConversation.name = `Chat between ${currentUserId} and ${otherUserId}`;
    newConversation.participant_ids = [currentUserId, otherUserId];

    return this.conversationRepository.save(newConversation);
  }
}
