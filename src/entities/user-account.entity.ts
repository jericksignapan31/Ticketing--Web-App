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
  @PrimaryGeneratedColumn()
  user_id!: number;

  @Column()
  employee_id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ type: 'boolean', default: false })
  password_changed!: boolean;

  @OneToOne(() => Employee, (employee) => employee.userAccount)
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
