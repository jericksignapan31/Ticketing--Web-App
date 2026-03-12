import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Asset } from './asset.entity';

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticket_id: string;

  @Column()
  employee_id: string;

  @Column({ nullable: true })
  asset_id: string;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column()
  category: string;

  @Column()
  priority: string;

  @Column({ default: 'pending_approval' })
  status: string;

  @Column({ default: 'pending' })
  approval_status: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;

  @Column({ nullable: true })
  unit_status: string;

  @Column({ type: 'text', nullable: true })
  observation: string;

  @Column({ type: 'text', nullable: true })
  action_taken: string;

  @Column({ type: 'text', nullable: true })
  recommendation: string;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  reporter: Employee;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'assigned_to' })
  assignedEmployee: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
