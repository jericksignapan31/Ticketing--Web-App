import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'Dell' })
  @IsString()
  @IsNotEmpty()
  brand_name: string;

  @ApiProperty({ example: 'Dell Technologies Inc.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/images/dell-logo.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  brand_image_url?: string;

  @ApiProperty({ example: true, default: true, required: false })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
