import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcknowledgeRequisitionDto {
  @ApiProperty({
    example: 'Will order from Lazada and CDR King',
    description: 'Notes from warehouse staff',
    required: false,
  })
  @IsString()
  @IsOptional()
  acknowledged_notes?: string;
}
