import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileUploadConfig } from '../config/file-upload.config';
import { FileAttachmentDto } from '../dto/file-attachment.dto';

@Injectable()
export class FileUploadService {
  async saveUploadedFile(
    file: any,
    conversationId: string,
  ): Promise<FileAttachmentDto> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${conversationId}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = fileUploadConfig.uploadDir;
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    // Generate file URL (adjust based on your setup)
    const fileUrl = `/api/chat/files/${fileName}`;

    // Create attachment DTO
    const attachment: FileAttachmentDto = {
      filename: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      file_url: fileUrl,
    };

    // Generate preview for images
    if (this.isImageFile(file.mimetype)) {
      attachment.preview_url = fileUrl; // URL to same file for preview
    }

    return attachment;
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(fileUploadConfig.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private validateFile(file: any): void {
    // Check file size
    if (file.size > fileUploadConfig.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${fileUploadConfig.maxFileSize / 1024 / 1024}MB limit`,
      );
    }

    // Check file type
    if (!fileUploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!fileUploadConfig.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File extension ${fileExtension} is not allowed`,
      );
    }
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  async getFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(fileUploadConfig.uploadDir, fileName);
    return await fs.readFile(filePath);
  }
}
