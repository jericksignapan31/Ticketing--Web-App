import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartWorkDto {
  @ApiProperty({
    example: 'Starting to diagnose the issue',
    description: 'Optional initial notes when starting work',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
