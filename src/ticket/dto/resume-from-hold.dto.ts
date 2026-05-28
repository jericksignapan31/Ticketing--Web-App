import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResumeFromHoldDto {
  @ApiProperty({
    example: 'Parts have arrived, resuming work',
    description: 'Optional notes when resuming work from hold',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
