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
      throw new ConflictException('You already applied to this campaign');
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

  async findMyApplications(user: CurrentUserPayload) {
    return this.prisma.campaignApplication.findMany({
      where: {
        testerId: user.id,
      },
      include: this.applicationForTesterInclude(),
    });
  }

  //DEVELOPER

  async findApplicationsForCampaign(
    user: CurrentUserPayload,
    campaignId: string,
  ) {
    await this.ensureCampaignOwnership(user, campaignId);

    return this.prisma.campaignApplication.findMany({
      where: {
        campaignId,
      },
      include: {
        tester: {
          select: {
            id: true,
            username: true,
            testerProfile: true,
          },
        },
      },
    });
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
          game: true,
          build: true,
        },
      },
      tester: {
        select: {
          id: true,
          username: true,
          testerProfile: true,
        },
      },
    } satisfies Prisma.CampaignApplicationInclude;
  }
  private applicationForTesterInclude() {
    return {
      campaign: {
        include: {
          game: true,
          build: {
            select: {
              id: true,
              version: true,
              status: true,
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
    } satisfies Prisma.CampaignApplicationInclude;
  }
}
