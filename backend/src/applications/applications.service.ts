import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplyCampaignDto } from './dto/apply-campaign.dto';
import { ApplicationStatus, CampaignStatus, Prisma } from '@prisma/client';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from 'src/common/paginate.util';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async applyToCampaign(
    user: CurrentUserPayload,
    campaignId: string,
    dto: ApplyCampaignDto,
  ) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        id: campaignId,
        status: CampaignStatus.ACTIVE,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    const testerProfile = await this.prisma.testerProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!testerProfile) {
      throw new BadRequestException('Tester profile not found.');
    }

    if (testerProfile.rating < campaign.minTesterRating) {
      throw new BadRequestException(
        'Your tester rating is below campaign minimum.',
      );
    }

    const testerPlatforms = testerProfile.platforms.map((p) =>
      p.trim().toLowerCase(),
    );

    const hasRequiredPlatform = campaign.requiredPlatforms.some((p) =>
      testerPlatforms.includes(p.trim().toLowerCase()),
    );

    if (!hasRequiredPlatform) {
      throw new BadRequestException(
        'You do not have a required platform for this campaign.',
      );
    }

    const existingApplication =
      await this.prisma.campaignApplication.findUnique({
        where: {
          campaignId_testerId: {
            testerId: user.id,
            campaignId,
          },
        },
      });

    if (existingApplication) {
      if (existingApplication.status !== ApplicationStatus.CANCELLED) {
        throw new ConflictException('You already applied to this campaign');
      }

      return this.prisma.campaignApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: ApplicationStatus.PENDING,
          message: dto.message?.trim() || null,
        },
        select: {
          id: true,
          campaignId: true,
          testerId: true,
          message: true,
          status: true,
          createdAt: true,
        },
      });
    }

    return this.prisma.campaignApplication.create({
      data: {
        campaignId,
        testerId: user.id,
        message: dto.message?.trim() || null,
      },
      select: {
        id: true,
        campaignId: true,
        testerId: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findMyApplications(
    user: CurrentUserPayload,
    query: PaginationQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CampaignApplicationWhereInput = {
      testerId: user.id,
    };

    const [items, total] = await Promise.all([
      this.prisma.campaignApplication.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.applicationForTesterInclude(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaignApplication.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.hideBuildUrlIfNotYetAccepted(item)),
      total,
      page,
      limit,
    );
  }

  async findMyApplicationForCampaign(
    user: CurrentUserPayload,
    campaignId: string,
  ) {
    return this.prisma.campaignApplication.findUnique({
      where: {
        campaignId_testerId: {
          campaignId,
          testerId: user.id,
        },
      },
      select: {
        id: true,
        campaignId: true,
        testerId: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async cancelApplication(user: CurrentUserPayload, id: string) {
    const application = await this.prisma.campaignApplication.findFirst({
      where: {
        id,
        testerId: user.id,
      },
      include: {
        testSession: {
          select: { id: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (
      application.status !== ApplicationStatus.PENDING &&
      application.status !== ApplicationStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'Only pending or accepted applications can be cancelled.',
      );
    }

    if (application.testSession) {
      throw new BadRequestException(
        'This application already has a test session and can no longer be cancelled.',
      );
    }

    const updated = await this.prisma.campaignApplication.update({
      where: { id },
      data: { status: ApplicationStatus.CANCELLED },
      include: this.applicationForTesterInclude(),
    });

    return this.hideBuildUrlIfNotYetAccepted(updated);
  }

  // The tester-facing include always fetches build.buildUrl (see applicationForTesterInclude),
  // but a tester who's only PENDING/REJECTED/CANCELLED shouldn't be able to read it straight
  // out of the API even though the UI only shows the download link once ACCEPTED.
  private hideBuildUrlIfNotYetAccepted<
    T extends {
      status: ApplicationStatus;
      campaign: { build: { buildUrl: string } };
    },
  >(application: T): T {
    if (
      application.status === ApplicationStatus.ACCEPTED ||
      application.status === ApplicationStatus.COMPLETED
    ) {
      return application;
    }

    return {
      ...application,
      campaign: {
        ...application.campaign,
        build: {
          ...application.campaign.build,
          buildUrl: '',
        },
      },
    };
  }

  //DEVELOPER

  async findApplicationsForCampaign(
    user: CurrentUserPayload,
    campaignId: string,
    query: PaginationQueryDto,
  ) {
    await this.ensureCampaignOwnership(user, campaignId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CampaignApplicationWhereInput = {
      campaignId,
    };

    const [items, total] = await Promise.all([
      this.prisma.campaignApplication.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          tester: {
            select: {
              id: true,
              username: true,
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
          testSession: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaignApplication.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async updateApplicationStatus(
    user: CurrentUserPayload,
    id: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.campaignApplication.findFirst({
      where: {
        id,
        campaign: {
          developerId: user.id,
        },
      },
      include: {
        campaign: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    if (
      application.status === ApplicationStatus.COMPLETED ||
      application.status === ApplicationStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Completed or cancelled applications cannot be changed.',
      );
    }

    if (
      dto.status === ApplicationStatus.ACCEPTED &&
      application.status !== ApplicationStatus.ACCEPTED
    ) {
      const acceptedCount = await this.prisma.campaignApplication.count({
        where: {
          campaignId: application.campaignId,
          status: ApplicationStatus.ACCEPTED,
        },
      });

      if (acceptedCount >= application.campaign.requiredTesters) {
        throw new BadRequestException(
          'Required number of testers has already been reached.',
        );
      }
    }

    return this.prisma.campaignApplication.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
      include: this.applicationForDeveloperInclude(),
    });
  }

  private async ensureCampaignOwnership(
    user: CurrentUserPayload,
    campaignId: string,
  ) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        id: campaignId,
        developerId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private applicationForDeveloperInclude() {
    return {
      campaign: {
        include: {
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
              status: true,
            },
          },
        },
      },
      tester: {
        select: {
          id: true,
          username: true,
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
    } satisfies Prisma.CampaignApplicationInclude;
  }
  private applicationForTesterInclude() {
    return {
      campaign: {
        include: {
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
              status: true,
              buildUrl: true,
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
    } satisfies Prisma.CampaignApplicationInclude;
  }
}
