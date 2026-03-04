import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('employee')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  employee_id: string;

  @Column({ nullable: true })
  branch_id: string;

  @Column({ nullable: true })
  department_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  contact_number: string;

  @Column({ default: 'active' })
  employment_status: string;

  @OneToOne(() => UserAccount, (userAccount) => userAccount.employee)
  userAccount: UserAccount;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
