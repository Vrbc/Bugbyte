import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult } from 'src/common/paginate.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(query: AdminUsersQueryDto) {
    const { page = 1, limit = 20, search, role } = query;

    const where: Prisma.UserWhereInput = {
      OR: [
        { developerProfile: { isNot: null } },
        { testerProfile: { isNot: null } },
      ],
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
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
      select: { id: true, email: true, deletedAt: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.deletedAt) {
      throw new BadRequestException('User already deleted');
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin users');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, deletedAt: true },
    });
  }
}
