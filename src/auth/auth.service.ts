import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserAccount } from '../entities/user-account.entity';
import { Employee } from '../entities/employee.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupDto } from './dto/signup.dto';
import { PasswordValidator } from '../common/utils/password-validator';
import { SecurityConfig } from '../common/config/security.config';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private jwtService: JwtService,
    private dataSource: DataSource,
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
      role: user.employee?.role || UserRole.EMPLOYEE,
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

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    // Check if employee_id already exists
    const existingEmployee = await this.employeeRepository.findOne({
      where: { employee_id: signupDto.employee_id },
    });

    if (existingEmployee) {
      throw new ConflictException(
        `Employee with ID ${signupDto.employee_id} already exists`,
      );
    }

    // Check if email already exists
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: signupDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Email ${signupDto.email} is already registered`,
      );
    }

    // Check if username already exists
    const existingUsername = await this.userAccountRepository.findOne({
      where: { username: signupDto.employee_id },
    });

    if (existingUsername) {
      throw new ConflictException(
        `Username ${signupDto.employee_id} already exists`,
      );
    }

    // Validate password strength
    const validation = PasswordValidator.validate(signupDto.password);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
      });
    }

    // Use transaction to create both employee and user account
    await this.dataSource.transaction(async (manager) => {
      // Create employee with employment_status: false (inactive)
      const employee = manager.create(Employee, {
        employee_id: signupDto.employee_id,
        branch_id: signupDto.branch_id,
        department_id: signupDto.department_id,
        first_name: signupDto.first_name,
        last_name: signupDto.last_name,
        middle_name: signupDto.middle_name,
        email: signupDto.email,
        role: signupDto.role || UserRole.EMPLOYEE,
        position: signupDto.position,
        contact_number: signupDto.contact_number,
        employment_status: false, // Inactive until admin verifies
      });
      await manager.save(employee);

      // Hash password
      const hashedPassword = await bcrypt.hash(
        signupDto.password,
        SecurityConfig.password.saltRounds,
      );

      // Create user account with account_status: false (inactive)
      const userAccount = manager.create(UserAccount, {
        employee_id: signupDto.employee_id,
        username: signupDto.employee_id,
        password: hashedPassword,
        account_status: false, // Inactive until admin verifies
      });
      await manager.save(userAccount);
    });

    return {
      message:
        'Registration successful! Your account is pending admin verification.',
    };
  }
}
