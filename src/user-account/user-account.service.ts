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
}
