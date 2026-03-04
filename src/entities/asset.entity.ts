import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Employee } from './employee.entity';

@Entity('asset')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  asset_id: string;

  @Column({ unique: true })
  asset_tag: string;

  @Column({ nullable: true })
  brand_id: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column({ type: 'date', nullable: true })
  warranty_expiry_date: Date;

  @Column({ default: 'available' })
  status: string;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-json', nullable: true })
  specifications: any;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'assigned_to' })
  assignedEmployee: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
