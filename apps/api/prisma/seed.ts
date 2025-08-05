import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test database...');
  // Seed data for testing purposes
  // Example:
  // await prisma.block.createMany({
  //   data: [
  //     { type: 'note', properties: { text: 'Test note 1' } },
  //     { type: 'action', properties: { text: 'Test action 1', completed: false } },
  //   ],
  // });
  console.log('Test database seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
