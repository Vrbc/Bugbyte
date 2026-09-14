import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AuthModule } from 'src/auth/auth.module';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [AuthModule, SessionsModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
