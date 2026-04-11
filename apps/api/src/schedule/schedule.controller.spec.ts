import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: ScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: ScheduleService,
          useValue: {
            upsert: jest.fn().mockResolvedValue({ id: 'sch-1' }),
            findOne: jest.fn().mockResolvedValue({ id: 'sch-1' }),
            remove: jest.fn().mockResolvedValue({ id: 'sch-1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.upsert', async () => {
    const date = new Date().toISOString();
    const dto = { blockId: 'b1', startDate: date as unknown as Date };
    await controller.upsert(dto);
    expect(service.upsert).toHaveBeenCalledWith(
      'b1',
      expect.any(Date),
      undefined,
      undefined,
    );
  });

  it('should call service.findOne', async () => {
    await controller.findOne('b1');
    expect(service.findOne).toHaveBeenCalledWith('b1');
  });

  it('should call service.remove', async () => {
    await controller.remove('sch-1');
    expect(service.remove).toHaveBeenCalledWith('sch-1');
  });
});
