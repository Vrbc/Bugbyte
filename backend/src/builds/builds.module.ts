import { Module } from '@nestjs/common';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BuildsController],
  providers: [BuildsService],
})
export class BuildsModule {}
