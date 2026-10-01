import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const softDeleteExtension = {
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ args, query }: { args: any; query: any }) {
        if (args.where === undefined) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async findUnique({ args, query }: { args: any; query: any }) {
        if (args.where === undefined) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async findFirst({ args, query }: { args: any; query: any }) {
        if (args.where === undefined) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async findFirstOrThrow({ args, query }: { args: any; query: any }) {
        if (args.where === undefined) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
      async count({ args, query }: { args: any; query: any }) {
        if (args.where === undefined) args.where = {};
        if (args.where.deletedAt === undefined) {
          args.where.deletedAt = null;
        }
        return query(args);
      },
    },
  },
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    // Apply soft-delete filter globally via $extends
    return this.$extends(softDeleteExtension) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
