import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SessionRealtimeGateway } from './session-realtime.gateway';

@Module({
  imports: [AuthModule],
  providers: [SessionRealtimeGateway],
  exports: [SessionRealtimeGateway],
})
export class RealtimeModule {}
