import { Module } from '@nestjs/common';
import { FeedbackBytesController } from './feedback-bytes.controller';
import { FeedbackBytesService } from './feedback-bytes.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackBytesController],
  providers: [FeedbackBytesService],
})
export class FeedbackBytesModule {}
