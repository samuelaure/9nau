import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateBlockDto } from '../src/blocks/dto/create-block.dto';
import { UpdateBlockDto } from '../src/blocks/dto/update-block.dto';
import { Prisma } from '@prisma/client';

describe('BlocksController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // Use the test database
    process.env.DATABASE_URL =
      process.env.DATABASE_URL_TEST ||
      'postgresql://testuser:testpass@localhost:5433/testdb?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Reset the database before each test
    await prismaService.$executeRaw`TRUNCATE TABLE "Block" CASCADE;`;
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  it('POST /blocks should create a new block', async () => {
    const createDto: CreateBlockDto = {
      type: 'note',
      properties: { text: 'New test note' },
    };

    const response = await request(app.getHttpServer())
      .post('/blocks')
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.type).toBe('note');
    expect(response.body.properties.text).toBe('New test note');

    const createdBlock = await prismaService.block.findUnique({
      where: { id: response.body.id },
    });
    expect(createdBlock).toBeDefined();
    expect((createdBlock?.properties as Prisma.JsonObject)?.text).toBe(
      'New test note',
    );
  });

  it('GET /blocks should return a list of blocks', async () => {
    await prismaService.block.createMany({
      data: [
        { id: 'b1', type: 'note', properties: { text: 'Note 1' } },
        { id: 'b2', type: 'note', properties: { text: 'Note 2' } },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/blocks')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].type).toBe('note');
  });

  it('GET /blocks?status=inbox should return only inbox blocks', async () => {
    await prismaService.block.createMany({
      data: [
        {
          id: 'b3',
          type: 'note',
          properties: { text: 'Note 3', status: 'inbox' },
        },
        {
          id: 'b4',
          type: 'note',
          properties: { text: 'Note 4', status: 'trash' },
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/blocks?status=inbox')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].properties.status).toBe('inbox');
  });

  it('PATCH /blocks/:id should update a block', async () => {
    const block = await prismaService.block.create({
      data: { type: 'note', properties: { text: 'Old text' } },
    });
    const updateDto: UpdateBlockDto = { properties: { text: 'New text' } };

    const response = await request(app.getHttpServer())
      .patch(`/blocks/${block.id}`)
      .send(updateDto)
      .expect(200);

    expect(response.body.properties.text).toBe('New text');

    const updatedBlock = await prismaService.block.findUnique({
      where: { id: block.id },
    });
    expect((updatedBlock?.properties as Prisma.JsonObject)?.text).toBe(
      'New text',
    );
  });

  it('DELETE /blocks/:id should delete a block', async () => {
    const block = await prismaService.block.create({
      data: { type: 'note', properties: { text: 'To be deleted' } },
    });

    await request(app.getHttpServer())
      .delete(`/blocks/${block.id}`)
      .expect(200);

    const deletedBlock = await prismaService.block.findUnique({
      where: { id: block.id },
    });
    expect(deletedBlock).toBeNull();
  });
});
