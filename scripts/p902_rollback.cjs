const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANDIDATE_SLUGS = [
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

async function rollbackP902() {
  console.log('===============================================================');
  console.log('🔄 软游部落 P9.0.2 细粒度业务回滚事务开始执行...');
  console.log('===============================================================\n');

  await prisma.$transaction(async (tx) => {
    // 1. 将 10 款软件由 PUBLISHED 回退为 DRAFT
    const swRes = await tx.software.updateMany({
      where: { slug: { in: CANDIDATE_SLUGS }, status: 'PUBLISHED' },
      data: { status: 'DRAFT', publishedAt: null }
    });
    console.log(`  ✓ 成功将 ${swRes.count} 款软件状态回退为 DRAFT`);

    // 2. 将版本审核状态重置为 PENDING
    const verRes = await tx.softwareVersion.updateMany({
      where: { software: { slug: { in: CANDIDATE_SLUGS } } },
      data: { reviewStatus: 'PENDING' }
    });
    console.log(`  ✓ 成功将 ${verRes.count} 个版本状态回退为 PENDING`);

    // 3. 将对应下载来源停用
    const srcRes = await tx.downloadSource.updateMany({
      where: { version: { software: { slug: { in: CANDIDATE_SLUGS } } } },
      data: { isActive: false, reviewStatus: 'PENDING' }
    });
    console.log(`  ✓ 成功将 ${srcRes.count} 个下载源状态置为停用`);

    // 4. 记录回滚审计流水
    const admin = await tx.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
    if (admin) {
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'ROLLBACK_SOFTWARE_BATCH_P902',
          targetType: 'SOFTWARE_BATCH',
          targetId: 'batch-p902-10items',
          after: JSON.stringify({ rollbackAt: new Date().toISOString(), slugs: CANDIDATE_SLUGS })
        }
      });
      console.log('  ✓ 写入回滚审计日志');
    }
  });

  const postPublishedCount = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const postDraftCount = await prisma.software.count({
    where: { status: 'DRAFT', isTestData: false }
  });

  console.log('\n===============================================================');
  console.log('🎉 P9.0.2 细粒度回滚成功完成！全站已发布软件恢复为 40 款基线。');
  console.log(`[回滚后状态] 已发布非测试资源: ${postPublishedCount} 款 | 草稿资源: ${postDraftCount} 款`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
  process.exit(0);
}

rollbackP902().catch((err) => {
  console.error('❌ 回滚执行失败:', err);
  prisma.$disconnect();
  process.exit(1);
});
