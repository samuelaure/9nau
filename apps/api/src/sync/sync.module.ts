import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IntegrationsModule, PrismaModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
