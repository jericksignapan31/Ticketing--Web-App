import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
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
    example: 'IT Department',
    description: 'Department requesting',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

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
