import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_parts')
export class TicketParts {
  @PrimaryGeneratedColumn('uuid')
  part_id!: string;

  @Column()
  ticket_id!: string;

  @Column()
  part_name!: string; // e.g., "Keyboard", "RAM 8GB"

  @Column()
  quantity!: number; // How many units needed

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_cost!: number; // Cost per unit

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_cost!: number; // quantity × unit_cost

  @Column()
  supplier!: string; // Where to buy (Lazada, Local Supplier, etc.)

  @Column({ default: 'pending' })
  status!: string; // pending, ordered, received

  @Column({ type: 'timestamp', nullable: true })
  requested_date?: Date; // When parts were requested

  @Column({ type: 'timestamp', nullable: true })
  received_date?: Date; // When parts were received

  @Column({ type: 'text', nullable: true })
  notes?: string; // Additional notes about the parts

  @ManyToOne(() => Ticket, (ticket) => ticket.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
