import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Schedule } from '@prisma/client';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert a schedule', async () => {
    const date = new Date();
    prisma.schedule.upsert.mockResolvedValueOnce({
      id: 'sch-1',
      blockId: 'b1',
      startDate: date,
      endDate: null,
      rrule: null,
      completedAt: null,
      createdAt: date,
      updatedAt: date,
    } as Schedule);

    await service.upsert('b1', date);

    expect(prisma.schedule.upsert).toHaveBeenCalledWith({
      where: { blockId: 'b1' },
      create: {
        blockId: 'b1',
        startDate: date,
        endDate: undefined,
        rrule: undefined,
      },
      update: { startDate: date, endDate: undefined, rrule: undefined },
    });
  });

  it('should find a schedule', async () => {
    prisma.schedule.findUnique.mockResolvedValueOnce({
      id: 'sch-1',
    } as unknown as Schedule);
    await service.findOne('b1');
    expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
      where: { blockId: 'b1' },
    });
  });

  it('should remove a schedule', async () => {
    prisma.schedule.delete.mockResolvedValueOnce({
      id: 'sch-1',
    } as unknown as Schedule);
    await service.remove('sch-1');
    expect(prisma.schedule.delete).toHaveBeenCalledWith({
      where: { id: 'sch-1' },
    });
  });
});
