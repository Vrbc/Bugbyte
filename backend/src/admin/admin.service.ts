import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  BuildStatus,
  CampaignStatus,
  GameStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { buildPaginatedResult } from 'src/common/paginate.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

  async getAllUsers(query: AdminUsersQueryDto) {
    const { page = 1, limit = 20, search, role } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      AND: [
        {
          OR: [
            { developerProfile: { isNot: null } },
            { testerProfile: { isNot: null } },
          ],
        },
        ...(search
          ? [
              {
                OR: [
                  {
                    username: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                  { email: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
      ...(role ? { role } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          developerProfile: { select: { id: true } },
          testerProfile: { select: { id: true, rating: true, level: true } },
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, page, limit);
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete admin users');
    }
    if (user.deletedAt) {
      throw new BadRequestException('User is already deleted');
    }

    if (user.role === UserRole.DEVELOPER) {
      await this.deactivateDeveloperResources(user.id);
    } else {
      await this.sessionsService.forceEndLiveSessionsForTester(user.id);
      await this.cancelPendingApplicationsForTester(user.id);
    }

    const suffix = `__deleted_${Date.now()}_${user.id}`;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        username: `${user.username}${suffix}`,
        email: `deleted${suffix}@deleted.local`,
        passwordHash: '',
      },
      select: { id: true },
    });
  }

  private async deactivateDeveloperResources(developerId: string): Promise<void> {
    const activeCampaigns = await this.prisma.playtestCampaign.findMany({
      where: {
        developerId,
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED] },
      },
      select: { id: true },
    });

    for (const campaign of activeCampaigns) {
      await this.sessionsService.forceEndLiveSessionsForCampaign(campaign.id);
    }

    await this.prisma.$transaction([
      this.prisma.campaignApplication.updateMany({
        where: {
          campaign: { developerId },
          status: {
            in: [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED],
          },
          testSession: { is: null },
        },
        data: { status: ApplicationStatus.CANCELLED },
      }),
      this.prisma.playtestCampaign.updateMany({
        where: {
          developerId,
          status: { not: CampaignStatus.ARCHIVED },
        },
        data: { status: CampaignStatus.ARCHIVED },
      }),
      this.prisma.gameBuild.updateMany({
        where: {
          game: { developerId },
          status: { not: BuildStatus.ARCHIVED },
        },
        data: { status: BuildStatus.ARCHIVED },
      }),
      this.prisma.game.updateMany({
        where: {
          developerId,
          status: { not: GameStatus.ARCHIVED },
        },
        data: { status: GameStatus.ARCHIVED },
      }),
    ]);
  }

  private async cancelPendingApplicationsForTester(
    testerId: string,
  ): Promise<void> {
    await this.prisma.campaignApplication.updateMany({
      where: {
        testerId,
        status: { in: [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED] },
        testSession: { is: null },
      },
      data: { status: ApplicationStatus.CANCELLED },
    });
  }
}
