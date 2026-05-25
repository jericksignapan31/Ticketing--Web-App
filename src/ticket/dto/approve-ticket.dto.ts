import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveTicketDto {
  @ApiProperty({
    example: 1,
    description: 'IT employee ID to assign the ticket to',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  assigned_to?: number;
}
