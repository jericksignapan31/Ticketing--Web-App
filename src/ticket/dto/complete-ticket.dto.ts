import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTicketDto {
  @ApiProperty({
    example: 'working',
    description:
      'Status of the unit after repair: working, not_working, partially_working',
    enum: ['working', 'not_working', 'partially_working'],
  })
  @IsString()
  @IsNotEmpty()
  unit_status: string;

  @ApiProperty({
    example: 'Keyboard was not responding. Found that drivers were corrupted.',
    description: "IT staff's observation about the issue",
  })
  @IsString()
  @IsNotEmpty()
  observation: string;

  @ApiProperty({
    example:
      'Reinstalled keyboard drivers and tested all keys. All keys now responsive.',
    description: 'Actions taken to resolve the issue',
  })
  @IsString()
  @IsNotEmpty()
  action_taken: string;

  @ApiProperty({
    example: 'Consider updating all drivers monthly to prevent similar issues.',
    description: 'Recommendations for future prevention',
    required: false,
  })
  @IsString()
  @IsOptional()
  recommendation?: string;

  @ApiProperty({
    example: 'Issue resolved. Unit tested and working properly.',
    description: 'Additional resolution notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  resolution_notes?: string;
}
