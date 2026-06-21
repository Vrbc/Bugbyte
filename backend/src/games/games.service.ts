import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameStatus, Prisma } from '@prisma/client';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async createGame(user: CurrentUserPayload, dto: CreateGameDto) {
    const platforms = dto.platforms
      .map((value) => value.trim())
      .filter(Boolean);

    return this.prisma.game.create({
      data: {
        developerId: user.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        genre: dto.genre.trim(),
        platforms,
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        status: dto.status ?? GameStatus.DRAFT,
      },
    });
  }

  async findMyGames(user: CurrentUserPayload) {
    return this.prisma.game.findMany({
      where: {
        developerId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            builds: true,
            campaigns: true,
          },
        },
      },
    });
  }

  async findOneGame(user: CurrentUserPayload, id: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        id,
        developerId: user.id,
      },
      include: {
        builds: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        campaigns: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            build: true,
          },
        },
        _count: {
          select: {
            builds: true,
            campaigns: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found.');
    }

    return game;
  }

  async updateGame(user: CurrentUserPayload, id: string, dto: UpdateGameDto) {
    await this.ensureGameOwnership(user, id);

    const data: Prisma.GameUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    if (dto.genre !== undefined) {
      data.genre = dto.genre.trim();
    }

    if (dto.platforms !== undefined) {
      const platforms = dto.platforms
        .map((value) => value.trim())
        .filter(Boolean);

      if (platforms.length === 0) {
        throw new BadRequestException('At least one platform is required.');
      }

      data.platforms = {
        set: platforms,
      };
    }
    if (dto.coverImageUrl !== undefined) {
      data.coverImageUrl = dto.coverImageUrl.trim() || null;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    return this.prisma.game.update({
      where: {
        id,
      },
      data,
      include: {
        _count: {
          select: {
            builds: true,
            campaigns: true,
          },
        },
      },
    });
  }

  async archiveGame(user: CurrentUserPayload, id: string) {
    await this.ensureGameOwnership(user, id);

    return this.prisma.game.update({
      where: {
        id,
      },
      data: {
        status: GameStatus.ARCHIVED,
      },
      include: {
        _count: {
          select: {
            builds: true,
            campaigns: true,
          },
        },
      },
    });
  }

  private async ensureGameOwnership(user: CurrentUserPayload, id: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        id,
        developerId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found.');
    }

    return game;
  }
}
