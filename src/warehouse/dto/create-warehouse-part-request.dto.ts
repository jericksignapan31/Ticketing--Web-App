import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarehousePartRequestDto {
  @ApiProperty({
    example: 'Keyboard',
    description: 'Name of the part to request',
  })
  @IsString()
  part_name: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity needed',
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 500,
    description: 'Cost per unit',
  })
  @IsNumber()
  @Min(0.01)
  unit_cost: number;

  @ApiProperty({
    example: 'Lazada',
    description: 'Supplier name',
  })
  @IsString()
  supplier: string;

  @ApiProperty({
    example: 'Bulk order for spare parts',
    description: 'Notes for the request',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
