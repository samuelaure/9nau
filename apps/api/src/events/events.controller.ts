import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: { blockId: string; type: string; metadata?: Record<string, unknown> }) {
    return this.eventsService.create(dto.blockId, dto.type, dto.metadata);
  }

  @Get('block/:blockId')
  findByBlock(@Param('blockId') blockId: string) {
    return this.eventsService.findByBlock(blockId);
  }
}
