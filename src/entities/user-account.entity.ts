import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('user_account')
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column()
  employee_id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @OneToOne(() => Employee, (employee) => employee.userAccount)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
