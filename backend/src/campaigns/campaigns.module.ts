import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AuthModule } from 'src/auth/auth.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { FeedbackBytesModule } from 'src/feedback-bytes/feedback-bytes.module';

@Module({
  imports: [AuthModule, SessionsModule, FeedbackBytesModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
