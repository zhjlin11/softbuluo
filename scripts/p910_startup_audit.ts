import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('========================================================================');
  console.log('🔍 软游部落 P9.1.0 运营启动健康检查 (Stage A 只读审计)');
  console.log('========================================================================\n');

  // 1. 软件资源全库盘点
  const totalSoftware = await prisma.software.count();
  const publishedSoftware = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false } });
  const publishedSoftwareByType = {
    software: await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'SOFTWARE' } }),
    tool: await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'TOOL' } }),
    game: await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false, type: 'GAME' } }),
  };
  const draftSoftware = await prisma.software.count({ where: { status: 'DRAFT', isTestData: false } });
  const testDataSoftware = await prisma.software.count({ where: { isTestData: true } });
  const archivedSoftware = await prisma.software.count({ where: { status: 'ARCHIVED' } });

  console.log('【1. 软件资源全景盘点】');
  console.log(`- 全库软件总数: ${totalSoftware} 款`);
  console.log(`- 正式已发布非测试软件: ${publishedSoftware} 款`);
  console.log(`  ├─ 电脑软件 (SOFTWARE): ${publishedSoftwareByType.software} 款`);
  console.log(`  ├─ 系统工具 (TOOL): ${publishedSoftwareByType.tool} 款`);
  console.log(`  └─ 游戏中心 (GAME): ${publishedSoftwareByType.game} 款`);
  console.log(`- 待审非测试草稿: ${draftSoftware} 款`);
  console.log(`- 物理隔离测试资源: ${testDataSoftware} 款`);
  console.log(`- 安全归档软件: ${archivedSoftware} 款\n`);

  // 2. 教程资源盘点
  const totalTutorials = await prisma.tutorial.count();
  const publishedTutorials = await prisma.tutorial.count({
    where: {
      status: 'PUBLISHED',
      slug: { not: { startsWith: 'tut-p3-' } }
    }
  });
  const testTutorials = await prisma.tutorial.count({
    where: { slug: { startsWith: 'tut-p3-' } }
  });

  console.log('【2. 教程资源全景盘点】');
  console.log(`- 教程总数: ${totalTutorials} 篇`);
  console.log(`- 正式已发布非测试教程: ${publishedTutorials} 篇`);
  console.log(`- 历史隔离测试教程: ${testTutorials} 篇\n`);

  // 3. 下载来源盘点
  const totalSources = await prisma.downloadSource.count();
  const activeSources = await prisma.downloadSource.count({ where: { isActive: true } });
  const inactiveSources = await prisma.downloadSource.count({ where: { isActive: false } });
  const officialDirectSources = await prisma.downloadSource.count({ where: { sourceType: 'OFFICIAL_DIRECT', isActive: true } });
  const externalPageSources = await prisma.downloadSource.count({ where: { sourceType: 'EXTERNAL_DOWNLOAD_PAGE', isActive: true } });

  console.log('【3. 下载来源全景盘点】');
  console.log(`- 下载来源总记录: ${totalSources} 条`);
  console.log(`- 有效启用中来源: ${activeSources} 条`);
  console.log(`  ├─ 官方直链 (OFFICIAL_DIRECT): ${officialDirectSources} 条`);
  console.log(`  └─ 官方发布页 (EXTERNAL_DOWNLOAD_PAGE): ${externalPageSources} 条`);
  console.log(`- 已停用/安全归档来源: ${inactiveSources} 条\n`);

  // 4. 统计与日志现状盘点
  const totalPvLogs = await prisma.sitePageView.count();
  const totalSearchLogs = await prisma.searchQueryLog.count();
  const totalDownloadEvents = await prisma.downloadEvent.count();
  const totalAuditLogs = await prisma.auditLog.count();

  console.log('【4. 访问统计与业务日志现状】');
  console.log(`- 页面访问打点记录 (SitePageView): ${totalPvLogs} 条`);
  console.log(`- 站内搜索日志记录 (SearchQueryLog): ${totalSearchLogs} 条`);
  console.log(`- 下载事件流水记录 (DownloadEvent): ${totalDownloadEvents} 条`);
  console.log(`- 管理员操作审计流水 (AuditLog): ${totalAuditLogs} 条\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
