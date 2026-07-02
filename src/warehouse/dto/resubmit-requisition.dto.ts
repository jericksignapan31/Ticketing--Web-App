import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, IsNotEmpty, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EditRequisitionItemDto {
  @ApiProperty({
    example: 'item-uuid-123',
    description: 'Item ID',
  })
  @IsString()
  item_id: string;

  @ApiProperty({
    example: 'Mechanical Keyboard',
    description: 'Item name',
  })
  @IsString()
  @IsNotEmpty()
  item_name: string;

  @ApiProperty({
    example: 3,
    description: 'Updated quantity',
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'pcs',
    description: 'Unit of measurement',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    example: 'CDR King',
    description: 'Supplier name (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiProperty({
    example: 450,
    description: 'Unit cost (optional)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_cost?: number;

  @ApiProperty({
    example: 'For urgent repair',
    description: 'Purpose/remarks (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  purpose_remarks?: string;
}

export class ResubmitRequisitionDto {
  @ApiProperty({
    example: 'RF2026001',
    description: 'Requisition RF number (from URL parameter)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rf_number?: string;

  @ApiProperty({
    type: [EditRequisitionItemDto],
    description: 'Edited items with updated details (optional)',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditRequisitionItemDto)
  @IsOptional()
  edited_items?: EditRequisitionItemDto[];

  @ApiProperty({
    example: 'We checked the suppliers and found better alternatives with lower cost',
    description: 'IT response notes to warehouse feedback (minimum 10 characters)',
    required: false,
  })
  @IsString()
  @MinLength(10, { message: 'it_response_notes must be at least 10 characters long' })
  @IsOptional()
  it_response_notes?: string;
}
