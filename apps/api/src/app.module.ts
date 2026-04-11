import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BlocksModule } from './blocks/blocks.module';
import { HealthModule } from './health/health.module';
import { RelationsModule } from './relations/relations.module';
import { ScheduleModule } from './schedule/schedule.module';
import { EventsModule } from './events/events.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SyncModule } from './sync/sync.module';
import { MediaModule } from './media/media.module';
import { TriageModule } from './triage/triage.module';
import { JournalModule } from './journal/journal.module';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    NestScheduleModule.forRoot(),
    PrismaModule,
    BlocksModule,
    HealthModule,
    RelationsModule,
    ScheduleModule,
    EventsModule,
    IntegrationsModule,
    SyncModule,
    MediaModule,
    TriageModule,
    JournalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
