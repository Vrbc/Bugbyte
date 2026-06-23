import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeedbackByteDto } from './dto/create-feedback-byte.dto';
import { FeedbackType, Prisma, SessionStatus } from '@prisma/client';

@Injectable()
export class FeedbackBytesService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedbackByte(
    user: CurrentUserPayload,
    sessionId: string,
    dto: CreateFeedbackByteDto,
  ) {
    const session = await this.prisma.testSession.findFirst({
      where: {
        id: sessionId,
        testerId: user.id,
      },
      select: {
        id: true,
        testerId: true,
        status: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.status !== SessionStatus.LIVE) {
      throw new BadRequestException(
        'Feedback can only be submitted during a live session.',
      );
    }

    if (dto.type === FeedbackType.BUG && !dto.severity) {
      throw new BadRequestException('Bug feedback requires severity.');
    }

    return this.prisma.feedbackByte.create({
      data: {
        sessionId,
        testerId: user.id,
        type: dto.type,
        timestampSeconds: dto.timestampSeconds,
        severity: dto.severity ?? null,
        comment: dto.comment.trim(),
        reproductionSteps: dto.reproductionSteps?.trim() || null,
        screenshotUrl: dto.screenshotUrl?.trim() || null,
      },
      select: this.feedbackByteSelect(),
    });
  }

  async findFeedbackBytesForSession(
    user: CurrentUserPayload,
    sessionId: string,
  ) {
    await this.ensureSessionAccess(user, sessionId);

    return this.prisma.feedbackByte.findMany({
      where: {
        sessionId,
      },
      orderBy: [
        {
          timestampSeconds: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      select: this.feedbackByteSelect(),
    });
  }

  private async ensureSessionAccess(
    user: CurrentUserPayload,
    sessionId: string,
  ) {
    const session = await this.prisma.testSession.findFirst({
      where: {
        id: sessionId,
        OR: [
          {
            testerId: user.id,
          },
          {
            campaign: {
              developerId: user.id,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });
    if (!session) {
      throw new ForbiddenException('You do not have access to this session.');
    }

    return session;
  }

  private feedbackByteSelect() {
    return {
      id: true,
      sessionId: true,
      testerId: true,
      type: true,
      timestampSeconds: true,
      severity: true,
      comment: true,
      reproductionSteps: true,
      screenshotUrl: true,
      createdAt: true,
      tester: {
        select: {
          id: true,
          username: true,
        },
      },
    } satisfies Prisma.FeedbackByteSelect;
  }
}
