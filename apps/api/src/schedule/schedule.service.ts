import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertScheduleDto } from './dto/upsert-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async upsert(dto: UpsertScheduleDto) {
    const { blockId, ...data } = dto;

    // Ensure the block exists before creating/updating a schedule for it
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
    });
    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found.`);
    }

    return this.prisma.schedule.upsert({
      where: { blockId },
      update: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      create: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        block: {
          connect: { id: blockId },
        },
      },
    });
  }

  async findByBlockId(blockId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { blockId },
    });
    if (!schedule) {
      throw new NotFoundException(
        `Schedule for block ID ${blockId} not found.`,
      );
    }
    return schedule;
  }

  async remove(id: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found.`);
    }
    return this.prisma.schedule.delete({ where: { id } });
  }
}
