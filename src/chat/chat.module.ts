import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotLearningService } from './services/chatbot-learning.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { FileUploadService } from './services/file-upload.service';
import { GeminiService } from './services/gemini.service';
import { Message } from './entities/message.entity';
import { FileAttachment } from './entities/file-attachment.entity';
import { Conversation } from './entities/conversation.entity';
import { ChatbotKnowledge } from './entities/chatbot-knowledge.entity';
import { ChatbotInteraction } from './entities/chatbot-interaction.entity';
import { TicketSolution } from './entities/ticket-solution.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      FileAttachment,
      Conversation,
      ChatbotKnowledge,
      ChatbotInteraction,
      TicketSolution,
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatbotService,
    ChatbotLearningService,
    ChatGateway,
    FileUploadService,
    GeminiService,
  ],
  exports: [ChatService, ChatbotService, ChatbotLearningService, FileUploadService, GeminiService],
})
export class ChatModule {}
