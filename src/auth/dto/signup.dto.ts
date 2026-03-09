import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class SignupDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 'EMP002',
  })
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @ApiProperty({
    description: 'Branch ID',
    example: 'BR001',
    required: false,
  })
  @IsString()
  @IsOptional()
  branch_id?: string;

  @ApiProperty({
    description: 'Department ID',
    example: 'DEPT001',
    required: false,
  })
  @IsString()
  @IsOptional()
  department_id?: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'Middle name',
    example: 'Smith',
    required: false,
  })
  @IsString()
  @IsOptional()
  middle_name?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
    default: UserRole.EMPLOYEE,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: 'Position/Job title',
    example: 'Software Developer',
    required: false,
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    description: 'Contact number',
    example: '09123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  contact_number?: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'StrongP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
