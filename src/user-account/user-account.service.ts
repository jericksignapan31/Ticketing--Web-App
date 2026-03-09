import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../entities/user-account.entity';

@Injectable()
export class UserAccountService {
  constructor(
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
  ) {}

  async findAll(): Promise<UserAccount[]> {
    return await this.userAccountRepository.find({
      relations: ['employee', 'employee.branch', 'employee.department'],
      select: {
        user_id: true,
        employee_id: true,
        username: true,
        created_at: true,
        updated_at: true,
        // Note: password is excluded from select for security
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findByUserId(user_id: string): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({
      where: { user_id },
      relations: ['employee', 'employee.branch', 'employee.department'],
      select: {
        user_id: true,
        employee_id: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!userAccount) {
      throw new NotFoundException(`User account with ID ${user_id} not found`);
    }

    return userAccount;
  }

  async findByEmployeeId(employee_id: string): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({
      where: { employee_id },
      relations: ['employee', 'employee.branch', 'employee.department'],
      select: {
        user_id: true,
        employee_id: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!userAccount) {
      throw new NotFoundException(
        `User account for employee ${employee_id} not found`,
      );
    }

    return userAccount;
  }

  async findByUsername(username: string): Promise<UserAccount> {
    const userAccount = await this.userAccountRepository.findOne({
      where: { username },
      relations: ['employee', 'employee.branch', 'employee.department'],
      select: {
        user_id: true,
        employee_id: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!userAccount) {
      throw new NotFoundException(
        `User account with username ${username} not found`,
      );
    }

    return userAccount;
  }

  async getLoginCredentialsList(): Promise<any[]> {
    const userAccounts = await this.userAccountRepository.find({
      relations: ['employee'],
      select: {
        user_id: true,
        employee_id: true,
        username: true,
        password: true,
        created_at: true,
        updated_at: true,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return userAccounts.map((account) => ({
      user_id: account.user_id,
      employee_id: account.employee_id,
      username: account.username,
      password: account.password,
      employee_name: account.employee
        ? `${account.employee.first_name} ${account.employee.last_name}`
        : 'N/A',
      email: account.employee?.email || 'N/A',
      role: account.employee?.role || 'N/A',
      account_status: account.employee?.employment_status
        ? 'Active'
        : 'Inactive',
      default_password_format: `${account.employee_id}@${account.employee?.last_name || 'LastName'}`,
      created_at: account.created_at,
      updated_at: account.updated_at,
    }));
  }
}
