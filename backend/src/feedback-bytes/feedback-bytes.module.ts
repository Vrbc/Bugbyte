import { Module } from '@nestjs/common';
import { FeedbackBytesController } from './feedback-bytes.controller';
import { FeedbackBytesService } from './feedback-bytes.service';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [FeedbackBytesController],
  providers: [FeedbackBytesService],
})
export class FeedbackBytesModule {}
