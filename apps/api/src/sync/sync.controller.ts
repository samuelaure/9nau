import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@Controller('sync')
@UseGuards(ServiceAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() body: { blocks: any[] }) {
    return this.syncService.push(body.blocks);
  }

  @Get('pull')
  async pull(@Query('lastSyncedAt') lastSyncedAt: string) {
    return this.syncService.pull(lastSyncedAt || new Date(0).toISOString());
  }
}
