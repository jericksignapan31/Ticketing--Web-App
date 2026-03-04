import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP002', description: 'Employee ID' })
  @IsNotEmpty()
  @IsString()
  employee_id: string;

  @ApiProperty({ example: 'BR001', description: 'Branch ID', required: false })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiProperty({
    example: 'DEPT001',
    description: 'Department ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  department_id?: string;

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

  @ApiProperty({ example: 'employee', description: 'Role' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    example: '09123456789',
    description: 'Contact number',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({
    example: 'active',
    description: 'Employment status',
    required: false,
  })
  @IsOptional()
  @IsString()
  employment_status?: string;
}
