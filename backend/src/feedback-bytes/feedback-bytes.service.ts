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
import { SessionRealtimeGateway } from 'src/realtime/session-realtime.gateway';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/paginate.util';

const COMMENT_REQUIRED_TYPES: FeedbackType[] = [
  FeedbackType.BUG,
  FeedbackType.SUGGESTION,
  FeedbackType.DIFFICULTY_SPIKE,
];

@Injectable()
export class FeedbackBytesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: SessionRealtimeGateway,
  ) {}

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
        campaignId: true,
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

    if (COMMENT_REQUIRED_TYPES.includes(dto.type) && !dto.comment?.trim()) {
      throw new BadRequestException(
        'Comment is required for this feedback type.',
      );
    }

    const feedbackByte = await this.prisma.feedbackByte.create({
      data: {
        sessionId,
        testerId: user.id,
        type: dto.type,
        timestampSeconds: dto.timestampSeconds,
        severity: dto.severity ?? null,
        comment: dto.comment?.trim() || null,
        reproductionSteps: dto.reproductionSteps?.trim() || null,
        screenshotUrl: dto.screenshotUrl?.trim() || null,
      },
      select: this.feedbackByteSelect(),
    });

    this.realtimeGateway.broadcastNewFeedback(sessionId, feedbackByte);
    this.realtimeGateway.broadcastCampaignTimelineChanged(session.campaignId);

    return feedbackByte;
  }

  async findFeedbackBytesForSession(
    user: CurrentUserPayload,
    sessionId: string,
    query: PaginationQueryDto,
  ) {
    await this.ensureSessionAccess(user, sessionId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.FeedbackByteWhereInput = {
      sessionId,
    };

    const [items, total] = await Promise.all([
      this.prisma.feedbackByte.findMany({
        where,
        orderBy: [
          {
            timestampSeconds: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        select: this.feedbackByteSelect(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedbackByte.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
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
