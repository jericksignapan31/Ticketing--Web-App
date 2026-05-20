import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from '../../entities/user-account.entity';
import { Conversation } from './conversation.entity';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  message_id!: string;

  @Column()
  conversation_id!: string;

  @Column()
  sender_id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: false })
  is_read!: boolean;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @ManyToOne(() => UserAccount, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'sender_id' })
  sender!: UserAccount;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
