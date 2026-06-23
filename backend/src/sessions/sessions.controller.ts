import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SessionsService } from './sessions.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type CurrentUserPayload,
} from 'src/auth/decorators/current-user.decorator';
import { EndSessionDto } from './dto/end-session.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('applications/:applicationId/start-session')
  @Roles(UserRole.TESTER)
  startSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('applicationId') applicationId: string,
  ) {
    return this.sessionsService.startSession(user, applicationId);
  }

  @Get('sessions/my')
  @Roles(UserRole.TESTER)
  findMySessions(@CurrentUser() user: CurrentUserPayload) {
    return this.sessionsService.findMySessions(user);
  }

  @Get('sessions/:id')
  @Roles(UserRole.TESTER, UserRole.DEVELOPER)
  findOneSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.sessionsService.findOneSession(user, id);
  }

  @Patch('sessions/:id/end')
  @Roles(UserRole.TESTER)
  endSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: EndSessionDto,
  ) {
    return this.sessionsService.endSession(user, id, dto);
  }
}
