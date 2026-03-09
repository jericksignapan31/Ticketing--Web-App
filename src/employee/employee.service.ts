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
import { SecurityConfig } from '../common/config/security.config';

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
        SecurityConfig.password.saltRounds,
      );

      // Create user account with username and password both as employee_id
      const userAccount = manager.create(UserAccount, {
        employee_id: savedEmployee.employee_id,
        username: savedEmployee.employee_id,
        password: hashedPassword,
      });
      await manager.save(userAccount);

      return savedEmployee;
    });
  }

  async findAll(
    status?: 'active' | 'inactive' | 'pending',
  ): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.userAccount', 'userAccount')
      .leftJoinAndSelect('employee.branch', 'branch')
      .leftJoinAndSelect('employee.department', 'department')
      .orderBy('employee.created_at', 'DESC');

    if (status === 'active') {
      // Active: employment_status = true
      queryBuilder.where('employee.employment_status = :status', {
        status: true,
      });
    } else if (status === 'inactive') {
      // Inactive: employment_status = false (deactivated accounts)
      queryBuilder.where('employee.employment_status = :empStatus', {
        empStatus: false,
      });
    } else if (status === 'pending') {
      // Pending: employment_status = false (same as inactive, but frontend can differentiate by created date)
      queryBuilder.where('employee.employment_status = :empStatus', {
        empStatus: false,
      });
    }

    return await queryBuilder.getMany();
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

  async updateEmploymentStatus(
    employee_id: string,
    employment_status: boolean,
  ): Promise<Employee> {
    const employee = await this.findOne(employee_id);

    // Validate status is a boolean
    if (typeof employment_status !== 'boolean') {
      throw new NotFoundException(
        'Invalid employment_status. Must be true or false',
      );
    }

    employee.employment_status = employment_status;
    return await this.employeeRepository.save(employee);
  }

  async verifyEmployee(employee_id: string): Promise<{ message: string }> {
    const employee = await this.findOne(employee_id);

    // Activate employee (this will automatically activate login access)
    employee.employment_status = true;
    await this.employeeRepository.save(employee);

    return {
      message: `Employee ${employee_id} has been verified and activated successfully`,
    };
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
