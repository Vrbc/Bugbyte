import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  CampaignStatus,
  Prisma,
  SessionStatus,
} from '@prisma/client';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { EndSessionDto } from './dto/end-session.dto';
import { SessionRealtimeGateway } from 'src/realtime/session-realtime.gateway';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: SessionRealtimeGateway,
  ) {}

  async startSession(user: CurrentUserPayload, applicationId: string) {
    const application = await this.prisma.campaignApplication.findFirst({
      where: {
        id: applicationId,
        testerId: user.id,
      },
      include: {
        campaign: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new BadRequestException(
        'Only accepted applications can start a test session.',
      );
    }

    if (application.campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active campaigns can have new sessions.',
      );
    }

    const existingSession = await this.prisma.testSession.findUnique({
      where: {
        applicationId,
      },
      include: this.sessionDetailsInclude(),
    });

    if (existingSession) {
      return existingSession;
    }

    return this.prisma.testSession.create({
      data: {
        applicationId,
        campaignId: application.campaignId,
        testerId: user.id,
        status: SessionStatus.PAUSED,
        pausedAt: new Date(),
      },
      include: this.sessionDetailsInclude(),
    });
  }

  async pauseSession(user: CurrentUserPayload, id: string) {
    const session = await this.prisma.testSession.findFirst({
      where: { id, testerId: user.id },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.status !== SessionStatus.LIVE) {
      throw new BadRequestException('Only live sessions can be paused.');
    }

    const updated = await this.prisma.testSession.update({
      where: { id },
      data: { status: SessionStatus.PAUSED, pausedAt: new Date() },
      include: this.sessionDetailsInclude(),
    });

    this.realtimeGateway.broadcastSessionStatus(id, updated);

    return updated;
  }

  async resumeSession(user: CurrentUserPayload, id: string) {
    const session = await this.prisma.testSession.findFirst({
      where: { id, testerId: user.id },
      select: {
        id: true,
        status: true,
        pausedAt: true,
        pausedDurationSeconds: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException('Only paused sessions can be resumed.');
    }

    const additionalPause = session.pausedAt
      ? Math.max(
          0,
          Math.floor((Date.now() - session.pausedAt.getTime()) / 1000),
        )
      : 0;

    const updated = await this.prisma.testSession.update({
      where: { id },
      data: {
        status: SessionStatus.LIVE,
        pausedAt: null,
        pausedDurationSeconds: session.pausedDurationSeconds + additionalPause,
      },
      include: this.sessionDetailsInclude(),
    });

    this.realtimeGateway.broadcastSessionStatus(id, updated);

    return updated;
  }

  async findMySessions(user: CurrentUserPayload) {
    return this.prisma.testSession.findMany({
      where: {
        testerId: user.id,
      },
      include: this.sessionListInclude(),
    });
  }

  async findOneSession(user: CurrentUserPayload, id: string) {
    const session = await this.prisma.testSession.findFirst({
      where: {
        id,
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
      include: this.sessionDetailsInclude(),
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }
    return session;
  }

  async endSession(user: CurrentUserPayload, id: string, dto: EndSessionDto) {
    const session = await this.prisma.testSession.findFirst({
      where: {
        id: id,
        testerId: user.id,
      },
      select: {
        id: true,
        applicationId: true,
        startedAt: true,
        endedAt: true,
        durationSeconds: true,
        status: true,
        pausedAt: true,
        pausedDurationSeconds: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (
      session.status !== SessionStatus.LIVE &&
      session.status !== SessionStatus.PAUSED &&
      session.status !== SessionStatus.CANCELLED
    ) {
      throw new BadRequestException('Only live sessions can be ended.');
    }

    const endedAt =
      session.status === SessionStatus.CANCELLED
        ? session.endedAt!
        : new Date();
    const duration =
      session.status === SessionStatus.CANCELLED
        ? session.durationSeconds!
        : this.computeDurationSeconds(session, endedAt);

    const updatedSession = await this.prisma.$transaction(async (tx) => {
      const updatedSession = await tx.testSession.update({
        where: {
          id: id,
        },
        data: {
          endedAt: endedAt,
          durationSeconds: duration,
          status: SessionStatus.COMPLETED,
          finalFunRating: dto.finalFunRating,
          finalClarityRating: dto.finalClarityRating,
          finalComment: dto.finalComment?.trim() || null,
          finalDifficultyRating: dto.finalDifficultyRating,
        },
        include: this.sessionDetailsInclude(),
      });

      await tx.campaignApplication.update({
        where: {
          id: session.applicationId,
        },
        data: {
          status: ApplicationStatus.COMPLETED,
        },
      });

      return updatedSession;
    });

    this.realtimeGateway.broadcastSessionStatus(id, updatedSession);
    this.realtimeGateway.broadcastCampaignTimelineChanged(
      updatedSession.campaignId,
    );

    return updatedSession;
  }

  async forceEndLiveSessionsForCampaign(campaignId: string): Promise<void> {
    const sessions = await this.prisma.testSession.findMany({
      where: {
        campaignId,
        status: { in: [SessionStatus.LIVE, SessionStatus.PAUSED] },
      },
      select: {
        id: true,
        applicationId: true,
        startedAt: true,
        status: true,
        pausedAt: true,
        pausedDurationSeconds: true,
      },
    });

    for (const session of sessions) {
      const endedAt = new Date();
      const duration = this.computeDurationSeconds(session, endedAt);

      const updatedSession = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.testSession.update({
          where: { id: session.id },
          data: {
            endedAt,
            durationSeconds: duration,
            status: SessionStatus.CANCELLED,
          },
          include: this.sessionDetailsInclude(),
        });

        await tx.campaignApplication.update({
          where: { id: session.applicationId },
          data: { status: ApplicationStatus.COMPLETED },
        });

        return updated;
      });

      this.realtimeGateway.broadcastSessionStatus(session.id, updatedSession);
    }

    if (sessions.length > 0) {
      this.realtimeGateway.broadcastCampaignTimelineChanged(campaignId);
    }
  }

  private computeDurationSeconds(
    session: {
      startedAt: Date;
      status: SessionStatus;
      pausedAt: Date | null;
      pausedDurationSeconds: number;
    },
    now: Date,
  ): number {
    const inProgressPause =
      session.status === SessionStatus.PAUSED && session.pausedAt
        ? Math.max(
            0,
            Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000),
          )
        : 0;
    const totalPaused = session.pausedDurationSeconds + inProgressPause;

    return Math.max(
      0,
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000) -
        totalPaused,
    );
  }

  private sessionListInclude() {
    return {
      campaign: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          game: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
            },
          },
          build: {
            select: {
              id: true,
              version: true,
            },
          },
        },
      },
      _count: {
        select: {
          feedbackBytes: true,
        },
      },
    } satisfies Prisma.TestSessionInclude;
  }

  private sessionDetailsInclude() {
    return {
      campaign: {
        select: {
          id: true,
          title: true,
          type: true,
          instructions: true,
          status: true,
          game: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
            },
          },
          build: {
            select: {
              id: true,
              version: true,
              buildUrl: true,
              changelog: true,
              status: true,
              createdAt: true,
            },
          },
          developer: {
            select: {
              id: true,
              username: true,
              developerProfile: {
                select: {
                  studioName: true,
                },
              },
            },
          },
        },
      },
      tester: {
        select: {
          id: true,
          username: true,
          email: true,
          testerProfile: {
            select: {
              rating: true,
              level: true,
              experienceLevel: true,
              platforms: true,
            },
          },
        },
      },
      _count: {
        select: {
          feedbackBytes: true,
        },
      },
    } satisfies Prisma.TestSessionInclude;
  }
}
