import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { BuildStatus, Prisma } from '@prisma/client';
import { UpdateBuildDto } from './dto/update-build.dto';

@Injectable()
export class BuildsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBuildsForGame(user: CurrentUserPayload, gameId: string) {
    await this.ensureGameOwnership(user, gameId);

    return this.prisma.gameBuild.findMany({
      where: {
        gameId: gameId,
      },
    });
  }

  async createBuild(
    user: CurrentUserPayload,
    gameId: string,
    dto: CreateBuildDto,
  ) {
    await this.ensureGameOwnership(user, gameId);

    const buildExists = await this.prisma.gameBuild.findUnique({
      where: {
        gameId_version: {
          gameId: gameId,
          version: dto.version.trim(),
        },
      },
    });

    if (buildExists)
      throw new ConflictException(
        'Build with this version already exists for this game',
      );

    return this.prisma.gameBuild.create({
      data: {
        gameId,
        version: dto.version.trim(),
        buildUrl: dto.buildUrl.trim(),
        changelog: dto.changelog?.trim() ?? null,
        status: dto.status ?? BuildStatus.ACTIVE,
      },
    });
  }

  async updateBuild(user: CurrentUserPayload, id: string, dto: UpdateBuildDto) {
    const build = await this.ensureBuildOwnership(user, id);

    if (dto.version !== undefined) {
      const version = dto.version.trim();

      const buildExists = await this.prisma.gameBuild.findUnique({
        where: {
          gameId_version: {
            gameId: build.gameId,
            version,
          },
        },
      });

      if (buildExists && buildExists.id !== id)
        throw new ConflictException(
          'Build with this version already exists for this game',
        );
    }
    const data: Prisma.GameBuildUpdateInput = {};

    if (dto.version !== undefined) data.version = dto.version.trim();

    if (dto.buildUrl !== undefined) data.buildUrl = dto.buildUrl.trim();

    if (dto.status !== undefined) data.status = dto.status;

    if (dto.changelog !== undefined)
      data.changelog = dto.changelog.trim() || null;

    return this.prisma.gameBuild.update({
      where: {
        id,
      },
      data,
    });
  }

  async archiveBuild(user: CurrentUserPayload, id: string) {
    await this.ensureBuildOwnership(user, id);

    return this.prisma.gameBuild.update({
      where: {
        id: id,
      },
      data: {
        status: BuildStatus.ARCHIVED,
      },
    });
  }

  async ensureGameOwnership(user: CurrentUserPayload, gameId: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        id: gameId,
        developerId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!game) throw new NotFoundException('Game not found.');

    return game;
  }

  async ensureBuildOwnership(user: CurrentUserPayload, id: string) {
    const build = await this.prisma.gameBuild.findFirst({
      where: {
        id,
        game: {
          developerId: user.id,
        },
      },
      select: {
        id: true,
        gameId: true,
        version: true,
      },
    });

    if (!build) throw new NotFoundException('Build not found.');

    return build;
  }
}
