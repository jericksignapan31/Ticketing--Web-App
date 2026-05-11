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
import { Branch } from './branch.entity';
import { UserAccount } from './user-account.entity';

@Entity('asset_movement_history')
@Index('asset_id')
@Index('created_at')
export class AssetMovementHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  asset_id!: string;

  @Column({ nullable: true })
  from_branch_id?: string;

  @Column()
  to_branch_id!: string;

  @Column()
  moved_by!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'from_branch_id' })
  fromBranch?: Branch;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'to_branch_id' })
  toBranch?: Branch;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'moved_by' })
  movedByUser?: UserAccount;
}
