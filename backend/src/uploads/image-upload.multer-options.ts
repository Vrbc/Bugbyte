import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOADS_DIR,
} from './uploads.constants';

export const imageUploadMulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          'Only JPEG, PNG, WEBP or GIF images are allowed.',
        ),
        false,
      );
      return;
    }

    callback(null, true);
  },
};
