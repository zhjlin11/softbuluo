import { prisma } from '../server/src/db';

async function main() {
  const published = await prisma.software.findMany({
    where: { status: 'PUBLISHED', isTestData: false },
    select: { name: true, slug: true, type: true },
    orderBy: { name: 'asc' }
  });

  const drafts = await prisma.software.findMany({
    where: { status: 'DRAFT', isTestData: false },
    select: { name: true, slug: true, type: true },
    orderBy: { name: 'asc' }
  });

  console.log(`=== 40 ALREADY PUBLISHED SOFTWARE ===`);
  published.forEach(p => console.log(`[PUBLISHED] ${p.name} (${p.slug}) - ${p.type}`));

  console.log(`\n=== 51 CURRENT DRAFTS ===`);
  drafts.forEach(d => console.log(`[DRAFT] ${d.name} (${d.slug}) - ${d.type}`));

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
