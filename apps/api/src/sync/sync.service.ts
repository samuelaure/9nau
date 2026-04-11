import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private prisma: PrismaService) {}

  async push(blocks: Record<string, unknown>[]) {
    this.logger.log(`Sync PUSH: processing ${blocks.length} blocks`);
    const results = [];

    for (const blockData of blocks) {
      const {
        uuid,
        type,
        properties,
        updatedAt,
        deletedAt,
        source,
        sourceRef,
      } = blockData as {
        uuid: string;
        type: string;
        properties: Record<string, unknown>;
        updatedAt: string;
        deletedAt?: string | null;
        source?: string;
        sourceRef?: string;
      };

      try {
        const upserted = await this.prisma.block.upsert({
          where: { uuid },
          update: {
            properties: properties as Prisma.InputJsonValue,
            updatedAt: new Date(updatedAt),
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            source,
            sourceRef,
          },
          create: {
            uuid,
            type,
            properties: properties as Prisma.InputJsonValue,
            updatedAt: new Date(updatedAt),
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            source,
            sourceRef,
          },
        });
        results.push({ uuid: upserted.uuid, status: 'synced' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to upsert block ${uuid}: ${message}`);
        results.push({ uuid, status: 'error', message });
      }
    }

    return results;
  }

  async pull(lastSyncedAt: string) {
    const since = new Date(lastSyncedAt);
    this.logger.log(`Sync PULL: fetching changes since ${since.toISOString()}`);

    const blocks = await this.prisma.block.findMany({
      where: {
        updatedAt: {
          gt: since,
        },
      },
      include: {
        schedule: true,
        events: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      blocks,
      serverTime: new Date().toISOString(),
    };
  }
}
