import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeclineRequisitionDto {
  @ApiProperty({
    example: 'The requested items are out of stock',
    description: 'Reason for declining the requisition (admin only)',
  })
  @IsString()
  @IsNotEmpty({ message: 'decline_reason is required' })
  @MinLength(10, { message: 'decline_reason must be at least 10 characters long' })
  decline_reason: string;
}
