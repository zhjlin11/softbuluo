const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== PRODUCTION DATABASE AUDIT ===');
  const sw = await prisma.software.groupBy({
    by: ['type', 'status', 'isTestData'],
    _count: { id: true },
  });
  console.log('Software Breakdown:', JSON.stringify(sw, null, 2));

  const publishedNonTest = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  console.log('Published Non-Test Software Total:', publishedNonTest);

  const tut = await prisma.tutorial.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('Tutorial Breakdown:', JSON.stringify(tut, null, 2));

  const totalTutorials = await prisma.tutorial.count();
  console.log('Total Tutorials in Prod DB:', totalTutorials);

  const dsCount = await prisma.downloadSource.count();
  console.log('Total DownloadSource in Prod DB:', dsCount);

  const dsByType = await prisma.downloadSource.groupBy({
    by: ['sourceType', 'verificationStatus', 'scanStatus'],
    _count: { id: true }
  });
  console.log('DownloadSource Breakdown:', JSON.stringify(dsByType, null, 2));

  const totalVersions = await prisma.softwareVersion.count();
  console.log('Total SoftwareVersion in Prod DB:', totalVersions);

  const totalComparisons = await prisma.softwareComparison.count();
  const totalThreads = await prisma.discussionThread.count();
  const totalPosts = await prisma.discussionPost.count();
  console.log('Comparisons:', totalComparisons, 'Threads:', totalThreads, 'Posts:', totalPosts);

  const totalDownloads = await prisma.downloadEvent.count();
  const totalViews = await prisma.sitePageView.count();
  console.log('DownloadEvents:', totalDownloads, 'SitePageViews:', totalViews);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
