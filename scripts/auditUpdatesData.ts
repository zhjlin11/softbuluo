import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== P8.7.10 UPDATES SYSTEM BASELINE DATA AUDIT ===\n');

  // 1. Software counts
  const totalSoftware = await prisma.software.count();
  const publishedSoftware = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const draftSoftware = await prisma.software.count({
    where: { status: 'DRAFT' }
  });
  const testSoftware = await prisma.software.count({
    where: { isTestData: true }
  });

  console.log('Software Overview:');
  console.log(`- Total in DB: ${totalSoftware}`);
  console.log(`- Published (non-test): ${publishedSoftware}`);
  console.log(`- Draft: ${draftSoftware}`);
  console.log(`- Test data: ${testSoftware}`);

  // Breakdown by ResourceType
  const softwareByType = await prisma.software.groupBy({
    by: ['type'],
    where: { status: 'PUBLISHED', isTestData: false },
    _count: true
  });
  console.log('\nPublished Software by Type:');
  for (const item of softwareByType) {
    console.log(`- ${item.type}: ${item._count}`);
  }

  // 2. SoftwareVersion counts
  const totalVersions = await prisma.softwareVersion.count();
  const versionsForPublished = await prisma.softwareVersion.count({
    where: {
      software: { status: 'PUBLISHED', isTestData: false }
    }
  });
  const versionsWithChangelog = await prisma.softwareVersion.count({
    where: {
      software: { status: 'PUBLISHED', isTestData: false },
      changelog: { not: null }
    }
  });
  const latestVersions = await prisma.softwareVersion.count({
    where: {
      software: { status: 'PUBLISHED', isTestData: false },
      isLatest: true
    }
  });
  const versionsByReviewStatus = await prisma.softwareVersion.groupBy({
    by: ['reviewStatus'],
    _count: true
  });

  console.log('\nSoftwareVersion Overview:');
  console.log(`- Total Versions in DB: ${totalVersions}`);
  console.log(`- Versions for Published Software: ${versionsForPublished}`);
  console.log(`- Versions with Changelog: ${versionsWithChangelog}`);
  console.log(`- Latest Versions: ${latestVersions}`);
  console.log('- Review Status breakdown:', versionsByReviewStatus);

  // Sample real versions
  const sampleVersions = await prisma.softwareVersion.findMany({
    where: { software: { status: 'PUBLISHED', isTestData: false } },
    include: { software: { select: { name: true, slug: true, type: true, publishedAt: true, createdAt: true, updatedAt: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('\nSample 10 Software Versions:');
  for (const v of sampleVersions) {
    console.log(`- [${v.software.name}] v${v.version} | releaseDate: "${v.releaseDate}" | reviewStatus: ${v.reviewStatus} | isLatest: ${v.isLatest} | hasChangelog: ${Boolean(v.changelog)} | versionCreatedAt: ${v.createdAt.toISOString()} | softwareUpdatedAt: ${v.software.updatedAt.toISOString()}`);
  }

  // 3. VersionCandidate counts
  const totalCandidates = await prisma.versionCandidate.count();
  const candidateStatus = await prisma.versionCandidate.groupBy({
    by: ['reviewStatus'],
    _count: true
  });
  console.log('\nVersionCandidate Overview:');
  console.log(`- Total Candidates: ${totalCandidates}`);
  console.log('- By Status:', candidateStatus);

  // 4. DownloadSource Overview
  const totalSources = await prisma.downloadSource.count();
  const sourceTypes = await prisma.downloadSource.groupBy({
    by: ['sourceType'],
    _count: true
  });
  console.log('\nDownloadSource Overview:');
  console.log(`- Total DownloadSources: ${totalSources}`);
  console.log('- By SourceType:', sourceTypes);

  // 5. ChannelRecommendation for UPDATES
  const updateRecommendations = await prisma.channelRecommendation.findMany({
    where: { channel: 'UPDATES' }
  });
  console.log(`\nChannelRecommendation (channel='UPDATES'): ${updateRecommendations.length}`);

  // 6. Tutorial Overview (For P8.7.8 Reality Check)
  const totalTutorials = await prisma.tutorial.count();
  const publishedTutorials = await prisma.tutorial.count({
    where: { status: 'PUBLISHED' }
  });
  console.log('\nTutorial Overview (P8.7.8 Audit):');
  console.log(`- Total Tutorials: ${totalTutorials}`);
  console.log(`- Published Tutorials: ${publishedTutorials}`);
  const sampleTutorials = await prisma.tutorial.findMany({
    take: 3,
    select: { id: true, title: true, status: true, softwareId: true, publishedAt: true }
  });
  console.log('- Sample Tutorials:', sampleTutorials);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
