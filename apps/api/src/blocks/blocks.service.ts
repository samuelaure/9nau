import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  create(createBlockDto: CreateBlockDto) {
    const { parentId, type, properties } = createBlockDto;

    const data: Prisma.BlockCreateInput = {
      type,
      properties: properties as Prisma.InputJsonValue,
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
}
