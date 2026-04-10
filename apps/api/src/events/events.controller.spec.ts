import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'e1' }),
            findByBlock: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = { blockId: 'b1', type: 'done' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith('b1', 'done', undefined);
  });

  it('should call service.findByBlock', async () => {
    await controller.findByBlock('b1');
    expect(service.findByBlock).toHaveBeenCalledWith('b1');
  });
});
