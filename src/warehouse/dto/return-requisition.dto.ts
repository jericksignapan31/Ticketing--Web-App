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
    description: 'Reason for returning the requisition from warehouse',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'warehouse_notes must be at least 10 characters' })
  warehouse_notes: string;
}
