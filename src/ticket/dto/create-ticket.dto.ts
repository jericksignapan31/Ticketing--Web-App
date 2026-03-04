import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @ApiProperty({ example: 'EMP002', required: false })
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @ApiProperty({ example: 'Hardware' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'high' })
  @IsString()
  @IsNotEmpty()
  priority: string;

  @ApiProperty({ example: 'open', default: 'open', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Laptop keyboard not working' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: 'The keyboard stopped working after a Windows update',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-03-04T10:30:00Z', required: false })
  @IsDateString()
  @IsOptional()
  resolved_at?: Date;

  @ApiProperty({ example: '2024-03-04T12:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  closed_at?: Date;

  @ApiProperty({
    example: 'Replaced keyboard. Issue resolved.',
    required: false,
  })
  @IsString()
  @IsOptional()
  resolution_notes?: string;
}
