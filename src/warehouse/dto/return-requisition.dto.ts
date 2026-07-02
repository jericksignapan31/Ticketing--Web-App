import { IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnRequisitionDto {
  @ApiProperty({
    example: 'RF2026001',
    description: 'Requisition RF number (from URL parameter)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rf_number?: string;

  @ApiProperty({
    example: 'Items out of stock, need alternative suppliers',
    description: 'Reason for returning the requisition from warehouse (minimum 10 characters)',
  })
  @IsString({ message: 'warehouse_notes must be a string' })
  @IsNotEmpty({ message: 'warehouse_notes is required - please provide reason for returning the requisition' })
  @MinLength(10, { message: 'warehouse_notes must be at least 10 characters long' })
  warehouse_notes: string;
}
