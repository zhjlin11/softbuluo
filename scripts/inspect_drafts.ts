import { prisma } from '../server/src/db';

async function main() {
  const drafts = await prisma.software.findMany({
    where: { status: 'DRAFT', isTestData: false },
    include: {
      versions: {
        include: {
          downloadSources: true,
        },
      },
      sources: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Total DRAFT software in local DB: ${drafts.length}`);

  const byCat: Record<string, typeof drafts> = {};
  for (const d of drafts) {
    const key = `[${d.type}]`;
    if (!byCat[key]) byCat[key] = [];
    byCat[key].push(d);
  }

  for (const [cat, list] of Object.entries(byCat)) {
    console.log(`\n=== ${cat} (${list.length}) ===`);
    for (const d of list) {
      const ver = d.versions.find((v) => v.isLatest)?.version || d.versions[0]?.version || 'none';
      const dlCount = d.versions.reduce((acc, v) => acc + v.downloadSources.length, 0);
      console.log(`  • ${d.name} (${d.slug}) | Dev: ${d.developer || 'N/A'} | Ver: ${ver} | DL Sources: ${dlCount} | Web: ${d.officialWebsite}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
