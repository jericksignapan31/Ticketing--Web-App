import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 1, description: 'Employee ID' })
  @IsNotEmpty()
  @IsNumber()
  employee_id: number;

  @ApiProperty({ example: 1, description: 'Branch ID', required: false })
  @IsOptional()
  @IsNumber()
  branch_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Department ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty({
    example: 'Smith',
    description: 'Middle name',
    required: false,
  })
  @IsOptional()
  @IsString()
  middle_name?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'employee',
    description: 'User role',
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Role must be one of: admin, it, employee' })
  role: UserRole;

  @ApiProperty({
    example: 'Software Developer',
    description: 'Position',
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    example: '09123456789',
    description: 'Contact number',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({
    example: true,
    description: 'Employment status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  employment_status?: boolean;
}
