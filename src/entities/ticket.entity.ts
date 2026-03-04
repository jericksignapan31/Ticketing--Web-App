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

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticket_id: string;

  @Column()
  employee_id: string;

  @Column({ nullable: true })
  assigned_to: string;

  @Column()
  category: string;

  @Column()
  priority: string;

  @Column({ default: 'open' })
  status: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date;

  @Column({ type: 'datetime', nullable: true })
  closed_at: Date;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  reporter: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'assigned_to' })
  assignedEmployee: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
