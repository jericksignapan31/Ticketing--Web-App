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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateMessageDto, MessageResponseDto } from './dto/message.dto';
import { CreateConversationDto, ConversationResponseDto } from './dto/conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    @CurrentUser() userId: string,
  ) {
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
    @CurrentUser() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    return this.chatService.getConversations(userId, pageNum, limitNum);
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
    @CurrentUser() userId: string,
  ) {
    if (!otherUserId) {
      throw new BadRequestException('Other user ID is required');
    }
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
    @CurrentUser() userId: string,
  ) {
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
    @CurrentUser() userId: string,
  ) {
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
}
