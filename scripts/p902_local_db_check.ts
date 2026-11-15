import { prisma } from '../server/src/db';

async function main() {
  const total = await prisma.software.count();
  const pubNonTest = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false } });
  const pubTools = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'TOOL' } });
  const pubSoftware = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'SOFTWARE' } });
  const pubGames = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'GAME' } });
  const draftNonTest = await prisma.software.count({ where: { status: 'DRAFT', isTestData: false } });
  const testData = await prisma.software.count({ where: { isTestData: true } });
  const archived = await prisma.software.count({ where: { status: 'ARCHIVED' } });
  const sources = await prisma.downloadSource.count();
  const activeSources = await prisma.downloadSource.count({ where: { isActive: true } });
  const inactiveSources = await prisma.downloadSource.count({ where: { isActive: false } });
  const tuts = await prisma.tutorial.count({ where: { status: 'PUBLISHED', slug: { not: { startsWith: 'tut-p3-' } } } });

  console.log('=== LOCAL DB P902 AUDIT ===');
  console.log({
    total,
    pubNonTest,
    pubSoftware,
    pubTools,
    pubGames,
    draftNonTest,
    testData,
    archived,
    sources,
    activeSources,
    inactiveSources,
    tuts
  });

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
