import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { FileAttachment } from './entities/file-attachment.entity';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { CreateMessageDto } from './dto/message.dto';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ChatService {
  private readonly GENERAL_CHAT_NAME = 'General';

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(FileAttachment)
    private attachmentRepository: Repository<FileAttachment>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  // ============ GENERAL CHAT INITIALIZATION ============

  /**
   * Ensures a general group chat exists that all users can access
   */
  async initializeGeneralChat(): Promise<Conversation> {
    // Check if general chat already exists
    const existingGeneral = await this.conversationRepository.findOne({
      where: {
        name: this.GENERAL_CHAT_NAME,
        type: ConversationType.GROUP,
      },
    });

    if (existingGeneral) {
      return existingGeneral;
    }

    // Create general chat
    const generalChat = this.conversationRepository.create({
      name: this.GENERAL_CHAT_NAME,
      type: ConversationType.GROUP,
      participant_ids: [], // Empty array means all users can access
    });

    const saved = await this.conversationRepository.save(generalChat);
    console.log(`[Chat] General chat created: ${saved.conversation_id}`);
    return saved;
  }

  /**
   * Get the general chat (creates if doesn't exist)
   */
  async getGeneralChat(): Promise<Conversation> {
    return this.initializeGeneralChat();
  }

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
    try {
      const skip = (page - 1) * limit;

      // Get user's personal conversations (where they're a participant)
      const personalConversations = await this.conversationRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.messages', 'm')
        .leftJoinAndSelect('m.sender', 's')
        .leftJoinAndSelect('s.employee', 'e')
        .where(`c.participant_ids::text LIKE :userId`, { userId: `%${userId}%` })
        .orderBy('c.updated_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      // Get all group chats visible to everyone (general + public groups)
      const groupConversations = await this.conversationRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.messages', 'm')
        .leftJoinAndSelect('m.sender', 's')
        .leftJoinAndSelect('s.employee', 'e')
        .where('c.type = :type', { type: ConversationType.GROUP })
        .orderBy('c.updated_at', 'DESC')
        .getMany();

      // Combine and deduplicate
      const allConversations = [...personalConversations[0], ...groupConversations];
      const uniqueConversations = Array.from(
        new Map(allConversations.map(c => [c.conversation_id, c])).values()
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
       .slice(skip, skip + limit);

      const total = uniqueConversations.length;

      return {
        data: uniqueConversations,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('[Chat getConversations] Error loading conversations:', error);
      return { data: [], total: 0, page, limit };
    }
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository
      .createQueryBuilder('c')
      .where('c.conversation_id = :conversationId', { conversationId })
      .leftJoinAndSelect('c.messages', 'm')
      .leftJoinAndSelect('m.sender', 's')
      .leftJoinAndSelect('s.employee', 'e')
      .orderBy('m.created_at', 'ASC')
      .getOne();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Get all conversations with all their messages in one call
   * Perfect for chat UI initialization - no need for multiple API calls
   * Now includes group chats visible to all users
   */
  async getAllConversationsWithMessages(userId: string): Promise<Conversation[]> {
    try {
      // Get user's personal conversations (where they're a participant)
      const personalConversations = await this.conversationRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.messages', 'm')
        .leftJoinAndSelect('m.sender', 's')
        .leftJoinAndSelect('s.employee', 'e')
        .where(`c.participant_ids::text LIKE :userId`, { userId: `%${userId}%` })
        .orderBy('c.updated_at', 'DESC')
        .addOrderBy('m.created_at', 'ASC')
        .getMany();

      // Get all group chats visible to everyone
      const groupConversations = await this.conversationRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.messages', 'm')
        .leftJoinAndSelect('m.sender', 's')
        .leftJoinAndSelect('s.employee', 'e')
        .where('c.type = :type', { type: ConversationType.GROUP })
        .orderBy('c.updated_at', 'DESC')
        .addOrderBy('m.created_at', 'ASC')
        .getMany();

      // Combine and deduplicate
      const allConversations = [...personalConversations, ...groupConversations];
      const uniqueConversations = Array.from(
        new Map(allConversations.map(c => [c.conversation_id, c])).values()
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      console.log(`[Chat getAllConversationsWithMessages] ✅ Loaded ${uniqueConversations.length} conversations with messages for user ${userId}`);
      
      return uniqueConversations;
    } catch (error: any) {
      console.error('[Chat getAllConversationsWithMessages] ❌ Error loading conversations:', error);
      throw new BadRequestException(`Failed to load conversations: ${error?.message || 'Unknown error'}`);
    }
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

    // Verify user is allowed to send message
    const isDirectParticipant = this.isUserParticipant(
      conversation.participant_ids,
      userId,
    );
    const isTicketConversation = conversation.type === ConversationType.TICKET;
    const isGroupConversation = conversation.type === ConversationType.GROUP;

    console.log(`[Chat sendMessage] Participant check result:`, {
      isDirectParticipant,
      isTicketConversation,
      isGroupConversation,
      allowed: isDirectParticipant || isTicketConversation || isGroupConversation,
    });

    // Allow: direct participants, ticket conversations, or any user in group chats
    if (!isDirectParticipant && !isTicketConversation && !isGroupConversation) {
      console.error(
        `[Chat] User ${userId} not allowed to send message. Conversation type: ${conversation.type}`,
        conversation.participant_ids,
      );
      throw new BadRequestException(
        `User is not allowed to send messages in this chat.`,
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

      // Reload message with sender and employee details
      const messageWithDetails = await this.messageRepository
        .createQueryBuilder('m')
        .where('m.message_id = :messageId', { messageId: savedMessage.message_id })
        .leftJoinAndSelect('m.sender', 's')
        .leftJoinAndSelect('s.employee', 'e')
        .getOne();

      return messageWithDetails || savedMessage;
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
      .leftJoinAndSelect('sender.employee', 'employee')
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

  // ============ FILE ATTACHMENT METHODS ============

  /**
   * Validate user has access to conversation before uploading
   */
  async validateUserInConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is participant (or it's a group chat)
    const isParticipant = this.isUserParticipant(conversation.participant_ids, userId);
    const isGroupChat = conversation.type === ConversationType.GROUP;

    if (!isParticipant && !isGroupChat) {
      throw new BadRequestException('User is not allowed to upload files to this conversation');
    }
  }

  /**
   * Save file attachment to database
   */
  async saveFileAttachment(
    messageId: string,
    attachmentData: any,
  ): Promise<FileAttachment> {
    const attachment = this.attachmentRepository.create({
      message_id: messageId,
      filename: attachmentData.filename,
      file_type: attachmentData.file_type,
      file_size: attachmentData.file_size,
      file_url: attachmentData.file_url,
      preview_url: attachmentData.preview_url,
    });

    return this.attachmentRepository.save(attachment);
  }

  /**
   * Delete file attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { attachment_id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.attachmentRepository.remove(attachment);
  }

  /**
   * Get attachments for a message
   */
  async getMessageAttachments(messageId: string): Promise<FileAttachment[]> {
    return this.attachmentRepository.find({
      where: { message_id: messageId },
    });
  }

}

