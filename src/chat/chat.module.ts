import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { FileUploadService } from './services/file-upload.service';
import { Message } from './entities/message.entity';
import { FileAttachment } from './entities/file-attachment.entity';
import { Conversation } from './entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, FileAttachment, Conversation])],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, FileUploadService],
  exports: [ChatService, FileUploadService],
})
export class ChatModule {}
