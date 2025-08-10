import { Test, TestingModule } from '@nestjs/testing';
import { BlocksService } from './blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Block } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { FindBlocksQueryDto } from './dto/find-blocks-query.dto';

describe('BlocksService', () => {
  let service: BlocksService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockBlock: Block = {
    id: 'block-1',
    type: 'note',
    properties: { text: 'Test note' } as Prisma.JsonObject,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBlockDto: CreateBlockDto = {
      type: 'note',
      properties: { text: 'New note' },
    };

    it('should create a block with a default sortOrder if no siblings exist', async () => {
      prisma.block.findMany.mockResolvedValueOnce([]);
      prisma.block.create.mockResolvedValueOnce({
        ...mockBlock,
        properties: { text: 'New note', sortOrder: 1 } as Prisma.JsonObject,
      });

      const result = await service.create(createBlockDto);

      expect(prisma.block.create).toHaveBeenCalledWith({
        data: {
          type: 'note',
          properties: { text: 'New note', sortOrder: 1 },
        },
      });
      expect(result.properties).toEqual({ text: 'New note', sortOrder: 1 });
    });

    it('should create a block with an incremented sortOrder based on last sibling', async () => {
      const existingBlocks: Block[] = [
        {
          ...mockBlock,
          id: 'b1',
          properties: { sortOrder: 5 } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b2',
          properties: { sortOrder: 3 } as Prisma.JsonObject,
        },
      ];
      prisma.block.findMany.mockResolvedValueOnce(existingBlocks);
      prisma.block.create.mockResolvedValueOnce({
        ...mockBlock,
        properties: { text: 'New note', sortOrder: 6 } as Prisma.JsonObject,
      });

      const result = await service.create(createBlockDto);

      expect(prisma.block.create).toHaveBeenCalledWith({
        data: {
          type: 'note',
          properties: { text: 'New note', sortOrder: 6 },
        },
      });
      expect(result.properties).toEqual({ text: 'New note', sortOrder: 6 });
    });
  });

  describe('findAll', () => {
    it('should return all blocks filtered by type and excluding trash status', async () => {
      const blocks: Block[] = [
        {
          ...mockBlock,
          id: 'b1',
          type: 'action',
          properties: { status: 'inbox' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b2',
          type: 'note',
          properties: { status: 'inbox' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b3',
          type: 'action',
          properties: { status: 'trash' } as Prisma.JsonObject,
        },
      ];
      // Mock with the expected filtered array
      prisma.block.findMany.mockResolvedValueOnce([blocks[0]!]);

      const query: FindBlocksQueryDto = { type: 'action' };
      const result = await service.findAll(query);

      expect(prisma.block.findMany).toHaveBeenCalledWith({
        where: {
          type: 'action',
          properties: { path: ['status'], not: 'trash' },
        },
      });
      expect(result).toEqual([
        {
          ...mockBlock,
          id: 'b1',
          type: 'action',
          properties: { status: 'inbox' } as Prisma.JsonObject,
        },
      ]);
    });

    it('should filter by specific status', async () => {
      const blocks: Block[] = [
        {
          ...mockBlock,
          id: 'b1',
          type: 'action',
          properties: { status: 'inbox' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b2',
          type: 'note',
          properties: { status: 'inbox' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b3',
          type: 'action',
          properties: { status: 'completed' } as Prisma.JsonObject,
        },
      ];
      // Mock with the expected filtered array
      prisma.block.findMany.mockResolvedValueOnce([blocks[2]!]);
      const query: FindBlocksQueryDto = { status: 'completed' };
      const result = await service.findAll(query);
      expect(prisma.block.findMany).toHaveBeenCalledWith({
        where: {
          properties: { path: ['status'], equals: 'completed' },
        },
      });
      expect(result).toEqual([
        {
          ...mockBlock,
          id: 'b3',
          type: 'action',
          properties: { status: 'completed' } as Prisma.JsonObject,
        },
      ]);
    });

    it('should sort blocks correctly when dates are present', async () => {
      const blocks: Block[] = [
        {
          ...mockBlock,
          id: 'b1',
          properties: { date: '2025-08-05' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b2',
          properties: { date: '2025-08-07' } as Prisma.JsonObject,
        },
        {
          ...mockBlock,
          id: 'b3',
          properties: { date: '2025-08-06' } as Prisma.JsonObject,
        },
      ];
      // Mock with the unsorted array, as the service is responsible for sorting
      prisma.block.findMany.mockResolvedValueOnce(blocks);
      const result = await service.findAll({});
      expect(result.map((b) => b.id)).toEqual(['b2', 'b3', 'b1']);
    });
  });

  describe('update', () => {
    const updateBlockDto: UpdateBlockDto = {
      properties: { text: 'Updated note' },
    };

    it('should update a block successfully', async () => {
      prisma.block.findUnique.mockResolvedValueOnce(mockBlock);
      prisma.block.update.mockResolvedValueOnce({
        ...mockBlock,
        properties: { text: 'Updated note' } as Prisma.JsonObject,
      });

      const result = await service.update('block-1', updateBlockDto);

      expect(prisma.block.update).toHaveBeenCalledWith({
        where: { id: 'block-1' },
        data: { properties: { text: 'Updated note' } },
      });
      expect(result.properties).toEqual({ text: 'Updated note' });
    });

    it('should throw NotFoundException if block does not exist', async () => {
      prisma.block.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.update('non-existent-id', updateBlockDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update a block type', async () => {
      const dto: UpdateBlockDto = { type: 'action' };
      prisma.block.findUnique.mockResolvedValueOnce(mockBlock);
      prisma.block.update.mockResolvedValueOnce({
        ...mockBlock,
        type: 'action',
      });

      const result = await service.update('block-1', dto);

      expect(prisma.block.update).toHaveBeenCalledWith({
        where: { id: 'block-1' },
        data: { type: 'action' },
      });
      expect(result.type).toBe('action');
    });
  });

  describe('remove', () => {
    it('should remove a block successfully', async () => {
      prisma.block.findUnique.mockResolvedValueOnce(mockBlock);
      prisma.block.delete.mockResolvedValueOnce(mockBlock);
      const result = await service.remove('block-1');

      expect(prisma.block.delete).toHaveBeenCalledWith({
        where: { id: 'block-1' },
      });
      expect(result.id).toBe('block-1');
    });

    it('should throw NotFoundException if block does not exist', async () => {
      prisma.block.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
