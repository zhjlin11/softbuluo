const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const s = await p.software.findUnique({
    where: { slug: '7zip' },
    include: {
      versions: {
        include: { downloadSources: true }
      }
    }
  });

  console.log('Software 7zip:');
  console.log(`- ID: ${s.id}`);
  console.log(`- Versions count: ${s.versions.length}`);
  for (const v of s.versions) {
    console.log(`  - Version: ${v.version}, isLatest: ${v.isLatest}, reviewStatus: ${v.reviewStatus}, downloadSources: ${v.downloadSources.length}`);
    for (const d of v.downloadSources) {
      console.log(`    - Source: [${d.sourceType}] ${d.sourceName} -> ${d.url} (isActive: ${d.isActive})`);
    }
  }

  // Also check all 50 published software versions and sources
  const allPub = await p.software.findMany({
    where: { status: 'PUBLISHED', isTestData: false },
    include: {
      versions: {
        include: { downloadSources: true }
      }
    }
  });

  console.log('\n--- All 50 Published Software Version & Source Summary ---');
  let zeroSourceCount = 0;
  for (const sw of allPub) {
    const totalSources = sw.versions.flatMap(v => v.downloadSources);
    const activeSources = totalSources.filter(d => d.isActive);
    if (activeSources.length === 0) {
      zeroSourceCount++;
      console.log(`⚠️ ZERO ACTIVE SOURCES: ${sw.slug} (${sw.name}) - versions: ${sw.versions.length}, totalSources: ${totalSources.length}`);
    }
  }
  console.log(`Total with zero active sources: ${zeroSourceCount} / 50`);

  await p.$disconnect();
}

main().catch(console.error);
