import { prisma } from '../server/src/db';

const CANDIDATE_SLUGS = [
  'process-explorer',
  'autoruns',
  'memtest86',
  'sharex',
  'windows-terminal',
  'notepad-plus-plus',
  'gimp',
  'sumatrapdf',
  'handbrake',
  'audacity'
];

async function main() {
  const softwares = await prisma.software.findMany({
    where: { slug: { in: CANDIDATE_SLUGS } },
    include: {
      category: { select: { name: true, slug: true } },
      versions: {
        include: {
          downloadSources: true
        }
      }
    }
  });

  console.log(`=== AUDITING 10 CANDIDATE SOFTWARES IN DB ===\n`);
  for (const s of softwares) {
    console.log(`------------------------------------------------------------`);
    console.log(`Name: ${s.name} (${s.slug}) | ID: ${s.id}`);
    console.log(`Type: ${s.type} | Category: ${s.category?.name} (${s.category?.slug})`);
    console.log(`Developer: ${s.developer}`);
    console.log(`Summary: ${s.summary}`);
    console.log(`Status: ${s.status} | isTestData: ${s.isTestData}`);
    console.log(`Official Domain Verified: ${s.officialDomainVerified} | Data Integrity: ${s.dataIntegrityStatus}`);
    console.log(`Versions count: ${s.versions.length}`);
    for (const v of s.versions) {
      console.log(`  Version: ${v.version} | releaseDate: ${v.releaseDate} | reviewStatus: ${v.reviewStatus} | changelog: ${v.changelog ? 'yes' : 'no'}`);
      console.log(`  DownloadSources: ${v.downloadSources.length}`);
      for (const ds of v.downloadSources) {
        console.log(`    - ID: ${ds.id} | Name: ${ds.sourceName} | Type: ${ds.sourceType} | Active: ${ds.isActive} | URL: ${ds.url}`);
      }
    }
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
