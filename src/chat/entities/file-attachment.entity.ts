import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('file_attachments')
export class FileAttachment {
  @PrimaryGeneratedColumn('uuid')
  attachment_id!: string;

  @Column('uuid')
  message_id!: string;

  @Column('varchar', { length: 255 })
  filename!: string;

  @Column('varchar', { length: 100 })
  file_type!: string; // MIME type (e.g., 'image/jpeg')

  @Column('bigint')
  file_size!: number; // in bytes

  @Column('varchar', { length: 500 })
  file_url!: string; // URL or path to uploaded file

  @Column('varchar', { length: 500, nullable: true })
  preview_url!: string; // Thumbnail/preview URL for images

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: Message;

  @CreateDateColumn()
  uploaded_at!: Date;
}
