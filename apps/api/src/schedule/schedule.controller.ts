import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  upsert(@Body() dto: { blockId: string; startDate: Date; endDate?: Date; rrule?: string }) {
    return this.scheduleService.upsert(dto.blockId, new Date(dto.startDate), dto.endDate ? new Date(dto.endDate) : undefined, dto.rrule);
  }

  @Get(':blockId')
  findOne(@Param('blockId') blockId: string) {
    return this.scheduleService.findOne(blockId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
