import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { imageUploadMulterOptions } from './image-upload.multer-options';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', imageUploadMulterOptions))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    return this.uploadsService.buildUploadResult(file);
  }
}
