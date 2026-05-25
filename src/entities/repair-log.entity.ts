import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Employee } from './employee.entity';

@Entity('repair_log')
export class RepairLog {
  @PrimaryGeneratedColumn()
  repair_id!: number;

  @Column()
  asset_id!: number;

  @Column({ nullable: true })
  reported_by?: number;

  @Column({ nullable: true })
  repaired_by?: number;

  @Column({ type: 'timestamp' })
  repair_date!: Date;

  @Column({ type: 'text' })
  issue_description!: string;

  @Column({ type: 'text', nullable: true })
  action_taken?: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reported_by' })
  reporter?: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'repaired_by' })
  repairer?: Employee;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
