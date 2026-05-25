import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('brand')
export class Brand {
  @PrimaryGeneratedColumn()
  brand_id!: number;

  @Column()
  brand_name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  brand_image_url?: string;

  @Column({ type: 'boolean', default: true })
  status!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
