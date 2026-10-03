import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [SessionsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
