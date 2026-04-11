import { Module } from '@nestjs/common';
import { NauthenticityService } from './nauthenticity.service';
import { NauthenticityController } from './nauthenticity.controller';

@Module({
  providers: [NauthenticityService],
  controllers: [NauthenticityController],
  exports: [NauthenticityService],
})
export class IntegrationsModule {}
