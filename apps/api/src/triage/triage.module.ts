import { Module } from '@nestjs/common';
import { TriageService } from './triage.service';
import { TriageController } from './triage.controller';
import { BlocksModule } from '../blocks/blocks.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [BlocksModule, IntegrationsModule],
  controllers: [TriageController],
  providers: [TriageService],
  exports: [TriageService],
})
export class TriageModule {}
