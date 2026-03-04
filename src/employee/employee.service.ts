import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../entities/employee.entity';
import { UserAccount } from '../entities/user-account.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private dataSource: DataSource,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Check if employee_id already exists
    const existingEmployee = await this.employeeRepository.findOne({
      where: { employee_id: createEmployeeDto.employee_id },
    });

    if (existingEmployee) {
      throw new ConflictException(
        `Employee with ID ${createEmployeeDto.employee_id} already exists`,
      );
    }

    // Check if email already exists
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: createEmployeeDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Employee with email ${createEmployeeDto.email} already exists`,
      );
    }

    // Check if username already exists
    const existingUsername = await this.userAccountRepository.findOne({
      where: { username: createEmployeeDto.employee_id },
    });

    if (existingUsername) {
      throw new ConflictException(
        `Username ${createEmployeeDto.employee_id} already exists`,
      );
    }

    // Use transaction to create both employee and user account
    return await this.dataSource.transaction(async (manager) => {
      // Create and save employee
      const employee = manager.create(Employee, createEmployeeDto);
      const savedEmployee = await manager.save(employee);

      // Hash password (using employee_id as password)
      const hashedPassword = await bcrypt.hash(
        createEmployeeDto.employee_id,
        10,
      );

      // Create user account with username and password both as employee_id
      const userAccount = manager.create(UserAccount, {
        employee_id: savedEmployee.employee_id,
        username: savedEmployee.employee_id,
        password: hashedPassword,
        account_status: true,
      });
      await manager.save(userAccount);

      return savedEmployee;
    });
  }

  async findAll(): Promise<Employee[]> {
    return await this.employeeRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(employee_id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employee_id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employee_id} not found`);
    }

    return employee;
  }

  async update(
    employee_id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(employee_id);

    // If email is being updated, check if it's already taken by another employee
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmail = await this.employeeRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Employee with email ${updateEmployeeDto.email} already exists`,
        );
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return await this.employeeRepository.save(employee);
  }

  async remove(employee_id: string): Promise<void> {
    const employee = await this.findOne(employee_id);
    await this.employeeRepository.remove(employee);
  }

  async search(searchTerm: string): Promise<Employee[]> {
    return await this.employeeRepository
      .createQueryBuilder('employee')
      .where(
        'employee.first_name LIKE :search OR employee.last_name LIKE :search OR employee.email LIKE :search',
        { search: `%${searchTerm}%` },
      )
      .getMany();
  }
}
