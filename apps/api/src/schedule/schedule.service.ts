import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  upsert(blockId: string, startDate: Date, endDate?: Date, rrule?: string) {
    return this.prisma.schedule.upsert({
      where: { blockId },
      create: { blockId, startDate, endDate, rrule },
      update: { startDate, endDate, rrule }
    });
  }

  findOne(blockId: string) {
    return this.prisma.schedule.findUnique({ where: { blockId } });
  }

  remove(id: string) {
    return this.prisma.schedule.delete({ where: { id } });
  }
}
