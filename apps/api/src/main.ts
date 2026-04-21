import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable graceful shutdown hooks (onModuleDestroy, onApplicationShutdown)
  app.enableShutdownHooks();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const origins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_ACCOUNTS_URL,
    'https://nauthenticity.9nau.com',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
  ].filter((origin): origin is string => !!origin);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`9naŭ API listening on port ${port}`);
}
bootstrap();
