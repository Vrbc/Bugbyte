import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getApiHealth() {
    return {
      status: 'ok',
      app: 'Bugbyte API',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
