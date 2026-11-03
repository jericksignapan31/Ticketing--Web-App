import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserAccount } from '../../entities/user-account.entity';
import { Conversation } from './conversation.entity';

export enum ChatbotResponseType {
  FAQ = 'FAQ',
  TICKET_CREATION = 'TICKET_CREATION',
  TROUBLESHOOTING = 'TROUBLESHOOTING',
  ESCALATION = 'ESCALATION',
  GENERAL = 'GENERAL',
  TICKET_STATUS = 'TICKET_STATUS',
}

@Entity('chatbot_interaction')
export class ChatbotInteraction {
  @PrimaryGeneratedColumn('uuid')
  interaction_id!: string;

  @Column()
  user_id!: string;

  @Column()
  conversation_id!: string;

  @Column({ type: 'text' })
  user_message!: string;

  @Column({ type: 'text' })
  chatbot_response!: string;

  @Column({
    type: 'enum',
    enum: ChatbotResponseType,
    default: ChatbotResponseType.GENERAL,
  })
  response_type!: ChatbotResponseType;

  @Column({ type: 'varchar', nullable: true })
  detected_intent!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  intent_confidence!: number; // 0.0 to 1.0

  @Column({ type: 'uuid', nullable: true })
  knowledge_id?: string; // If response came from knowledge base

  @Column({ type: 'uuid', nullable: true })
  ticket_id?: string; // If ticket was created/referenced

  @Column({ type: 'integer', nullable: true })
  satisfaction_score?: number; // 1-5 star rating

  @Column({ type: 'boolean', nullable: true })
  is_helpful?: boolean; // User feedback: helpful or not

  @Column({ type: 'text', nullable: true })
  user_feedback?: string; // User comments

  @ManyToOne(() => UserAccount, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserAccount;

  @ManyToOne(() => Conversation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @CreateDateColumn()
  created_at!: Date;
}
