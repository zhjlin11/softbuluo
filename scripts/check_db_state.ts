import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
  const count = await prisma.software.count();
  console.log('Total software in DB:', count);
  const sample = await prisma.software.findMany({
    select: { id: true, name: true, slug: true, category: { select: { name: true } } },
    take: 15
  });
  console.log('Sample softwares:', sample);
}

main().finally(() => prisma.$disconnect());
