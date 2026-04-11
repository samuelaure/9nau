import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JournalService } from './journal.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { z } from 'zod';

export class GenerateSummaryDto {
  periodType!: 'daily' | 'weekly' | 'monthly' | 'trimester' | 'yearly' | 'custom';
  startDate!: string;
  endDate!: string;
}

@Controller('api/journal')
@UseGuards(ServiceAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('summary')
  async generateSummary(@Body() request: GenerateSummaryDto) {
    if (!request.periodType || !request.startDate || !request.endDate) {
      return { success: false, error: 'Missing required fields: periodType, startDate, endDate' };
    }
    return this.journalService.generateSummary(request.periodType, request.startDate, request.endDate);
  }
}
