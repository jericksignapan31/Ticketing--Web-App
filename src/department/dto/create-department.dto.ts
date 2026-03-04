import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'IT Department' })
  @IsString()
  @IsNotEmpty()
  department_name: string;

  @ApiProperty({
    example: 'Information Technology and Support',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'active', default: 'active' })
  @IsString()
  @IsOptional()
  status?: string;
}
