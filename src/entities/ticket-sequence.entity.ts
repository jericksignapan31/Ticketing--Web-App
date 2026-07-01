import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ticket_sequence')
export class TicketSequence {
  @PrimaryColumn('varchar', { length: 10 })
  date!: string; // YYYYMMDD format

  @Column('int', { default: 0 })
  sequence!: number;

  @UpdateDateColumn()
  updated_at!: Date;
}
