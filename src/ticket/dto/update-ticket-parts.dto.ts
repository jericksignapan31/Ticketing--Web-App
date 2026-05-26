import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketPartsDto {
  @ApiProperty({
    example: 'received',
    description: 'Status of the part: pending, ordered, received',
    enum: ['pending', 'ordered', 'received'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'Parts arrived and inspected',
    description: 'Update notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
