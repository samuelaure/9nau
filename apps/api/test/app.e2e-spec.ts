import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // We explicitly use the test database for e2e tests
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ||
      'postgresql://testuser:testpass@localhost:5433/testdb?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    // Clean the database before running tests
    await prismaService.$executeRaw`TRUNCATE TABLE "Block" CASCADE;`;
  });

  afterAll(async () => {
    // Disconnect and close the app
    await prismaService.$disconnect();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
