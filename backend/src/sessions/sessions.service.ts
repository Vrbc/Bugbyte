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

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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
        status: SessionStatus.LIVE,
      },
      include: this.sessionDetailsInclude(),
    });
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
        status: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    if (session.status !== SessionStatus.LIVE) {
      throw new BadRequestException('Only live sessions can be ended.');
    }

    const endedAt = new Date();

    const duration = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedSession = await tx.testSession.update({
        where: {
          id: id,
          testerId: user.id,
        },
        data: {
          endedAt: endedAt,
          durationSeconds: duration,
          status: SessionStatus.COMPLETED,
          finalFunRating: dto.finalFunRating,
          finalClarityRating: dto.finalClarityRating,
          finalComment: dto.finalComment?.trim() || null,
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
          game: true,
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
              developerProfile: true,
            },
          },
        },
      },
      tester: {
        select: {
          id: true,
          username: true,
          email: true,
          testerProfile: true,
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
