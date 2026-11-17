const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const totalSw = await p.software.count();
  const pubSw = await p.software.count({ where: { status: 'PUBLISHED', isTestData: false } });
  const pubByType = {
    software: await p.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'SOFTWARE' } }),
    tool: await p.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'TOOL' } }),
    game: await p.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'GAME' } }),
  };
  const draftSw = await p.software.count({ where: { status: 'DRAFT', isTestData: false } });
  const testSw = await p.software.count({ where: { isTestData: true } });
  const archivedSw = await p.software.count({ where: { status: 'ARCHIVED' } });

  const totalTut = await p.tutorial.count();
  const pubTut = await p.tutorial.count({
    where: { status: 'PUBLISHED', slug: { not: { startsWith: 'tut-p3-' } } }
  });
  const testTut = await p.tutorial.count({
    where: { slug: { startsWith: 'tut-p3-' } }
  });

  const totalSources = await p.downloadSource.count();
  const activeSources = await p.downloadSource.count({ where: { isActive: true } });

  console.log(JSON.stringify({
    totalSw,
    pubSw,
    pubByType,
    draftSw,
    testSw,
    archivedSw,
    totalTut,
    pubTut,
    testTut,
    totalSources,
    activeSources,
  }, null, 2));

  await p.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
