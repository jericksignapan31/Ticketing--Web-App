import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from '../../entities/user-account.entity';
import { Conversation } from './conversation.entity';
import { FileAttachment } from './file-attachment.entity';

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

  @OneToMany(() => FileAttachment, (attachment) => attachment.message, {
    eager: true,
    cascade: ['insert', 'remove'],
  })
  attachments!: FileAttachment[];

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
