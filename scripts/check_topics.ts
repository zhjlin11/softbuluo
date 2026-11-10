import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    include: {
      resources: {
        include: {
          software: true
        }
      }
    }
  });
  console.log('Existing Topics:', topics.map(t => ({ id: t.id, title: t.title, slug: t.slug, count: t.resources.length })));
}

main().finally(() => prisma.$disconnect());
