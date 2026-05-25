import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'LAP-2024-001' })
  @IsString()
  @IsNotEmpty()
  asset_tag: string;

  @ApiProperty({
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  brand_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Branch/Station ID where the asset is located',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  branch_id?: number;

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

  @ApiProperty({
    example: 'available',
    default: 'available',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  assigned_to?: number;

  @ApiProperty({
    example: 'Additional notes about the asset',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: {
      cpu: 'Intel Core i5-1145G7',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      display: '14-inch FHD',
      os: 'Windows 11 Pro',
    },
    required: false,
  })
  @IsOptional()
  specifications?: any;

  @ApiProperty({
    example: '192.168.1.100',
    description: 'IP address of the device (for computers/laptops)',
    required: false,
  })
  @IsString()
  @IsOptional()
  ip_address?: string;

  @ApiProperty({
    example: '00:1B:44:11:3A:B7',
    description: 'MAC address of the device',
    required: false,
  })
  @IsString()
  @IsOptional()
  mac_address?: string;

  @ApiProperty({
    example: 'DESKTOP-001',
    description: 'Computer hostname',
    required: false,
  })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiProperty({
    example: 'good',
    description: 'Asset condition (excellent, good, fair, poor, broken)',
    required: false,
    default: 'good',
  })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({
    example: '987654321',
    description: 'AnyDesk remote support ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  anydesk_id?: string;
}
