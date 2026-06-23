import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type CurrentUserPayload,
} from 'src/auth/decorators/current-user.decorator';
import { CreateTesterReviewDto } from './dto/create-tester-review.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('sessions/:sessionId/review')
  @Roles(UserRole.DEVELOPER)
  createReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateTesterReviewDto,
  ) {
    return this.reviewsService.createReview(user, sessionId, dto);
  }

  @Get('testers/:testerId/reviews')
  @Roles(UserRole.DEVELOPER, UserRole.TESTER)
  findReviewsForTester(@Param('testerId') testerId: string) {
    return this.reviewsService.findReviewsForTester(testerId);
  }
}
