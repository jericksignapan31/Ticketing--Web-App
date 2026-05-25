import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class SignupDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  branch_id?: number;

  @ApiProperty({
    description: 'Department ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  department_id?: number;

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
    description: 'Email address (used as username)',
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
}
