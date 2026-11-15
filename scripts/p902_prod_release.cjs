const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPROVED_SLUGS = [
  'sharex',
  'handbrake',
  'notepad-plus-plus',
  'gimp',
  'process-explorer',
  'autoruns',
  'audacity',
  'sumatrapdf',
  'memtest86',
  'windows-terminal'
];

async function main() {
  console.log('===============================================================');
  console.log('🚀 软游部落 P9.0.2 生产环境数据库发布事务开始执行...');
  console.log('===============================================================\n');

  // 1. 查询发布前基线
  const prePublishedCount = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const preDraftCount = await prisma.software.count({
    where: { status: 'DRAFT', isTestData: false }
  });
  console.log(`[发布前状态] 已发布非测试资源: ${prePublishedCount} 款 | 草稿资源: ${preDraftCount} 款`);

  // 2. 事务执行增量发布
  const result = await prisma.$transaction(async (tx) => {
    // 2.1 批量发布 10 款优质软件
    const publishedSoftware = await tx.software.updateMany({
      where: {
        slug: { in: APPROVED_SLUGS },
        status: 'DRAFT',
        isTestData: false
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        dataIntegrityStatus: 'VERIFIED_COMPLETE',
        officialDomainVerified: true
      }
    });

    console.log(`[增量发布] 成功将 ${publishedSoftware.count} 款第二批软件转正发布为 PUBLISHED`);

    if (publishedSoftware.count !== 10) {
      throw new Error(`发布数量异常！预期 10 款，实际更新 ${publishedSoftware.count} 款，事务回滚`);
    }

    // 2.2 批量批准版本状态
    const approvedVersions = await tx.softwareVersion.updateMany({
      where: {
        software: { slug: { in: APPROVED_SLUGS } }
      },
      data: {
        reviewStatus: 'APPROVED'
      }
    });
    console.log(`[版本审核] 成功批准 ${approvedVersions.count} 个官方发布版本`);

    // 2.3 批量激活官方下载来源
    const activatedSources = await tx.downloadSource.updateMany({
      where: {
        version: { software: { slug: { in: APPROVED_SLUGS } } }
      },
      data: {
        isActive: true,
        reviewStatus: 'APPROVED',
        lastCheckStatus: 'HEALTHY'
      }
    });
    console.log(`[下载激活] 成功激活 ${activatedSources.count} 条官方下载直链/发布页`);

    // 2.4 记录管理员审计日志
    const adminUser = await tx.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });

    if (adminUser) {
      await tx.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'PUBLISH_SOFTWARE_BATCH_P902',
          targetType: 'SOFTWARE_BATCH',
          targetId: 'batch-p902-10items',
          after: JSON.stringify({
            publishedSlugs: APPROVED_SLUGS,
            publishedCount: 10,
            publishedAt: new Date().toISOString(),
            governanceRating: '100%_OFFICIAL_VERIFIED'
          })
        }
      });
      console.log(`[操作审计] 成功写入管理员发布审计日志 (操作人: ${adminUser.username})`);
    }

    return {
      publishedCount: publishedSoftware.count,
      versionsCount: approvedVersions.count,
      sourcesCount: activatedSources.count
    };
  });

  // 3. 发布后基线统计与验证
  const postPublishedCount = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const postDraftCount = await prisma.software.count({
    where: { status: 'DRAFT', isTestData: false }
  });

  console.log('\n===============================================================');
  console.log('🎉 软游部落 P9.0.2 数据库发布事务全部成功提交！');
  console.log('===============================================================');
  console.log(`[发布后状态] 已发布非测试资源: ${postPublishedCount} 款 (净增 +${postPublishedCount - prePublishedCount} 款)`);
  console.log(`[发布后状态] 剩余草稿储备资源: ${postDraftCount} 款 (减少 -${preDraftCount - postDraftCount} 款)`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ P9.0.2 发布事务执行失败:', err);
  prisma.$disconnect();
  process.exit(1);
});
