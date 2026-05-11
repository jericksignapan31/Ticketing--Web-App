import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Employee } from './employee.entity';
import { UserAccount } from './user-account.entity';

@Entity('asset_assignment_history')
@Index('asset_id')
@Index('created_at')
export class AssetAssignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  asset_id!: string;

  @Column({ nullable: true })
  previous_employee_id?: string;

  @Column({ nullable: true })
  new_employee_id?: string;

  @Column()
  assigned_by!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'previous_employee_id' })
  previousEmployee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'new_employee_id' })
  newEmployee?: Employee;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: UserAccount;
}
