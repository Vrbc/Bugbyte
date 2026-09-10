import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  buildUploadResult(file?: Express.Multer.File): { url: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return { url: `/uploads/${file.filename}` };
  }
}
