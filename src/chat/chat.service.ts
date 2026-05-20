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
    // Add current user as participant and normalize IDs to strings
    const participants = (createConversationDto.participant_ids || [])
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);

    // Ensure current user is in participants
    const normalizedUserId = String(userId).trim();
    if (!participants.some((p) => p.toLowerCase() === normalizedUserId.toLowerCase())) {
      participants.push(normalizedUserId);
    }

    console.log(`[Chat createConversation] Creating conversation with participants:`, {
      providedParticipants: createConversationDto.participant_ids,
      currentUserId: userId,
      normalizedUserId: normalizedUserId,
      finalParticipants: participants,
    });

    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      participant_ids: participants,
    });

    const saved = await this.conversationRepository.save(conversation);
    console.log(`[Chat createConversation] Conversation saved:`, {
      conversationId: saved.conversation_id,
      participants: saved.participant_ids,
    });

    return saved;
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

  /**
   * Get all conversations with all their messages in one call
   * Perfect for chat UI initialization - no need for multiple API calls
   */
  async getAllConversationsWithMessages(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.messages', 'm')
      .where('c.participant_ids LIKE :userId', { userId: `%${userId}%` })
      .orWhere('c.ticket_id IS NOT NULL')
      .orderBy('c.updated_at', 'DESC')
      .addOrderBy('m.created_at', 'ASC')
      .getMany();

    console.log(`[Chat getAllConversationsWithMessages] Loaded ${conversations.length} conversations with messages for user ${userId}`);
    
    return conversations;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const result = await this.conversationRepository.delete(conversationId);
    if (result.affected === 0) {
      throw new NotFoundException('Conversation not found');
    }
  }

  // ============ MESSAGE METHODS ============

  /**
   * Normalize and check if user is participant
   * Handles type mismatches between UUID and string formats
   */
  private isUserParticipant(participantIds: string[] | undefined, userId: string): boolean {
    if (!participantIds || participantIds.length === 0) {
      return false;
    }

    const normalizedUserId = String(userId).toLowerCase().trim();
    return participantIds.some(
      (id) => String(id).toLowerCase().trim() === normalizedUserId,
    );
  }

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

    console.log(`[Chat sendMessage] Checking participant:`, {
      conversationId: createMessageDto.conversation_id,
      userId: userId,
      participantIds: conversation.participant_ids,
      conversationType: conversation.type,
    });

    // Verify user is participant (with type normalization)
    const isDirectParticipant = this.isUserParticipant(
      conversation.participant_ids,
      userId,
    );
    const isTicketConversation = conversation.type === 'TICKET';

    console.log(`[Chat sendMessage] Participant check result:`, {
      isDirectParticipant,
      isTicketConversation,
      allowed: isDirectParticipant || isTicketConversation,
    });

    if (!isDirectParticipant && !isTicketConversation) {
      console.error(
        `[Chat] User ${userId} not in participants:`,
        conversation.participant_ids,
      );
      throw new BadRequestException(
        `User is not a participant in this chat. Participants: ${conversation.participant_ids?.join(', ') || 'none'}`,
      );
    }

    try {
      const message = this.messageRepository.create({
        conversation_id: createMessageDto.conversation_id,
        sender_id: userId,
        content: createMessageDto.content,
        is_read: false,
      });

      console.log(`[Chat sendMessage] Creating message:`, {
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content_length: message.content?.length,
      });

      const savedMessage = await this.messageRepository.save(message);

      console.log(`[Chat sendMessage] Message saved successfully:`, {
        message_id: savedMessage.message_id,
        conversation_id: savedMessage.conversation_id,
      });

      // Update conversation updated_at timestamp
      await this.conversationRepository.update(
        { conversation_id: createMessageDto.conversation_id },
        { updated_at: new Date() },
      );

      return savedMessage;
    } catch (error) {
      console.error(`[Chat sendMessage] Error creating/saving message:`, {
        error: error instanceof Error ? error.message : String(error),
        conversationId: createMessageDto.conversation_id,
        userId: userId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
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
    // Normalize IDs
    const normalizedCurrentUserId = String(currentUserId).trim().toLowerCase();
    const normalizedOtherUserId = String(otherUserId).trim().toLowerCase();

    // Check if direct conversation already exists
    const conversations = await this.conversationRepository.find({
      where: {
        type: 'DIRECT' as any,
      },
    });

    const existingConversation = conversations.find((c) => {
      if (!c.participant_ids || c.participant_ids.length < 2) return false;
      const normalizedParticipants = c.participant_ids.map((id) =>
        String(id).trim().toLowerCase(),
      );
      return (
        normalizedParticipants.includes(normalizedCurrentUserId) &&
        normalizedParticipants.includes(normalizedOtherUserId)
      );
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new direct conversation
    const newConversation = new Conversation();
    newConversation.type = 'DIRECT' as ConversationType;
    newConversation.name = `Chat between ${currentUserId} and ${otherUserId}`;
    newConversation.participant_ids = [
      String(currentUserId).trim(),
      String(otherUserId).trim(),
    ];

    return this.conversationRepository.save(newConversation);
  }
}
