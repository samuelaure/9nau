import { Module } from '@nestjs/common';
import { NauthenticityService } from './nauthenticity.service';
import { NauthenticityController } from './nauthenticity.controller';
import { FlownauIntegrationService } from './flownau.service';

@Module({
  providers: [NauthenticityService, FlownauIntegrationService],
  controllers: [NauthenticityController],
  exports: [NauthenticityService, FlownauIntegrationService],
})
export class IntegrationsModule {}
