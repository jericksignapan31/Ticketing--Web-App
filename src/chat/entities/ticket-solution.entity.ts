import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ticket_solution')
export class TicketSolution {
  @PrimaryGeneratedColumn('uuid')
  solution_id!: string;

  @Column()
  ticket_id!: string; // Reference to resolved ticket

  @Column({ type: 'varchar', nullable: true })
  issue_type!: string; // e.g., "Hardware", "Software", "Network"

  @Column({ type: 'varchar', nullable: true })
  category!: string; // e.g., "Laptop", "Printer", "Monitor"

  @Column({ type: 'text' })
  solution_summary!: string; // Brief summary of the issue and resolution

  @Column({ type: 'simple-array', nullable: true })
  resolution_steps?: string[]; // Step-by-step solution

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string; // Detailed notes from IT staff

  @Column({ type: 'integer', nullable: true })
  resolution_time_minutes?: number; // How long it took to resolve

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]; // Keywords for searching

  @Column({ type: 'simple-array', nullable: true })
  prevent_tips?: string[]; // How to prevent this issue

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'integer', default: 0 })
  usage_count!: number; // How many times this solution was referenced

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
