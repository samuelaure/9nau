import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RelationsService {
  constructor(private prisma: PrismaService) {}

  create(fromBlockId: string, toBlockId: string, type: string, properties: Record<string, unknown> = {}) {
    return this.prisma.relation.create({
      data: {
        fromBlockId,
        toBlockId,
        type,
        properties: properties as Prisma.InputJsonValue
      }
    });
  }

  remove(id: string) {
    return this.prisma.relation.delete({ where: { id } });
  }
}
