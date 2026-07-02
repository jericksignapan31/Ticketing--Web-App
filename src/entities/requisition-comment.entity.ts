import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RequisitionReturn } from './requisition-return.entity';

@Entity('requisition_comments')
export class RequisitionComment {
  @PrimaryGeneratedColumn('uuid')
  comment_id: string;

  @Column('uuid')
  return_id: string;

  @Column('uuid')
  commented_by: string; // Employee who commented

  @Column({ type: 'varchar', enum: ['warehouse', 'it'] })
  role: 'warehouse' | 'it'; // Role of commenter

  @Column('text')
  message: string;

  @ManyToOne(() => RequisitionReturn, (ret) => ret.comments)
  @JoinColumn({ name: 'return_id' })
  return: RequisitionReturn;

  @CreateDateColumn()
  created_at: Date;
}
