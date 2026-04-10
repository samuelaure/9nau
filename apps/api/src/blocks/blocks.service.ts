import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { FindBlocksQueryDto } from './dto/find-blocks-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async create(createBlockDto: CreateBlockDto) {
    const { parentId, type, properties } = createBlockDto;

    let sortOrder = 1;

    const siblings = await this.prisma.block.findMany({
      where: { parentId: parentId ?? null, type },
    });

    const lastSibling = siblings.sort((a, b) => {
      const sortOrderA =
        ((a.properties as Prisma.JsonObject)?.sortOrder as number) || 0;
      const sortOrderB =
        ((b.properties as Prisma.JsonObject)?.sortOrder as number) || 0;
      return sortOrderB - sortOrderA;
    })[0];

    if (
      lastSibling &&
      lastSibling.properties !== null &&
      typeof (lastSibling.properties as Prisma.JsonObject).sortOrder ===
        'number'
    ) {
      sortOrder =
        ((lastSibling.properties as Prisma.JsonObject).sortOrder as number) + 1;
    }

    const data: Prisma.BlockCreateInput = {
      type,
      properties: {
        ...((properties as Prisma.JsonObject) || {}),
        sortOrder,
      },
      ...(parentId && {
        parent: {
          connect: {
            id: parentId,
          },
        },
      }),
    };

    return this.prisma.block.create({
      data,
    });
  }

  async findAll(query: FindBlocksQueryDto) {
    const { type, status } = query;
    const where: Prisma.BlockWhereInput = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.properties = {
        path: ['status'],
        equals: status,
      };
    } else {
      where.properties = {
        path: ['status'],
        not: 'trash',
      };
    }

    const blocks = await this.prisma.block.findMany({
      where,
    });

    return blocks.sort((a, b) => {
      const dateA = (a.properties as Prisma.JsonObject)?.date as string;
      const dateB = (b.properties as Prisma.JsonObject)?.date as string;
      const sortOrderA =
        ((a.properties as Prisma.JsonObject)?.sortOrder as number) || 0;
      const sortOrderB =
        ((b.properties as Prisma.JsonObject)?.sortOrder as number) || 0;

      if (dateA && dateB) {
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
      }

      return sortOrderA - sortOrderB;
    });
  }

  async update(id: string, updateBlockDto: UpdateBlockDto) {
    const { type, properties, parentId } = updateBlockDto;

    const block = await this.prisma.block.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException(`Block with ID ${id} not found`);
    }

    const data: Prisma.BlockUpdateInput = {};

    if (type) {
      data.type = type;
    }

    if (properties) {
      const currentProperties = (block.properties as Prisma.JsonObject) || {};
      data.properties = {
        ...currentProperties,
        ...(properties as Prisma.InputJsonObject),
      };
    }

    if (parentId !== undefined) {
      data.parent =
        parentId === null
          ? { disconnect: true }
          : { connect: { id: parentId } };
    }

    return this.prisma.block.update({
      where: { id },
      data,
    });
  }

  async findOne(id: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        children: true,
        relationsFrom: true,
        relationsTo: true,
        schedule: true,
      },
    });
    if (!block || block.deletedAt) {
      throw new NotFoundException(`Block with ID ${id} not found`);
    }
    return block;
  }

  async getRemindableBlocks() {
    return this.prisma.block.findMany({
      where: {
        deletedAt: null,
        schedule: {
          isNot: null,
        },
      },
      include: { schedule: true },
    });
  }

  async remove(id: string) {
    const block = await this.prisma.block.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException(`Block with ID ${id} not found`);
    }
    return this.prisma.block.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
