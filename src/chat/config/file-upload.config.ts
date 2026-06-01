import * as path from 'path';

export const fileUploadConfig = {
  // Directory where files will be stored
  uploadDir: path.join(process.cwd(), 'uploads', 'chat'),

  // Max file size: 10MB
  maxFileSize: 10 * 1024 * 1024,

  // Allowed MIME types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ],

  // Allowed file extensions
  allowedExtensions: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.zip',
  ],
};
