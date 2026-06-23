import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTesterReviewDto } from './dto/create-tester-review.dto';
import { Prisma, SessionStatus, TesterLevel } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    user: CurrentUserPayload,
    sessionId: string,
    dto: CreateTesterReviewDto,
  ) {
    const session = await this.prisma.testSession.findFirst({
      where: {
        id: sessionId,
        campaign: {
          developerId: user.id,
        },
      },
      select: {
        id: true,
        testerId: true,
        status: true,
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException('Only completed sessions can be reviewed.');
    }

    if (session.review) {
      throw new ConflictException('This session has already been reviewed');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.testerReview.create({
        data: {
          sessionId,
          developerId: user.id,
          testerId: session.testerId,
          rating: dto.rating,
          helpful: dto.helpful,
          comment: dto.comment?.trim() || null,
        },
        include: this.reviewInclude(),
      });

      await this.updateTesterReputation(tx, session.testerId, dto.rating);

      return review;
    });
  }

  async findReviewsForTester(testerId: string) {
    return this.prisma.testerReview.findMany({
      where: {
        testerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.reviewInclude(),
    });
  }

  async updateTesterReputation(
    tx: Prisma.TransactionClient,
    testerId: string,
    newRating: number,
  ) {
    const reviews = await tx.testerReview.findMany({
      where: {
        testerId,
      },
      select: {
        rating: true,
      },
    });

    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = ratingSum / reviews.length;

    const currentProfile = await tx.testerProfile.findUnique({
      where: {
        userId: testerId,
      },
      select: {
        reputationPoints: true,
      },
    });

    if (!currentProfile) {
      throw new NotFoundException('Tester profile not found.');
    }

    const newReputationPoints =
      currentProfile.reputationPoints + newRating * 10;

    await tx.testerProfile.update({
      where: {
        userId: testerId,
      },
      data: {
        rating: Number(averageRating.toFixed(2)),
        reputationPoints: newReputationPoints,
        level: this.calculateTesterLevel(newReputationPoints),
      },
    });
  }

  private calculateTesterLevel(points: number): TesterLevel {
    if (points >= 1000) {
      return TesterLevel.ELITE_TESTER;
    }

    if (points >= 600) {
      return TesterLevel.EXPERT_TESTER;
    }

    if (points >= 300) {
      return TesterLevel.TRUSTED_TESTER;
    }

    if (points >= 100) {
      return TesterLevel.RELIABLE_TESTER;
    }

    return TesterLevel.NEW_TESTER;
  }

  private reviewInclude() {
    return {
      session: {
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          campaign: true,
        },
      },
      developer: {
        select: {
          id: true,
          username: true,
          developerProfile: true,
        },
      },
      tester: {
        select: {
          id: true,
          username: true,
          testerProfile: true,
        },
      },
    } satisfies Prisma.TesterReviewInclude;
  }
}
