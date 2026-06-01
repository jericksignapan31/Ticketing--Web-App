import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class FileAttachmentDto {
  @IsOptional()
  @IsUUID()
  attachment_id?: string;

  @IsString()
  filename!: string;

  @IsString()
  file_type!: string;

  @IsNumber()
  file_size!: number;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  preview_url?: string;

  @IsOptional()
  uploaded_at?: Date;
}

export class FileAttachmentResponseDto {
  attachment_id!: string;
  message_id!: string;
  filename!: string;
  file_type!: string;
  file_size!: number;
  file_url!: string;
  preview_url!: string;
  uploaded_at!: Date;
}
