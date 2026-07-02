import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PartRequisition } from './part-requisition.entity';
import { RequisitionComment } from './requisition-comment.entity';

@Entity('requisition_returns')
export class RequisitionReturn {
  @PrimaryGeneratedColumn('uuid')
  return_id: string;

  @Column('uuid')
  requisition_id: string;

  @Column('uuid')
  returned_by: string; // Warehouse staff who returned

  @Column('text')
  warehouse_notes: string; // Reason for return

  @Column({ type: 'int', default: 1 })
  return_cycle: number; // Track return iterations

  @Column('uuid', { nullable: true })
  resubmitted_by: string | null; // IT staff who resubmitted

  @Column('timestamp', { nullable: true })
  resubmitted_at: Date | null;

  @ManyToOne(() => PartRequisition, (req) => req.returns)
  @JoinColumn({ name: 'requisition_id' })
  requisition: PartRequisition;

  @OneToMany(() => RequisitionComment, (comment) => comment.return, {
    cascade: true,
    eager: true,
  })
  comments: RequisitionComment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
