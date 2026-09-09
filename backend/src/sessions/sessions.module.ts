import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthModule } from 'src/auth/auth.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
