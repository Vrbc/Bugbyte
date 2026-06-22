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
