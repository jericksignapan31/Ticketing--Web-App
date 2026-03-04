import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('user_account')
export class UserAccount {
  @PrimaryColumn()
  user_id: string;

  @Column()
  employee_id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: 'active' })
  account_status: string;

  @OneToOne(() => Employee, (employee) => employee.userAccount)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
