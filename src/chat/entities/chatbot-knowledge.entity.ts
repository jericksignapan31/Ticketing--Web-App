import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('chatbot_knowledge')
export class ChatbotKnowledge {
  @PrimaryGeneratedColumn('uuid')
  knowledge_id!: string;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords?: string[];

  @Column({ type: 'simple-array', nullable: true })
  relevant_ticket_ids?: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  confidence_score!: number; // 0.0 to 1.0

  @Column({ type: 'integer', default: 0 })
  usage_count!: number; // How many times this answer was used

  @Column({ type: 'integer', default: 0 })
  helpful_count!: number; // How many times marked as helpful

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
