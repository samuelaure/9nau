import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  check() {
    return {
      status: 'ok',
      service: '9nau-api',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
