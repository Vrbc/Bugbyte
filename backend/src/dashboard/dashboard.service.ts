import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  CampaignStatus,
  SessionStatus,
} from '@prisma/client';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeveloperDashboard(user: CurrentUserPayload) {
    const [
      gamesCount,
      campaignsCount,
      activeCampaignsCount,
      pendingApplicationsCount,
      liveSessionsCount,
      feedbackBytesCount,
      recentCampaigns,
      recentApplications,
    ] = await Promise.all([
      this.prisma.game.count({
        where: {
          developerId: user.id,
        },
      }),

      this.prisma.playtestCampaign.count({
        where: {
          developerId: user.id,
        },
      }),

      this.prisma.playtestCampaign.count({
        where: {
          developerId: user.id,
          status: CampaignStatus.ACTIVE,
        },
      }),

      this.prisma.campaignApplication.count({
        where: {
          status: ApplicationStatus.PENDING,
          campaign: {
            developerId: user.id,
          },
        },
      }),

      this.prisma.testSession.count({
        where: {
          status: SessionStatus.LIVE,
          campaign: {
            developerId: user.id,
          },
        },
      }),

      this.prisma.feedbackByte.count({
        where: {
          session: {
            campaign: {
              developerId: user.id,
            },
          },
        },
      }),

      this.prisma.playtestCampaign.findMany({
        where: {
          developerId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          createdAt: true,
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
          _count: {
            select: {
              applications: true,
              sessions: true,
            },
          },
        },
      }),

      this.prisma.campaignApplication.findMany({
        where: {
          status: ApplicationStatus.PENDING,
          campaign: {
            developerId: user.id,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          status: true,
          message: true,
          createdAt: true,
          tester: {
            select: {
              id: true,
              username: true,
              testerProfile: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
              game: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        gamesCount,
        campaignsCount,
        activeCampaignsCount,
        pendingApplicationsCount,
        liveSessionsCount,
        feedbackBytesCount,
      },
      recentCampaigns,
      recentApplications,
    };
  }

  async getTesterDashboard(user: CurrentUserPayload) {
    const testerProfile = await this.prisma.testerProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!testerProfile) {
      throw new NotFoundException('Tester profile not found.');
    }

    const [
      applicationsCount,
      pendingApplicationsCount,
      acceptedApplicationsCount,
      completedSessionsCount,
      feedbackBytesCount,
      recentApplications,
      recommendedCampaigns,
    ] = await Promise.all([
      this.prisma.campaignApplication.count({
        where: {
          testerId: user.id,
        },
      }),

      this.prisma.campaignApplication.count({
        where: {
          testerId: user.id,
          status: ApplicationStatus.PENDING,
        },
      }),

      this.prisma.campaignApplication.count({
        where: {
          testerId: user.id,
          status: ApplicationStatus.ACCEPTED,
        },
      }),

      this.prisma.testSession.count({
        where: {
          testerId: user.id,
          status: SessionStatus.COMPLETED,
        },
      }),

      this.prisma.feedbackByte.count({
        where: {
          testerId: user.id,
        },
      }),

      this.prisma.campaignApplication.findMany({
        where: {
          testerId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
              type: true,
              estimatedMinutes: true,
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
        },
      }),

      this.prisma.playtestCampaign.findMany({
        where: {
          status: CampaignStatus.ACTIVE,
          minTesterRating: {
            lte: testerProfile.rating,
          },
          requiredPlatforms: {
            hasSome: testerProfile.platforms,
          },
          applications: {
            none: {
              testerId: user.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          requiredPlatforms: true,
          estimatedMinutes: true,
          minTesterRating: true,
          createdAt: true,
          game: {
            select: {
              id: true,
              title: true,
              genre: true,
              coverImageUrl: true,
            },
          },
          build: {
            select: {
              id: true,
              version: true,
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
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
    ]);

    return {
      profile: {
        rating: testerProfile.rating,
        reputationPoints: testerProfile.reputationPoints,
        level: testerProfile.level,
        platforms: testerProfile.platforms,
        favoriteGenres: testerProfile.favoriteGenres,
        experienceLevel: testerProfile.experienceLevel,
      },
      stats: {
        applicationsCount,
        pendingApplicationsCount,
        acceptedApplicationsCount,
        completedSessionsCount,
        feedbackBytesCount,
      },
      recentApplications,
      recommendedCampaigns,
    };
  }
}
