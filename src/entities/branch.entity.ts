import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('branch')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  branch_id: string;

  @Column()
  branch_name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  contact_number: string;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => Employee, (employee) => employee.branch)
  employees: Employee[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
