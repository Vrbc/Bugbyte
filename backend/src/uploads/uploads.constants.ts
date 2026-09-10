import { join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
