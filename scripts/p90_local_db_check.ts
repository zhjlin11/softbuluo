import { prisma } from '../server/src/db';

async function main() {
  const swTotal = await prisma.software.count();
  const swPub = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false } });
  const swDraft = await prisma.software.count({ where: { status: 'DRAFT', isTestData: false } });
  const swTest = await prisma.software.count({ where: { isTestData: true } });
  const dsTotal = await prisma.downloadSource.count();
  const dsPub = await prisma.downloadSource.count({ where: { version: { software: { status: 'PUBLISHED', isTestData: false } } } });
  const dsPubLatest = await prisma.downloadSource.count({ where: { version: { isLatest: true, software: { status: 'PUBLISHED', isTestData: false } } } });
  const ssTotal = await prisma.softwareSource.count();
  const jobTotal = await prisma.job.count();
  const vcTotal = await prisma.versionCandidate.count();
  const lclTotal = await prisma.linkCheckLog.count();
  const tutTotal = await prisma.tutorial.count();
  const tutGenuine = await prisma.tutorial.count({ where: { status: 'PUBLISHED', NOT: { slug: { startsWith: 'tut-p3-' } } } });

  console.log('=== LOCAL DB COUNTS ===');
  console.log({ swTotal, swPub, swDraft, swTest, tutTotal, tutGenuine, dsTotal, dsPub, dsPubLatest, ssTotal, jobTotal, vcTotal, lclTotal });

  const allNonTest = await prisma.software.findMany({
    where: { isTestData: false },
    select: { name: true, slug: true, status: true, type: true, officialWebsite: true },
    orderBy: [{ status: 'asc' }, { name: 'asc' }]
  });
  console.log(`\n=== ALL NON-TEST SOFTWARE (${allNonTest.length}) ===`);
  for (const s of allNonTest) {
    console.log(`[${s.status}][${s.type}] ${s.name} (${s.slug}) -> ${s.officialWebsite || 'NO_URL'}`);
  }

  const jobs = await prisma.job.findMany();
  console.log('\n=== JOBS ===');
  console.log(jobs.map(j => ({ id: j.id, name: j.name, type: j.type, status: j.status, cronExpr: j.cronExpr, lastRunAt: j.lastRunAt })));
  
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
