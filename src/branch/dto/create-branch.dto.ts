import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Office' })
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @ApiProperty({ example: 'Manila, Philippines' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '+63-2-1234-5678', required: false })
  @IsString()
  @IsOptional()
  contact_number?: string;

  @ApiProperty({ example: 'active', default: 'active' })
  @IsString()
  @IsOptional()
  status?: string;
}
