import { prisma } from '../server/src/db';

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log('Categories in DB:');
  console.log(JSON.stringify(cats, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
