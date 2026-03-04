import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserAccount } from '../entities/user-account.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordValidator } from '../common/utils/password-validator';
import { SecurityConfig } from '../common/config/security.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user by username and include employee relation
    const user = await this.userAccountRepository.findOne({
      where: { username },
      relations: ['employee'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.account_status) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.user_id,
      username: user.username,
      employeeId: user.employee_id,
      role: user.employee?.role || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        username: user.username,
        employee: {
          employee_id: user.employee.employee_id,
          first_name: user.employee.first_name,
          last_name: user.employee.last_name,
          email: user.employee.email,
          role: user.employee.role,
        },
      },
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await this.userAccountRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      SecurityConfig.password.saltRounds,
    );
    user.password = hashedPassword;
    await this.userAccountRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userAccountRepository.findOne({
      where: { user_id: userId },
      relations: ['employee', 'employee.branch', 'employee.department'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user_id: user.user_id,
      username: user.username,
      account_status: user.account_status,
      employee: {
        employee_id: user.employee.employee_id,
        first_name: user.employee.first_name,
        middle_name: user.employee.middle_name,
        last_name: user.employee.last_name,
        email: user.employee.email,
        role: user.employee.role,
        position: user.employee.position,
        contact_number: user.employee.contact_number,
        employment_status: user.employee.employment_status,
        branch: user.employee.branch,
        department: user.employee.department,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SecurityConfig.password.saltRounds);
  }
}
