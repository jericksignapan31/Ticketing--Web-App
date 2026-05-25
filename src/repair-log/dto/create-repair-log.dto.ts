import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepairLogDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  asset_id: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  reported_by?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  repaired_by?: number;

  @ApiProperty({ example: '2024-03-04T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  repair_date: Date;

  @ApiProperty({ example: 'Screen flickering and display issues' })
  @IsString()
  @IsNotEmpty()
  issue_description: string;

  @ApiProperty({
    example: 'Replaced display cable and updated graphics driver',
    required: false,
  })
  @IsString()
  @IsOptional()
  action_taken?: string;

  @ApiProperty({ example: 'completed', default: 'pending', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 2500.0, required: false })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiProperty({
    example: 'Warranty covered the repair cost',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
