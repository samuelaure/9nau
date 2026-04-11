import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(
    blockId: string,
    type: string,
    metadata: Record<string, unknown> = {},
  ) {
    return this.prisma.event.create({
      data: {
        blockId,
        type,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  findByBlock(blockId: string) {
    return this.prisma.event.findMany({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
