import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'LAP-2024-001' })
  @IsString()
  @IsNotEmpty()
  asset_tag: string;

  @ApiProperty({
    example: 'uuid-of-brand',
    required: false,
  })
  @IsString()
  @IsOptional()
  brand_id?: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Dell Latitude 5420', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'SN123456789', required: false })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  purchase_date?: Date;

  @ApiProperty({ example: '2027-01-15', required: false })
  @IsDateString()
  @IsOptional()
  warranty_expiry_date?: Date;

  @ApiProperty({
    example: 'available',
    default: 'available',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'EMP001', required: false })
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @ApiProperty({ example: 'Main Office - IT Department', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'Additional notes about the asset',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
