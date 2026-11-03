import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotLearningService } from './services/chatbot-learning.service';
import { FileUploadService } from './services/file-upload.service';
import { CreateMessageDto, MessageResponseDto } from './dto/message.dto';
import { CreateConversationDto, ConversationResponseDto } from './dto/conversation.dto';
import {
  ChatbotMessageDto,
  ChatbotResponseDto,
  CreateKnowledgeEntryDto,
  KnowledgeEntryResponseDto,
  ChatbotFeedbackDto,
  KnowledgeSearchDto,
  ChatbotTicketCreationDto,
  ChatbotStatsDto,
} from './dto/chatbot.dto';
import {
  ExtractSolutionDto,
  LearningResultDto,
  BatchLearningDto,
  BatchLearningResponseDto,
  ImprovementRecommendationDto,
  SyncConfidenceDto,
} from './dto/chatbot-learning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatbotService: ChatbotService,
    private readonly learningService: ChatbotLearningService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // ============ CONVERSATION ENDPOINTS ============

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.sub || user.user_id || user.id;
    return this.chatService.createConversation(createConversationDto, userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations with pagination',
    type: [ConversationResponseDto],
  })
  async getConversations(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = user.sub || user.user_id || user.id;
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    return this.chatService.getConversations(userId, pageNum, limitNum);
  }

  @Get('general')
  @ApiOperation({ summary: 'Get or create general group chat (visible to all users)' })
  @ApiResponse({
    status: 200,
    description: 'General group chat',
    type: ConversationResponseDto,
  })
  async getGeneralChat() {
    return this.chatService.getGeneralChat();
  }

  @Get('all-conversations-with-messages')
  @ApiOperation({ summary: 'Get ALL conversations with ALL messages in one call' })
  @ApiResponse({
    status: 200,
    description: 'All conversations with their messages loaded',
    type: [ConversationResponseDto],
  })
  async getAllConversationsWithMessages(@CurrentUser() user: any) {
    const userId = user.sub || user.user_id || user.id;
    return this.chatService.getAllConversationsWithMessages(userId);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
    type: ConversationResponseDto,
  })
  async getConversation(@Param('conversationId') conversationId: string) {
    return this.chatService.getConversationById(conversationId);
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 204, description: 'Conversation deleted' })
  async deleteConversation(@Param('conversationId') conversationId: string) {
    return this.chatService.deleteConversation(conversationId);
  }

  @Post('conversations/direct/:otherUserId')
  @ApiOperation({ summary: 'Start or get direct conversation with user' })
  @ApiParam({ name: 'otherUserId', description: 'Other user ID' })
  @ApiResponse({
    status: 201,
    description: 'Direct conversation created/retrieved',
    type: ConversationResponseDto,
  })
  async createDirectConversation(
    @Param('otherUserId') otherUserId: string,
    @CurrentUser() user: any,
  ) {
    if (!otherUserId) {
      throw new BadRequestException('Other user ID is required');
    }
    const userId = user.sub || user.user_id || user.id;
    return this.chatService.createDirectConversation(otherUserId, userId);
  }

  // ============ MESSAGE ENDPOINTS ============

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.sub || user.user_id || user.id;
    return this.chatService.sendMessage(createMessageDto, userId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages from a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Message limit' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Message offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
    type: [MessageResponseDto],
  })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.chatService.getConversationMessages(
      conversationId,
      limitNum,
      offsetNum,
    );
  }

  @Post('messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markAsRead(@Param('messageId') messageId: string) {
    return this.chatService.markAsRead(messageId);
  }

  @Post('conversations/:conversationId/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  async markConversationAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.sub || user.user_id || user.id;
    return this.chatService.markConversationAsRead(conversationId, userId);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 204, description: 'Message deleted' })
  async deleteMessage(@Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  @ApiResponse({
    status: 200,
    description: 'Unread message count',
    schema: { example: { unread_count: 5 } },
  })
  async getUnreadCount(@CurrentUser() userId: string) {
    const count = await this.chatService.getUnreadCount(userId);
    return { unread_count: count };
  }

  // ============ FILE ATTACHMENT ENDPOINTS ============

  @Post('conversations/:conversationId/upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files per request
  @ApiOperation({ summary: 'Upload files to a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        attachments: [
          {
            filename: 'image.jpg',
            file_type: 'image/jpeg',
            file_size: 12345,
            file_url: '/api/chat/files/conv-id_abc123.jpg',
            preview_url: '/api/chat/files/conv-id_abc123.jpg',
          },
        ],
      },
    },
  })
  async uploadFiles(
    @Param('conversationId') conversationId: string,
    @UploadedFiles() files: any,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const userId = user.sub || user.user_id || user.id;

    // Validate user has access to this conversation
    await this.chatService.validateUserInConversation(userId, conversationId);

    // Save all files
    const attachments = await Promise.all(
      files.map((file: any) =>
        this.fileUploadService.saveUploadedFile(file, conversationId),
      ),
    );

    return { attachments };
  }

  @Get('files/:fileName')
  @ApiOperation({ summary: 'Download a file' })
  @ApiParam({ name: 'fileName', description: 'File name to download' })
  @ApiResponse({
    status: 200,
    description: 'File content',
  })
  async getFile(@Param('fileName') fileName: string, @Res() res: any) {
    try {
      const file = await this.fileUploadService.getFile(fileName);

      // Determine MIME type
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        txt: 'text/plain',
        zip: 'application/zip',
        doc: 'application/msword',
        docx:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(file);
    } catch (error) {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Delete('attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file attachment' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({ status: 204, description: 'Attachment deleted' })
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.sub || user.user_id || user.id;
    // Note: Add user verification logic in service if needed
    return this.chatService.deleteAttachment(attachmentId);
  }

  // ============ CHATBOT ENDPOINTS ============

  @Post('chatbot/message')
  @ApiOperation({ summary: 'Send message to chatbot' })
  @ApiResponse({
    status: 200,
    description: 'Chatbot response',
    type: ChatbotResponseDto,
  })
  async chatbotMessage(
    @Body() body: ChatbotMessageDto,
    @CurrentUser() user: any,
  ): Promise<ChatbotResponseDto> {
    if (!body.message || !body.conversation_id) {
      throw new BadRequestException('Message and conversation_id are required');
    }

    const userId = user.sub || user.user_id || user.id;
    const userRole = user.role || 'EMPLOYEE';
    const userDepartment = user.department_id;

    return this.chatService.processChatbotMessage({
      user_id: userId,
      conversation_id: body.conversation_id,
      message: body.message,
      userRole,
      userDepartment,
      recentTickets: [],
    });
  }

  @Post('chatbot/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit feedback on chatbot response' })
  @ApiResponse({
    status: 200,
    description: 'Feedback recorded',
  })
  async submitFeedback(@Body() feedback: ChatbotFeedbackDto): Promise<{ message: string }> {
    await this.chatbotService.submitFeedback(
      feedback.interaction_id,
      {
        satisfaction_score: feedback.satisfaction_score,
        is_helpful: feedback.is_helpful,
        user_feedback: feedback.user_feedback,
      },
    );

    return { message: 'Feedback recorded successfully' };
  }

  @Post('chatbot/kb/search')
  @ApiOperation({ summary: 'Search knowledge base' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge base entries matching query',
    type: [KnowledgeEntryResponseDto],
  })
  async searchKnowledgeBase(
    @Body() search: KnowledgeSearchDto,
  ): Promise<KnowledgeEntryResponseDto[]> {
    if (!search.query) {
      throw new BadRequestException('Query is required');
    }

    return this.chatbotService.searchKnowledgeBase(
      search.query,
      search.limit || 5,
    );
  }

  @Get('chatbot/kb/categories')
  @ApiOperation({ summary: 'Get all FAQ categories' })
  @ApiResponse({
    status: 200,
    description: 'List of FAQ categories',
    schema: { example: ['Password Management', 'Hardware', 'Software'] },
  })
  async getFAQCategories(): Promise<string[]> {
    return this.chatbotService.getFAQCategories();
  }

  @Get('chatbot/kb/category/:category')
  @ApiOperation({ summary: 'Get FAQ entries by category' })
  @ApiParam({ name: 'category', description: 'FAQ category name' })
  @ApiResponse({
    status: 200,
    description: 'FAQ entries in category',
    type: [KnowledgeEntryResponseDto],
  })
  async getFAQByCategory(
    @Param('category') category: string,
  ): Promise<KnowledgeEntryResponseDto[]> {
    return this.chatbotService.getFAQByCategory(category);
  }

  @Get('chatbot/kb/popular')
  @ApiOperation({ summary: 'Get most helpful FAQ entries' })
  @ApiResponse({
    status: 200,
    description: 'Most helpful knowledge base entries',
    type: [KnowledgeEntryResponseDto],
  })
  async getPopularFAQ(
    @Query('limit') limit?: string,
  ): Promise<KnowledgeEntryResponseDto[]> {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    return this.chatbotService.getMostHelpfulResponses(limitNum);
  }

  @Post('chatbot/kb/add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.IT)
  @ApiOperation({ summary: 'Add FAQ entry to knowledge base (Admin/IT only)' })
  @ApiResponse({
    status: 201,
    description: 'Knowledge base entry created',
    type: KnowledgeEntryResponseDto,
  })
  async addKnowledgeEntry(
    @Body() entry: CreateKnowledgeEntryDto,
  ): Promise<KnowledgeEntryResponseDto> {
    return this.chatbotService.addKnowledgeEntry({
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
    });
  }

  @Post('chatbot/ticket/create')
  @ApiOperation({ summary: 'Create ticket from chatbot assistance' })
  @ApiResponse({
    status: 201,
    description: 'Ticket created',
    schema: {
      example: {
        ticket_id: 'IT-20261103-0001',
        message: 'Ticket created successfully',
      },
    },
  })
  async createTicketFromChatbot(
    @Body() ticketData: ChatbotTicketCreationDto,
    @CurrentUser() user: any,
  ): Promise<{ ticket_id: string; message: string }> {
    const userId = user.sub || user.user_id || user.id;

    return this.chatbotService.confirmTicketCreation({
      user_id: userId,
      conversation_id: ticketData.conversation_id,
      category: ticketData.category,
      priority: ticketData.priority,
      subject: ticketData.subject,
      description: ticketData.description,
      asset_id: ticketData.asset_id,
      require_approval: ticketData.require_approval,
    });
  }

  @Get('chatbot/stats')
  @ApiOperation({ summary: 'Get chatbot statistics' })
  @ApiResponse({
    status: 200,
    description: 'Chatbot stats',
    type: ChatbotStatsDto,
  })
  async chatbotStats(): Promise<ChatbotStatsDto> {
    return this.chatService.getChatbotStats();
  }

  // ============ CHATBOT LEARNING ENDPOINTS (Phase 3) ============

  @Post('chatbot/learn/extract-solution')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Extract and learn from resolved ticket',
    description: 'Extract solution from resolved ticket and populate knowledge base',
  })
  @ApiResponse({
    status: 201,
    description: 'Solution extracted and KB populated',
    type: LearningResultDto,
  })
  async extractSolution(
    @Body() extractDto: ExtractSolutionDto,
  ): Promise<LearningResultDto> {
    try {
      // Extract solution from ticket
      const solution = await this.learningService.extractSolutionFromTicket(extractDto);

      // Populate KB
      const kbEntry = await this.learningService.populateKBFromSolution(solution);

      // Update confidence if KB entry exists
      if (kbEntry) {
        await this.learningService.updateConfidenceFromResolution(extractDto, kbEntry);
      }

      return {
        solution_id: solution.solution_id,
        knowledge_id: kbEntry?.knowledge_id,
        faq_question: kbEntry ? 'FAQ entry created' : undefined,
        confidence_score: kbEntry?.confidence_score,
        success: true,
        message: 'Solution extracted and KB populated successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract solution: ${error.message}`,
      );
    }
  }

  @Post('chatbot/learn/batch')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Batch learn from multiple resolved tickets',
    description: 'Process multiple resolved tickets to auto-populate knowledge base',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch learning completed',
    type: BatchLearningResponseDto,
  })
  async batchLearn(
    @Body() batchDto: BatchLearningDto,
  ): Promise<BatchLearningResponseDto> {
    try {
      const result = await this.learningService.batchLearnFromTickets(
        batchDto.tickets,
      );

      return {
        ...result,
        message: `Processed ${result.processed} tickets: ${result.solutions} solutions extracted, ${result.kbEntries} KB entries created/updated`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Batch learning failed: ${error.message}`,
      );
    }
  }

  @Get('chatbot/learn/recommendations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get improvement recommendations',
    description:
      'Get suggestions for improving chatbot based on current performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Improvement recommendations',
    type: ImprovementRecommendationDto,
  })
  async getRecommendations(): Promise<ImprovementRecommendationDto> {
    try {
      const recommendations =
        await this.learningService.getImprovementRecommendations();

      return {
        lowConfidenceEntries: recommendations.lowConfidenceEntries.map((e) => ({
          knowledge_id: e.knowledge_id,
          question: e.question,
          confidence_score: e.confidence_score,
          usage_count: e.usage_count,
        })),
        unknownIssuePatterns: recommendations.unknownIssuePatterns,
        frequentEscalations: recommendations.frequentEscalations,
        summary: `Found ${recommendations.lowConfidenceEntries.length} low-confidence entries and ${recommendations.unknownIssuePatterns.length} unknown patterns`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get recommendations: ${error.message}`,
      );
    }
  }

  @Post('chatbot/learn/sync-confidence')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Sync confidence scores with feedback',
    description: 'Update KB confidence scores based on user feedback data',
  })
  @ApiResponse({
    status: 200,
    description: 'Confidence scores synced',
    type: SyncConfidenceDto,
  })
  async syncConfidence(): Promise<SyncConfidenceDto> {
    try {
      const result = await this.learningService.syncConfidenceWithFeedback();

      return {
        updated: result.updated,
        message: `Successfully synced confidence scores for ${result.updated} KB entries`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to sync confidence scores: ${error.message}`,
      );
    }
  }
}
