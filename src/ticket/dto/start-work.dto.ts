import { ApiProperty } from '@nestjs/swagger';

export class StartWorkDto {
  @ApiProperty({
    example: 'Starting to diagnose the issue',
    description: 'Optional initial notes when starting work',
    required: false,
  })
  notes?: string;
}
