import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FeedbackBytesService } from './feedback-bytes.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { CreateFeedbackByteDto } from './dto/create-feedback-byte.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('sessions/:sessionId/feedback-bytes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackBytesController {
  constructor(private readonly feedbackBytesService: FeedbackBytesService) {}

  @Post()
  @Roles(UserRole.TESTER)
  createFeedbackByte(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateFeedbackByteDto,
  ) {
    return this.feedbackBytesService.createFeedbackByte(user, sessionId, dto);
  }

  @Get()
  @Roles(UserRole.TESTER, UserRole.DEVELOPER)
  findFeedbackBytesForSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.feedbackBytesService.findFeedbackBytesForSession(
      user,
      sessionId,
    );
  }
}
