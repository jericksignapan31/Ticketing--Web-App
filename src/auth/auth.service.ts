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
    const { email, password } = loginDto;

    console.log('🔐 Login attempt for email:', email);

    // Find user by employee email and include employee with branch relation
    const user = await this.userAccountRepository
      .createQueryBuilder('ua')
      .leftJoinAndSelect('ua.employee', 'emp')
      .leftJoinAndSelect('emp.branch', 'branch')
      .where('emp.email = :email', { email })
      .getOne();

    if (!user) {
      console.error('❌ User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ User found:', {
      user_id: user.user_id,
      email: user.employee?.email,
      password_changed: user.password_changed,
    });

    // Check if employee account is active
    if (!user.employee || !user.employee.employment_status) {
      console.error('❌ Account is not active:', email);
      throw new UnauthorizedException('Account is not active');
    }

    console.log('✅ Account is active');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔍 Password comparison result:', {
      email: user.employee?.email,
      isPasswordValid: isPasswordValid,
      providedPasswordLength: password.length,
      storedPasswordHash: user.password.substring(0, 20) + '...',
    });

    if (!isPasswordValid) {
      console.error('❌ Invalid password for user:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ Password is valid');

    // Generate JWT token with branch_id and department_id
    const payload = {
      sub: user.user_id,
      username: user.username,
      employeeId: user.employee_id,
      role: user.employee?.role || UserRole.EMPLOYEE,
      branchId: user.employee?.branch_id || null,
      departmentId: user.employee?.department_id || null,
    };

    console.log('✅ JWT token generated for user:', email);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        username: user.username,
        password_changed: user.password_changed,
        employee: {
          employee_id: user.employee.employee_id,
          first_name: user.employee.first_name,
          last_name: user.employee.last_name,
          email: user.employee.email,
          role: user.employee.role,
          branch_id: user.employee.branch_id,
          branch: user.employee.branch
            ? {
                branch_id: user.employee.branch.branch_id,
                branch_name: user.employee.branch.branch_name,
                location: user.employee.branch.location,
                contact_number: user.employee.branch.contact_number,
                status: user.employee.branch.status,
              }
            : null,
        },
      },
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    console.log('🔐 Change password request for user:', userId);

    // Find user
    const user = await this.userAccountRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      console.error('❌ User not found:', userId);
      throw new UnauthorizedException('User not found');
    }

    console.log('📝 Found user:', user.username);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      console.error('❌ Current password is incorrect for user:', user.username);
      throw new UnauthorizedException('Current password is incorrect');
    }

    console.log('✅ Current password verified');

    // Validate new password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      console.error('❌ New password does not meet requirements:', validation.errors);
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
      });
    }

    console.log('✅ New password meets security requirements');

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      console.error('❌ New password is same as current password');
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    console.log('✅ New password is different from current password');

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      SecurityConfig.password.saltRounds,
    );

    console.log('✅ New password hashed');

    user.password = hashedPassword;
    user.password_changed = true;  // Mark password as changed

    console.log('💾 Saving updated user to database...');

    const savedUser = await this.userAccountRepository.save(user);

    console.log('✅ User password changed successfully:', {
      user_id: savedUser.user_id,
      username: savedUser.username,
      password_changed: savedUser.password_changed,
    });

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
      employee: {
        employee_id: user.employee!.employee_id,
        first_name: user.employee!.first_name,
        middle_name: user.employee!.middle_name,
        last_name: user.employee!.last_name,
        email: user.employee!.email,
        role: user.employee!.role,
        position: user.employee!.position,
        contact_number: user.employee!.contact_number,
        employment_status: user.employee!.employment_status,
        branch: user.employee!.branch,
        department: user.employee!.department,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SecurityConfig.password.saltRounds);
  }

  async signup(signupDto: SignupDto): Promise<{ 
    message: string;
    temporaryPassword: string;
    email: string;
  }> {
    try {
      console.log('📝 Signup request received:', {
        email: signupDto.email,
        first_name: signupDto.first_name,
        branch_id: signupDto.branch_id,
        department_id: signupDto.department_id,
      });

      // Check if email already exists
      const existingEmail = await this.employeeRepository.findOne({
        where: { email: signupDto.email },
      });

      if (existingEmail) {
        console.warn('⚠️ Email already exists:', signupDto.email);
        throw new ConflictException(
          `Email ${signupDto.email} is already registered`,
        );
      }

      // Check if username (email) already exists in user_account
      const existingUsername = await this.userAccountRepository.findOne({
        where: { username: signupDto.email },
      });

      if (existingUsername) {
        console.warn('⚠️ Username already exists:', signupDto.email);
        throw new ConflictException(
          `Username ${signupDto.email} already exists`,
        );
      }

      // Generate random 6-digit password
      const temporaryPassword = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔐 Generated temporary password:', temporaryPassword);

      // Use transaction to create both employee and user account
      await this.dataSource.transaction(async (manager) => {
        console.log('📦 Starting transaction...');
        
        try {
          // Get repositories for transaction
          const employeeRepo = manager.getRepository(Employee);
          const userAccountRepo = manager.getRepository(UserAccount);
          
          // Create employee - let TypeORM generate UUID
          const employee = employeeRepo.create({
            first_name: signupDto.first_name,
            last_name: signupDto.last_name,
            middle_name: signupDto.middle_name,
            email: signupDto.email,
            role: signupDto.role || UserRole.EMPLOYEE,
            position: signupDto.position,
            contact_number: signupDto.contact_number,
            employment_status: false, // Inactive until admin verifies
            branch_id: signupDto.branch_id,
            department_id: signupDto.department_id,
          });
          
          console.log('💾 Saving employee with data:', {
            email: employee.email,
            first_name: employee.first_name,
          });

          const savedEmployee = await employeeRepo.save(employee);
          console.log('✅ Employee created:', {
            employee_id: savedEmployee.employee_id,
            email: savedEmployee.email,
          });

          // Hash password
          const hashedPassword = await bcrypt.hash(
            temporaryPassword,
            SecurityConfig.password.saltRounds,
          );
          console.log('✅ Password hashed');

          // Create user account
          const userAccount = userAccountRepo.create({
            employee_id: savedEmployee.employee_id,
            username: signupDto.email,
            password: hashedPassword,
            password_changed: false,
          });
          
          console.log('💾 Saving user account with data:', {
            employee_id: userAccount.employee_id,
            username: userAccount.username,
          });

          await userAccountRepo.save(userAccount);
          console.log('✅ User account created:', {
            username: userAccount.username,
            password_changed: userAccount.password_changed,
          });
        } catch (txError) {
          console.error('❌ Transaction error:', {
            message: txError.message,
            code: txError.code,
            detail: txError.detail,
            stack: txError.stack,
          });
          throw txError;
        }
      });

      console.log('✅ Signup completed successfully');
      return {
        message: 'Registration successful! Account created with temporary password. Please change password on first login.',
        temporaryPassword: temporaryPassword,
        email: signupDto.email,
      };
    } catch (error) {
      console.error('❌ Signup error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        fullError: error,
      });
      
      // If it's a database error, provide more details
      if (error.code) {
        throw new BadRequestException({
          message: `Database error: ${error.message}`,
          code: error.code,
          detail: error.detail,
        });
      }
      
      throw error;
    }
  }
}
