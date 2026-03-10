import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectTicketDto {
  @ApiProperty({
    example: 'The issue described is not clear. Please provide more details.',
    description: 'Reason for rejecting the ticket',
  })
  @IsString()
  @IsNotEmpty()
  rejection_reason: string;
}
