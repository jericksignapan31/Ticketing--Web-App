import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    example: 1,
    description: 'Employee creating the ticket (auto-filled from JWT)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  employee_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Asset that needs repair',
  })
  @IsNumber()
  @IsNotEmpty()
  asset_id: number;

  @ApiProperty({ example: 'Hardware', description: 'Category of the issue' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: 'high',
    description: 'Priority level: low, medium, high, critical',
  })
  @IsString()
  @IsNotEmpty()
  priority: string;

  @ApiProperty({
    example: 'Laptop keyboard not working',
    description: 'Brief summary of the issue',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example:
      'The keyboard stopped working after a Windows update. Keys do not respond when pressed.',
    description: 'Detailed description of the issue',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'https://storage.example.com/images/broken-keyboard.jpg',
    description: 'Photo of the broken asset/issue',
    required: false,
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}
