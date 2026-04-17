import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FlownauIntegrationService } from '../integrations/flownau.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flownauService: FlownauIntegrationService,
  ) {}

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

        // Forward manually-synced content_idea blocks to Flownau
        if (type === 'content_idea') {
          const brandId = (properties as Record<string, unknown>).brandId as string | undefined;
          const text = (properties as Record<string, unknown>).text as string | undefined;
          if (brandId && text) {
            try {
              await this.flownauService.ingestIdeas(brandId, [
                { text, sourceRef: upserted.id },
              ]);
              await this.prisma.block.update({
                where: { id: upserted.id },
                data: {
                  properties: {
                    ...(upserted.properties as Record<string, unknown>),
                    flownauSyncStatus: 'success',
                  } as Prisma.InputJsonValue,
                },
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              this.logger.error(
                `[Flownau-Integration-Error] Failed to forward synced block ${upserted.id}: ${msg}`,
              );
              await this.prisma.block.update({
                where: { id: upserted.id },
                data: {
                  properties: {
                    ...(upserted.properties as Record<string, unknown>),
                    flownauSyncStatus: 'error',
                  } as Prisma.InputJsonValue,
                },
              });
            }
          }
        }
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
