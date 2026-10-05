import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAccount(user: CurrentUserPayload) {
    const account = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        developerProfile: {
          select: { studioName: true, bio: true, websiteUrl: true },
        },
        testerProfile: {
          select: {
            platforms: true,
            favoriteGenres: true,
            experienceLevel: true,
            rating: true,
            reputationPoints: true,
            level: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    return account;
  }

  async updateMyAccount(user: CurrentUserPayload, dto: UpdateAccountDto) {
    if (user.role === UserRole.DEVELOPER) {
      this.ensureDeveloperFields(dto);

      await this.prisma.developerProfile.update({
        where: { userId: user.id },
        data: {
          ...(dto.studioName !== undefined
            ? { studioName: dto.studioName.trim() }
            : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio.trim() || null } : {}),
          ...(dto.websiteUrl !== undefined
            ? { websiteUrl: dto.websiteUrl.trim() || null }
            : {}),
        },
      });
    }

    if (user.role === UserRole.TESTER) {
      this.ensureTesterFields(dto);

      await this.prisma.testerProfile.update({
        where: { userId: user.id },
        data: {
          ...(dto.platforms !== undefined
            ? { platforms: { set: this.normalizeValues(dto.platforms) } }
            : {}),
          ...(dto.favoriteGenres !== undefined
            ? {
                favoriteGenres: {
                  set: this.normalizeValues(dto.favoriteGenres),
                },
              }
            : {}),
        },
      });
    }

    return this.getMyAccount(user);
  }

  private ensureDeveloperFields(dto: UpdateAccountDto): void {
    if (dto.platforms !== undefined || dto.favoriteGenres !== undefined) {
      throw new BadRequestException(
        'Tester profile fields are not available to developers.',
      );
    }

    if (
      dto.studioName === undefined &&
      dto.bio === undefined &&
      dto.websiteUrl === undefined
    ) {
      throw new BadRequestException(
        'Provide at least one profile field to update.',
      );
    }

    if (dto.studioName !== undefined && !dto.studioName.trim()) {
      throw new BadRequestException('Studio name is required for developers.');
    }
  }

  private ensureTesterFields(dto: UpdateAccountDto): void {
    if (
      dto.studioName !== undefined ||
      dto.bio !== undefined ||
      dto.websiteUrl !== undefined
    ) {
      throw new BadRequestException(
        'Developer profile fields are not available to testers.',
      );
    }

    if (dto.platforms === undefined && dto.favoriteGenres === undefined) {
      throw new BadRequestException(
        'Provide at least one profile field to update.',
      );
    }
  }

  private normalizeValues(values: string[]): string[] {
    const normalized = [
      ...new Set(values.map((value) => value.trim()).filter(Boolean)),
    ];

    if (normalized.length === 0) {
      throw new BadRequestException('At least one value is required.');
    }

    return normalized;
  }
}
