import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveTicketDto {
  @ApiProperty({
    example: 'EMP003',
    description: 'IT employee to assign the ticket to',
    required: false,
  })
  @IsString()
  @IsOptional()
  assigned_to?: string;
}
