import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveWarehousePartRequestDto {
  @ApiProperty({
    example: 'RF2026001',
    description: 'Requisition RF number (from URL parameter)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rf_number?: string;

  @ApiProperty({
    example: 'approved',
    enum: ['approved', 'rejected'],
    description: 'Action to take on the request',
  })
  @IsString()
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @ApiProperty({
    example: 'Out of stock with this supplier',
    description: 'Reason for rejection (required if action is rejected)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
