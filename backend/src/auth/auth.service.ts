import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExperienceLevel, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeUser = Pick<
  User,
  'id' | 'username' | 'email' | 'role' | 'isActive' | 'createdAt'
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    if (dto.role === UserRole.DEVELOPER && !dto.studioName?.trim()) {
      throw new BadRequestException('Studio name is required for developers.');
    }

    if (dto.role === UserRole.TESTER) {
      if (!dto.platforms?.length) {
        throw new BadRequestException('Platforms are required for testers.');
      }

      if (!dto.favoriteGenres?.length) {
        throw new BadRequestException(
          'Favorite genres are required for testers.',
        );
      }

      if (!dto.experienceLevel) {
        throw new BadRequestException(
          'Experience level is required for testers.',
        );
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: dto.role,
        },
      });

      if (dto.role === UserRole.DEVELOPER) {
        await tx.developerProfile.create({
          data: {
            userId: createdUser.id,
            studioName: dto.studioName!.trim(),
            bio: dto.bio?.trim(),
            websiteUrl: dto.websiteUrl?.trim(),
          },
        });
      }

      if (dto.role === UserRole.TESTER) {
        await tx.testerProfile.create({
          data: {
            userId: createdUser.id,
            platforms: dto.platforms ?? [],
            favoriteGenres: dto.favoriteGenres ?? [],
            experienceLevel: dto.experienceLevel ?? ExperienceLevel.BEGINNER,
          },
        });
      }

      return createdUser;
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const safeUser = this.toSafeUser(user);

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: safeUser,
    };
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
