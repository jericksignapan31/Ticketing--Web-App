import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResubmitRequisitionDto {
  @ApiProperty({
    example: 'RF2026001',
    description: 'Requisition RF number (from URL parameter)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rf_number?: string;
}
