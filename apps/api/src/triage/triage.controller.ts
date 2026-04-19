import { Controller, Post, Get, Query, Body, UseGuards } from '@nestjs/common';
import { TriageService } from './triage.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

export class TriageDto {
  text!: string;
  userId?: string;
  sourceBlockId?: string;
  brandId?: string | null;
  workspaceId?: string;
}

@UseGuards(ServiceAuthGuard)
@Controller('triage')
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @Post()
  async processTriage(@Body() body: TriageDto) {
    const result = await this.triageService.processRawText(
      body.text,
      body.userId || 'default_user',
      body.sourceBlockId,
      body.brandId,
      body.workspaceId,
    );
    return result;
  }

  @Get('brands')
  async getUserBrandsForTriage(@Query('userId') userId: string) {
    const brands = await this.triageService.getUserBrands(userId);
    return { brands };
  }

  @Post('retroprocess')
  async retroprocess(@Body() body: { userId?: string }) {
    const result = await this.triageService.retroprocess(body.userId || 'default_user');
    return result;
  }
}
