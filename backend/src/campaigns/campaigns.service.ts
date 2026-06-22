import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyCampaigns(user: CurrentUserPayload) {
    return await this.prisma.playtestCampaign.findMany({
      where: {
        developerId: user.id,
      },
      include: this.campaignInclude(),
    });
  }

  async findOneCampaign(user: CurrentUserPayload, id: string) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        developerId: user.id,
        id,
      },
      include: {
        ...this.campaignInclude(),
        applications: {
          include: {
            tester: {
              select: {
                id: true,
                username: true,
                email: true,
                testerProfile: true,
              },
            },
          },
        },
        sessions: {
          include: {
            tester: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            _count: {
              select: {
                feedbackBytes: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async createCampaign(user: CurrentUserPayload, dto: CreateCampaignDto) {
    const requiredPlatforms = dto.requiredPlatforms
      .map((val) => val.trim())
      .filter(Boolean);

    if (requiredPlatforms.length === 0) {
      throw new BadRequestException(
        'At least one required platform is needed.',
      );
    }

    await this.ensureGameAndBuildOwnership(user, dto.gameId, dto.buildId);

    return this.prisma.playtestCampaign.create({
      data: {
        developerId: user.id,
        gameId: dto.gameId,
        buildId: dto.buildId,
        title: dto.title.trim(),
        type: dto.type,
        description: dto.description?.trim() || null,
        instructions: dto.instructions.trim(),
        requiredTesters: dto.requiredTesters,
        minTesterRating: dto.minTesterRating,
        requiredPlatforms,
        estimatedMinutes: dto.estimatedMinutes,
        status: dto.status ?? CampaignStatus.DRAFT,
      },
      include: this.campaignInclude(),
    });
  }

  async updateCampaign(
    user: CurrentUserPayload,
    id: string,
    dto: UpdateCampaignDto,
  ) {
    const campaign = await this.ensureCampaignOwnership(user, id);

    const nextGameId = dto.gameId ?? campaign.gameId;
    const nextBuildId = dto.buildId ?? campaign.buildId;

    if (dto.gameId !== undefined || dto.buildId !== undefined) {
      await this.ensureGameAndBuildOwnership(user, nextGameId, nextBuildId);
    }
    const data: Prisma.PlaytestCampaignUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (dto.instructions !== undefined) {
      data.instructions = dto.instructions.trim();
    }

    if (dto.requiredTesters !== undefined) {
      data.requiredTesters = dto.requiredTesters;
    }

    if (dto.minTesterRating !== undefined) {
      data.minTesterRating = dto.minTesterRating;
    }

    if (dto.requiredPlatforms !== undefined) {
      const requiredPlatforms = dto.requiredPlatforms
        .map((val) => val.trim())
        .filter(Boolean);

      if (requiredPlatforms.length === 0) {
        throw new BadRequestException(
          'At least one required platform is needed.',
        );
      }

      data.requiredPlatforms = {
        set: requiredPlatforms,
      };
    }

    if (dto.estimatedMinutes !== undefined) {
      data.estimatedMinutes = dto.estimatedMinutes;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.gameId !== undefined) {
      data.game = {
        connect: {
          id: dto.gameId,
        },
      };
    }

    if (dto.buildId !== undefined) {
      data.build = {
        connect: {
          id: dto.buildId,
        },
      };
    }

    return this.prisma.playtestCampaign.update({
      where: {
        id,
      },
      data,
      include: this.campaignInclude(),
    });
  }

  async archiveCampaign(user: CurrentUserPayload, id: string) {
    await this.ensureCampaignOwnership(user, id);

    return this.prisma.playtestCampaign.update({
      where: {
        id,
      },
      data: {
        status: CampaignStatus.ARCHIVED,
      },
      include: this.campaignInclude(),
    });
  }

  private async ensureCampaignOwnership(user: CurrentUserPayload, id: string) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        id,
        developerId: user.id,
      },
      select: {
        id: true,
        gameId: true,
        buildId: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Game build not found');
    }

    return campaign;
  }

  private async ensureGameAndBuildOwnership(
    user: CurrentUserPayload,
    gameId: string,
    buildId: string,
  ) {
    const build = await this.prisma.gameBuild.findFirst({
      where: {
        id: buildId,
        gameId,
        game: {
          developerId: user.id,
        },
      },
      select: {
        id: true,
        gameId: true,
        status: true,
        game: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!build) {
      throw new NotFoundException('Game or build not found');
    }

    return build;
  }

  private campaignInclude() {
    return {
      game: true,
      build: true,
      _count: {
        select: {
          applications: true,
          sessions: true,
        },
      },
    } satisfies Prisma.PlaytestCampaignInclude;
  }

  // Public / Tester

  async findPublicCampaigns() {
    return this.prisma.playtestCampaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
      },
      include: this.publicCampaignsInclude(),
    });
  }

  async findPublicCampaign(id: string) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        id,
        status: CampaignStatus.ACTIVE,
      },
      include: this.publicCampaignsInclude(),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private publicCampaignsInclude() {
    return {
      game: true,
      build: true,
      developer: {
        select: {
          id: true,
          username: true,
          developerProfile: true,
        },
      },
      _count: {
        select: {
          applications: true,
          sessions: true,
        },
      },
    } satisfies Prisma.PlaytestCampaignInclude;
  }
}
