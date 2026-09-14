import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignStatus,
  FeedbackSeverity,
  FeedbackType,
  Prisma,
  SessionStatus,
} from '@prisma/client';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PublicCampaignsQueryDto } from './dto/public-campaigns-query.dto';
import { buildPaginatedResult } from 'src/common/paginate.util';

export interface CampaignTimelineResult {
  bucketSeconds: number;
  buckets: Array<{
    bucketStart: number;
    feedbackCount: number;
    byType: Partial<Record<FeedbackType, number>>;
    bySeverity: Partial<Record<FeedbackSeverity, number>>;
    byTypeTesterCount: Partial<Record<FeedbackType, number>>;
    activeTesterCount: number;
  }>;
  summary: {
    testersReporting: number;
    sessionsTotal: number;
    sessionsCompleted: number;
    avgFunRating: number | null;
    avgDifficultyRating: number | null;
    avgClarityRating: number | null;
    avgDurationSeconds: number | null;
    totalFeedbackCount: number;
  };
}

const TIMELINE_BUCKET_COUNT = 20;
const MIN_BUCKET_SECONDS = 30;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyCampaigns(user: CurrentUserPayload, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.PlaytestCampaignWhereInput = {
      developerId: user.id,
    };

    const [items, total] = await Promise.all([
      this.prisma.playtestCampaign.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.campaignInclude(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.playtestCampaign.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
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

  async getCampaignTimeline(
    user: CurrentUserPayload,
    id: string,
  ): Promise<CampaignTimelineResult> {
    await this.ensureCampaignOwnership(user, id);

    const [feedbackBytes, sessions, testerGroups, sessionsTotal, sessionStats] =
      await Promise.all([
        this.prisma.feedbackByte.findMany({
          where: { session: { campaignId: id } },
          select: {
            timestampSeconds: true,
            type: true,
            severity: true,
            testerId: true,
          },
        }),
        this.prisma.testSession.findMany({
          where: { campaignId: id },
          select: { startedAt: true, durationSeconds: true },
        }),
        this.prisma.feedbackByte.groupBy({
          by: ['testerId'],
          where: { session: { campaignId: id } },
        }),
        this.prisma.testSession.count({ where: { campaignId: id } }),
        this.prisma.testSession.aggregate({
          where: { campaignId: id, status: SessionStatus.COMPLETED },
          _avg: {
            finalFunRating: true,
            finalDifficultyRating: true,
            finalClarityRating: true,
            durationSeconds: true,
          },
          _count: true,
        }),
      ]);

    const now = Date.now();

    const maxFeedbackTimestamp = feedbackBytes.reduce(
      (max, byte) => Math.max(max, byte.timestampSeconds),
      0,
    );
    const maxCompletedDuration = sessions.reduce(
      (max, session) => Math.max(max, session.durationSeconds ?? 0),
      0,
    );
    const maxTimestampSeconds = Math.max(
      maxFeedbackTimestamp,
      maxCompletedDuration,
    );

    const elapsedSecondsBySession = sessions.map((session) => {
      if (session.durationSeconds != null) {
        return session.durationSeconds;
      }

      const wallClockElapsed = Math.max(
        0,
        Math.floor((now - session.startedAt.getTime()) / 1000),
      );
      return Math.min(wallClockElapsed, maxTimestampSeconds);
    });

    const bucketSeconds = Math.max(
      MIN_BUCKET_SECONDS,
      Math.ceil((maxTimestampSeconds + 1) / TIMELINE_BUCKET_COUNT),
    );
    const bucketCount =
      sessions.length === 0 && feedbackBytes.length === 0
        ? 0
        : Math.ceil((maxTimestampSeconds + 1) / bucketSeconds);

    type TimelineBucket = CampaignTimelineResult['buckets'][number];

    const buckets: TimelineBucket[] = Array.from(
      { length: bucketCount },
      (_, index): TimelineBucket => {
        const bucketStart = index * bucketSeconds;
        return {
          bucketStart,
          feedbackCount: 0,
          byType: {},
          bySeverity: {},
          byTypeTesterCount: {},
          activeTesterCount: elapsedSecondsBySession.filter(
            (elapsed) => elapsed >= bucketStart,
          ).length,
        };
      },
    );

    const testersByBucketAndType = new Map<
      number,
      Map<FeedbackType, Set<string>>
    >();

    for (const byte of feedbackBytes) {
      const bucketIndex = Math.min(
        bucketCount - 1,
        Math.floor(byte.timestampSeconds / bucketSeconds),
      );
      const bucket = buckets[bucketIndex];

      bucket.feedbackCount += 1;
      bucket.byType[byte.type] = (bucket.byType[byte.type] ?? 0) + 1;
      if (byte.severity) {
        bucket.bySeverity[byte.severity] =
          (bucket.bySeverity[byte.severity] ?? 0) + 1;
      }

      let typesForBucket = testersByBucketAndType.get(bucketIndex);
      if (!typesForBucket) {
        typesForBucket = new Map();
        testersByBucketAndType.set(bucketIndex, typesForBucket);
      }

      let testersForType = typesForBucket.get(byte.type);
      if (!testersForType) {
        testersForType = new Set();
        typesForBucket.set(byte.type, testersForType);
      }

      testersForType.add(byte.testerId);
    }

    for (const [bucketIndex, typesForBucket] of testersByBucketAndType) {
      for (const [type, testers] of typesForBucket) {
        buckets[bucketIndex].byTypeTesterCount[type] = testers.size;
      }
    }

    return {
      bucketSeconds,
      buckets,
      summary: {
        testersReporting: testerGroups.length,
        sessionsTotal,
        sessionsCompleted: sessionStats._count,
        avgFunRating: sessionStats._avg.finalFunRating,
        avgDifficultyRating: sessionStats._avg.finalDifficultyRating,
        avgClarityRating: sessionStats._avg.finalClarityRating,
        avgDurationSeconds: sessionStats._avg.durationSeconds,
        totalFeedbackCount: feedbackBytes.length,
      },
    };
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

    if (
      (dto.gameId !== undefined ||
        dto.buildId !== undefined ||
        dto.minTesterRating !== undefined) &&
      campaign.status !== CampaignStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Game, build and minimum tester rating can only be changed while the campaign is a draft.',
      );
    }

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

  async publishCampaign(user: CurrentUserPayload, id: string) {
    const campaign = await this.ensureCampaignOwnership(user, id);
    this.assertTransition(campaign.status, [CampaignStatus.DRAFT], 'publish');

    return this.prisma.playtestCampaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
      include: this.campaignInclude(),
    });
  }

  async pauseCampaign(user: CurrentUserPayload, id: string) {
    const campaign = await this.ensureCampaignOwnership(user, id);
    this.assertTransition(campaign.status, [CampaignStatus.ACTIVE], 'pause');

    return this.prisma.playtestCampaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
      include: this.campaignInclude(),
    });
  }

  async resumeCampaign(user: CurrentUserPayload, id: string) {
    const campaign = await this.ensureCampaignOwnership(user, id);
    this.assertTransition(campaign.status, [CampaignStatus.PAUSED], 'resume');

    return this.prisma.playtestCampaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
      include: this.campaignInclude(),
    });
  }

  async archiveCampaign(user: CurrentUserPayload, id: string) {
    const campaign = await this.ensureCampaignOwnership(user, id);
    this.assertTransition(
      campaign.status,
      [CampaignStatus.DRAFT, CampaignStatus.COMPLETED],
      'archive',
    );

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
        status: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private assertTransition(
    current: CampaignStatus,
    allowed: CampaignStatus[],
    action: string,
  ) {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Cannot ${action} a campaign that is ${current}.`,
      );
    }
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
      _count: {
        select: {
          applications: true,
          sessions: true,
        },
      },
    } satisfies Prisma.PlaytestCampaignInclude;
  }

  // Public / Tester

  async findPublicCampaigns(query: PublicCampaignsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.PlaytestCampaignWhereInput = {
      status: CampaignStatus.ACTIVE,
      ...(query.platform ? { requiredPlatforms: { has: query.platform } } : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: 'insensitive' },
              },
              {
                game: {
                  title: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                game: {
                  genre: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.playtestCampaign.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.publicCampaignListSelect(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.playtestCampaign.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findPublicCampaign(id: string) {
    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: {
        id,
        status: CampaignStatus.ACTIVE,
      },
      select: this.publicCampaignDetailsSelect(),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private publicCampaignListSelect() {
    return {
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
    } satisfies Prisma.PlaytestCampaignSelect;
  }

  private publicCampaignDetailsSelect() {
    return {
      id: true,
      title: true,
      type: true,
      description: true,
      instructions: true,
      requiredTesters: true,
      requiredPlatforms: true,
      estimatedMinutes: true,
      minTesterRating: true,
      createdAt: true,

      game: {
        select: {
          id: true,
          title: true,
          description: true,
          genre: true,
          platforms: true,
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
          sessions: true,
        },
      },
    } satisfies Prisma.PlaytestCampaignSelect;
  }
}
