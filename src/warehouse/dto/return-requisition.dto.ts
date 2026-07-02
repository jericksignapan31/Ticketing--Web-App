import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnRequisitionDto {
  @ApiProperty({
    example: 'Items out of stock, need alternative suppliers',
    description: 'Reason for returning the requisition from warehouse',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'warehouse_notes must be at least 10 characters' })
  warehouse_notes: string;
}
