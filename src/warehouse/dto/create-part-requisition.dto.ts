import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Matches, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequisitionItemDto {
  @ApiProperty({
    example: 'Mechanical Keyboard',
    description: 'Item name',
  })
  @IsString()
  item_name: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity needed',
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'pcs',
    description: 'Unit of measurement',
  })
  @IsString()
  unit: string;

  @ApiProperty({
    example: 'Lazada',
    description: 'Supplier name (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiProperty({
    example: 500,
    description: 'Unit cost (optional)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_cost?: number;

  @ApiProperty({
    example: 'For keyboard repair',
    description: 'Purpose/remarks',
    required: false,
  })
  @IsString()
  @IsOptional()
  purpose_remarks?: string;
}

export class CreatePartRequisitionDto {
  @ApiProperty({
    example: 'RF2026001',
    description: 'Requisition Form number (alphanumeric, 3-50 characters, unique)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'rf_number must be alphanumeric (A-Z, 0-9 only)',
  })
  @MinLength(3, { message: 'rf_number must be at least 3 characters' })
  @MaxLength(50, { message: 'rf_number must not exceed 50 characters' })
  rf_number: string;

  @ApiProperty({
    example: 'a19c815c-1b67-477f-a7c1-62df4b7e04f5',
    description: 'Department ID requesting (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  department_id?: string;

  @ApiProperty({
    example: '2026-06-15',
    description: 'Deadline for delivery',
    required: false,
  })
  @IsOptional()
  deadline?: Date;

  @ApiProperty({
    type: [CreateRequisitionItemDto],
    description: 'Items to request',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequisitionItemDto)
  items: CreateRequisitionItemDto[];
}
