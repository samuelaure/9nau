import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { Block } from '@prisma/client';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { FindBlocksQueryDto } from './dto/find-blocks-query.dto';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: BlocksService;

  const mockBlock: Block = {
    id: 'block-1',
    type: 'note',
    properties: { text: 'Test note' },
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findOne: jest.fn(),
            getRemindableBlocks: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(BlocksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call blocksService.create with the correct DTO', async () => {
      const createDto: CreateBlockDto = { type: 'note', properties: {} };
      jest.spyOn(service, 'create').mockResolvedValue(mockBlock);
      await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should call blocksService.findAll with the correct query', async () => {
      const queryDto: FindBlocksQueryDto = { type: 'note' };
      jest.spyOn(service, 'findAll').mockResolvedValue([mockBlock]);
      await controller.findAll(queryDto);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('update', () => {
    it('should call blocksService.update with the correct ID and DTO', async () => {
      const updateDto: UpdateBlockDto = { properties: { text: 'updated' } };
      jest.spyOn(service, 'update').mockResolvedValue(mockBlock);
      await controller.update('block-1', updateDto);
      expect(service.update).toHaveBeenCalledWith('block-1', updateDto);
    });
  });

  describe('remove', () => {
    it('should call blocksService.remove with the correct ID', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockBlock);
      await controller.remove('block-1');
      expect(service.remove).toHaveBeenCalledWith('block-1');
    });
  });

  describe('findOne', () => {
    it('should call blocksService.findOne with the correct ID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBlock);
      await controller.findOne('block-1');
      expect(service.findOne).toHaveBeenCalledWith('block-1');
    });
  });

  describe('getRemindableBlocks', () => {
    it('should call blocksService.getRemindableBlocks', async () => {
      jest.spyOn(service, 'getRemindableBlocks').mockResolvedValue([mockBlock]);
      await controller.getRemindableBlocks();
      expect(service.getRemindableBlocks).toHaveBeenCalled();
    });
  });
});
