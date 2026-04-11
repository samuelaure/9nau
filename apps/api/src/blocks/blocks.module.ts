import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * The NestJS module for the Blocks feature.
 * It encapsulates the controller and service, and imports any
 * necessary modules, like the PrismaModule to get access to the database.
 */
@Module({
  imports: [PrismaModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
