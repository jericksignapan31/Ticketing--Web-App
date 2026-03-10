import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    example: 'EMP001',
    description: 'Employee creating the ticket (auto-filled from JWT)',
    required: false,
  })
  @IsString()
  @IsOptional()
  employee_id?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Asset that needs repair',
  })
  @IsString()
  @IsNotEmpty()
  asset_id: string;

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
