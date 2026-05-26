import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketPartsDto {
  @ApiProperty({
    example: 'Keyboard',
    description: 'Name of the part',
  })
  @IsString()
  @IsNotEmpty()
  part_name: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of parts needed',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 500,
    description: 'Cost per unit',
  })
  @IsNumber()
  @IsNotEmpty()
  unit_cost: number;

  @ApiProperty({
    example: 'Lazada',
    description: 'Supplier/Store name',
  })
  @IsString()
  @IsNotEmpty()
  supplier: string;

  @ApiProperty({
    example: 'High quality mechanical keyboard',
    description: 'Additional notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
