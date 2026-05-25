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
import { UserAccount } from './user-account.entity';

@Entity('asset_status_history')
@Index('asset_id')
@Index('created_at')
export class AssetStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  asset_id!: string;

  @Column({ nullable: true })
  previous_status?: string;

  @Column()
  new_status!: string;

  @Column()
  changed_by!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'changed_by' })
  changedByUser?: UserAccount;
}
