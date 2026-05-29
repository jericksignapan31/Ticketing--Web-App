import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { RequisitionItem } from './requisition-item.entity';

@Entity('part_requisitions')
export class PartRequisition {
  @PrimaryGeneratedColumn('uuid')
  requisition_id: string;

  @Column({ unique: true })
  rf_number: string; // e.g., RF-2026-001

  @Column('uuid')
  requested_by: string; // IT or Warehouse staff who created

  @Column({ type: 'enum', enum: ['it', 'warehouse'], default: 'warehouse' })
  requested_by_type: 'it' | 'warehouse';

  @Column('varchar', { nullable: true })
  department: string | null;

  @Column('timestamp', { nullable: true })
  deadline: Date | null;

  @Column({ type: 'enum', enum: ['pending', 'pending_admin_review', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'pending_admin_review' | 'approved' | 'rejected';

  @Column('uuid', { nullable: true })
  acknowledged_by: string | null; // Warehouse staff who reviewed

  @Column('timestamp', { nullable: true })
  acknowledged_at: Date | null;

  @Column('varchar', { nullable: true })
  acknowledged_notes: string | null;

  @Column('uuid', { nullable: true })
  approved_by: string | null; // Admin who approved

  @Column('timestamp', { nullable: true })
  approved_at: Date | null;

  @Column('varchar', { nullable: true })
  rejection_reason: string | null;

  @OneToMany(() => RequisitionItem, (item) => item.requisition, { cascade: true })
  items: RequisitionItem[];

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requested_by' })
  requester: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledger: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
