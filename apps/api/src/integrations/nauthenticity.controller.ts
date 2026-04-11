import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NauthenticityService } from './nauthenticity.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@Controller('integrations/nauthenticity')
export class NauthenticityController {
  constructor(private readonly nauthenticityService: NauthenticityService) {}

  @Post('targets')
  @UseGuards(ServiceAuthGuard)
  async addTargets(@Body() body: { brandId: string; usernames: string[] }) {
    return this.nauthenticityService.addTargets(body.brandId, body.usernames);
  }

  @Post('generate-comment')
  @UseGuards(ServiceAuthGuard)
  async generateComment(@Body() body: { targetUrl: string; brandId: string }) {
    return this.nauthenticityService.generateComment(
      body.targetUrl,
      body.brandId,
    );
  }
}
