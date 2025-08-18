import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpsertScheduleDto } from './dto/upsert-schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  upsert(@Body() upsertScheduleDto: UpsertScheduleDto) {
    return this.scheduleService.upsert(upsertScheduleDto);
  }

  @Get(':blockId')
  findByBlockId(@Param('blockId') blockId: string) {
    return this.scheduleService.findByBlockId(blockId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
