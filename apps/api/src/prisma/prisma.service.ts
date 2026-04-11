import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Disconnecting Prisma (signal: ${signal})`);
    await this.$disconnect();
  }
}
