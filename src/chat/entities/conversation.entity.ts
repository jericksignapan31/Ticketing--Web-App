import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

export enum ConversationType {
  DIRECT = 'DIRECT',
  TICKET = 'TICKET',
  GROUP = 'GROUP',
}

@Entity('conversation')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  conversation_id!: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;

  @Column({ nullable: true })
  ticket_id?: string;

  @Column()
  name!: string;

  @Column({ type: 'simple-array', nullable: true })
  participant_ids?: string[];

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages!: Message[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
