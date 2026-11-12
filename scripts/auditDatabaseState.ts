import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('====================================================');
  console.log('📊 软游部落 P8.9 数据库真实数据深度审计');
  console.log('====================================================\n');

  // 1. Software 统计
  const totalSoftware = await prisma.software.count();
  const softwareByType = await prisma.software.groupBy({
    by: ['type', 'status', 'isTestData'],
    _count: { id: true },
  });

  console.log('--- 1. Software (资源表) 统计 ---');
  console.log(`总记录数: ${totalSoftware}`);
  console.table(
    softwareByType.map((g) => ({
      Type: g.type,
      Status: g.status,
      IsTestData: g.isTestData,
      Count: g._count.id,
    }))
  );

  const publishedNonTestSoftware = await prisma.software.count({
    where: { type: 'SOFTWARE', status: 'PUBLISHED', isTestData: false },
  });
  const publishedNonTestTools = await prisma.software.count({
    where: { type: 'TOOL', status: 'PUBLISHED', isTestData: false },
  });
  const publishedNonTestGames = await prisma.software.count({
    where: { type: 'GAME', status: 'PUBLISHED', isTestData: false },
  });
  console.log(`- 公开非测试电脑软件 (SOFTWARE): ${publishedNonTestSoftware}`);
  console.log(`- 公开非测试系统工具 (TOOL): ${publishedNonTestTools}`);
  console.log(`- 公开非测试游戏 (GAME): ${publishedNonTestGames}`);
  console.log(`- 合计公开非测试核心资源: ${publishedNonTestSoftware + publishedNonTestTools + publishedNonTestGames}\n`);

  // 2. Tutorial (教程表) 统计
  const totalTutorials = await prisma.tutorial.count();
  const tutorialsByStatus = await prisma.tutorial.groupBy({
    by: ['status', 'isPremium'],
    _count: { id: true },
  });
  console.log('--- 2. Tutorial (教程表) 统计 ---');
  console.log(`总记录数: ${totalTutorials}`);
  console.table(
    tutorialsByStatus.map((g) => ({
      Status: g.status,
      IsPremium: g.isPremium,
      Count: g._count.id,
    }))
  );

  // 3. DownloadSource (下载来源表) 统计
  const totalSources = await prisma.downloadSource.count();
  const sourcesByType = await prisma.downloadSource.groupBy({
    by: ['sourceType', 'verificationStatus', 'scanStatus'],
    _count: { id: true },
  });
  const sourcesWithSha256 = await prisma.downloadSource.count({
    where: { sha256: { not: null } },
  });
  const sourcesHttps = await prisma.downloadSource.count({
    where: { url: { startsWith: 'https://' } },
  });
  const sourcesOfficial = await prisma.downloadSource.count({
    where: { sourceType: { in: ['OFFICIAL_EXTERNAL', 'OFFICIAL_DIRECT', 'OFFICIAL_RELEASE'] } },
  });

  console.log('--- 3. DownloadSource (下载渠道) 统计 ---');
  console.log(`总下载来源数: ${totalSources}`);
  console.log(`- HTTPS 来源数: ${sourcesHttps} / ${totalSources} (${((sourcesHttps / (totalSources || 1)) * 100).toFixed(1)}%)`);
  console.log(`- 官方标记来源数: ${sourcesOfficial} / ${totalSources}`);
  console.log(`- 具备真实 SHA-256 哈希数: ${sourcesWithSha256} / ${totalSources}`);
  console.table(
    sourcesByType.map((g) => ({
      SourceType: g.sourceType,
      VerificationStatus: g.verificationStatus,
      ScanStatus: g.scanStatus,
      Count: g._count.id,
    }))
  );

  // 4. SoftwareVersion (版本表)
  const totalVersions = await prisma.softwareVersion.count();
  const versionsWithChangelog = await prisma.softwareVersion.count({
    where: { changelog: { not: null } },
  });
  console.log('\n--- 4. SoftwareVersion (版本) 统计 ---');
  console.log(`总版本记录数: ${totalVersions}`);
  console.log(`- 包含更新日志数: ${versionsWithChangelog} / ${totalVersions}`);

  // 5. 社区与评测数据
  const totalComparisons = await prisma.softwareComparison.count();
  const totalThreads = await prisma.discussionThread.count();
  const totalPosts = await prisma.discussionPost.count();
  const totalTopics = await prisma.topic.count();
  console.log('\n--- 5. 历史频道数据保留统计 ---');
  console.log(`- 对比评测专题数: ${totalComparisons}`);
  console.log(`- 社区交流主题数: ${totalThreads}`);
  console.log(`- 社区交流回帖数: ${totalPosts}`);
  console.log(`- 精选专题中心数: ${totalTopics}`);

  // 6. 事件与统计真实性
  const totalDownloadEvents = await prisma.downloadEvent.count();
  const downloadEventsByType = await prisma.downloadEvent.groupBy({
    by: ['eventType'],
    _count: { id: true },
  });
  const totalPageViews = await prisma.sitePageView.count();
  const totalSearchLogs = await prisma.searchQueryLog.count();
  console.log('\n--- 6. 用户行为事件统计 ---');
  console.log(`- 下载事件总数: ${totalDownloadEvents}`);
  console.table(
    downloadEventsByType.map((g) => ({
      EventType: g.eventType,
      Count: g._count.id,
    }))
  );
  console.log(`- 页面浏览记录数 (SitePageView): ${totalPageViews}`);
  console.log(`- 搜索查询记录数 (SearchQueryLog): ${totalSearchLogs}`);

  // 7. 孤儿数据与数据一致性检查
  console.log('\n--- 7. 数据一致性与孤儿记录核验 ---');
  const orphanVersions: any = await prisma.$queryRaw`
    SELECT count(*)::int as count FROM "SoftwareVersion" WHERE "softwareId" NOT IN (SELECT id FROM "Software")
  `;
  console.log(`- 孤儿版本记录数 (无所属软件): ${orphanVersions[0]?.count ?? 0}`);

  const orphanSources: any = await prisma.$queryRaw`
    SELECT count(*)::int as count FROM "DownloadSource" WHERE "versionId" NOT IN (SELECT id FROM "SoftwareVersion")
  `;
  console.log(`- 孤儿下载来源数 (无所属版本): ${orphanSources[0]?.count ?? 0}`);

  // 检查重复 slug
  const allSoftwareSlugs = await prisma.software.findMany({ select: { slug: true } });
  const slugCounts = new Map<string, number>();
  for (const s of allSoftwareSlugs) {
    slugCounts.set(s.slug, (slugCounts.get(s.slug) || 0) + 1);
  }
  const duplicateSlugs = [...slugCounts.entries()].filter(([_, count]) => count > 1);
  console.log(`- 重复 Software Slug 数: ${duplicateSlugs.length} ${duplicateSlugs.length > 0 ? JSON.stringify(duplicateSlugs) : '✅ 无重复'}`);

  const allTutorialSlugs = await prisma.tutorial.findMany({ select: { slug: true } });
  const tutSlugCounts = new Map<string, number>();
  for (const t of allTutorialSlugs) {
    tutSlugCounts.set(t.slug, (tutSlugCounts.get(t.slug) || 0) + 1);
  }
  const duplicateTutSlugs = [...tutSlugCounts.entries()].filter(([_, count]) => count > 1);
  console.log(`- 重复 Tutorial Slug 数: ${duplicateTutSlugs.length} ${duplicateTutSlugs.length > 0 ? JSON.stringify(duplicateTutSlugs) : '✅ 无重复'}`);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
