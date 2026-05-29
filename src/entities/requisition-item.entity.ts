import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PartRequisition } from './part-requisition.entity';

@Entity('requisition_items')
export class RequisitionItem {
  @PrimaryGeneratedColumn('uuid')
  item_id: string;

  @Column('uuid')
  requisition_id: string;

  @Column()
  item_name: string;

  @Column()
  quantity: number;

  @Column()
  unit: string; // e.g., pcs, box, set

  @Column('varchar', { nullable: true })
  supplier: string | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unit_cost: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total_cost: number | null;

  @Column('varchar', { nullable: true })
  purpose_remarks: string | null;

  @ManyToOne(() => PartRequisition, (req) => req.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisition_id' })
  requisition: PartRequisition;
}
