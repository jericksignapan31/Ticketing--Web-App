import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('warehouse_part_requests')
export class WarehousePartRequest {
  @PrimaryGeneratedColumn('uuid')
  request_id: string;

  @Column('uuid')
  requested_by: string; // Warehouse staff who requested

  @Column('uuid', { nullable: true })
  approved_by: string; // Admin who approved

  @Column()
  part_name: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unit_cost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_cost: number;

  @Column()
  supplier: string;

  @Column()
  notes: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  requested_at: Date;

  @Column({ nullable: true })
  approved_at: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requested_by' })
  requester: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;

  @UpdateDateColumn()
  updated_at: Date;
}
