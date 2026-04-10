import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Event } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an event', async () => {
    prisma.event.create.mockResolvedValueOnce({ id: 'e1', blockId: 'b1', type: 'done', metadata: {}, createdAt: new Date() } as Event);
    await service.create('b1', 'done');
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: { blockId: 'b1', type: 'done', metadata: {} },
    });
  });

  it('should find events by block', async () => {
    prisma.event.findMany.mockResolvedValueOnce([]);
    await service.findByBlock('b1');
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { blockId: 'b1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
