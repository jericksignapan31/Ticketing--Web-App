import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('ChatGateway');
  private userSockets: Map<string, string[]> = new Map();

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);
      client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    this.server.to(room).emit('user_joined', {
      userId: client.handshake.auth.userId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    this.server.to(room).emit('user_left', {
      userId: client.handshake.auth.userId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      const userId = client.handshake.auth.userId;
      const message = await this.chatService.sendMessage(data, userId);

      const room = `conversation_${data.conversation_id}`;

      // Broadcast message to all participants in the conversation (now includes attachments)
      this.server.to(room).emit('new_message', {
        message_id: message.message_id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        is_read: message.is_read,
        attachments: message.attachments || [], // ← Include attachments
        created_at: message.created_at,
      });

      this.logger.log(
        `Message sent in conversation ${data.conversation_id} by ${userId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', {
        message: 'Failed to send message',
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const room = `conversation_${data.conversationId}`;
    this.server.to(room).emit('user_typing', {
      userId: client.handshake.auth.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.messageId);
      this.logger.log(`Message ${data.messageId} marked as read`);
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }

  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Helper method to send message to specific conversation
  sendToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(`conversation_${conversationId}`).emit(event, data);
  }
}
