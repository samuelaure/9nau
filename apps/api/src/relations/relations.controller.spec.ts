import { Test, TestingModule } from '@nestjs/testing';
import { RelationsController } from './relations.controller';
import { RelationsService } from './relations.service';

describe('RelationsController', () => {
  let controller: RelationsController;
  let service: RelationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelationsController],
      providers: [
        {
          provide: RelationsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'rel-1' }),
            remove: jest.fn().mockResolvedValue({ id: 'rel-1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<RelationsController>(RelationsController);
    service = module.get<RelationsService>(RelationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = { fromBlockId: 'b1', toBlockId: 'b2', type: 'link' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith('b1', 'b2', 'link', undefined);
  });

  it('should call service.remove', async () => {
    await controller.remove('rel-1');
    expect(service.remove).toHaveBeenCalledWith('rel-1');
  });
});
