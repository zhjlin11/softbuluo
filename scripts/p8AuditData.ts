import { prisma } from '../server/src/db';
import { ResourceStatus, OrderStatus } from '@prisma/client';

async function main() {
  console.log('================================================================');
  console.log('🔍 开始执行软游部落 P8-0 / P8-1 深度数据与资产审计');
  console.log('================================================================\n');

  const now = new Date();
  console.log(`审计执行时间: ${now.toISOString()} (${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })})`);
  console.log(`数据库连接串环境: ${process.env.DATABASE_URL || '默认 local postgresql://postgres:postgres@localhost:5432/softbuluo'}\n`);

  // 1. 软件资源统计
  const totalSoftware = await prisma.software.count();
  const publishedSoftware = await prisma.software.count({ where: { status: ResourceStatus.PUBLISHED } });
  const draftSoftware = await prisma.software.count({ where: { status: ResourceStatus.DRAFT } });
  const pendingReviewSoftware = await prisma.software.count({ where: { status: ResourceStatus.PENDING_REVIEW } });
  const needsReviewIntegrity = await prisma.software.count({ where: { dataIntegrityStatus: 'NEEDS_REVIEW' } });
  const testDataSoftware = await prisma.software.count({ where: { isTestData: true } });

  console.log('--- 1. 软件资源统计 ---');
  console.log(`软件总数: ${totalSoftware}`);
  console.log(`  - 已发布 (PUBLISHED): ${publishedSoftware}`);
  console.log(`  - 待审核草稿 (DRAFT): ${draftSoftware}`);
  console.log(`  - 待初审 (PENDING_REVIEW): ${pendingReviewSoftware}`);
  console.log(`  - 数据完整性待复核 (dataIntegrityStatus=NEEDS_REVIEW): ${needsReviewIntegrity}`);
  console.log(`  - 标记为测试数据 (isTestData=true): ${testDataSoftware}`);

  // 检查是否有临时或测试创建的软件
  const testSoftwareItems = await prisma.software.findMany({
    where: {
      OR: [
        { isTestData: true },
        { slug: { contains: 'test' } },
        { name: { contains: 'test' } },
        { name: { contains: '测试' } }
      ]
    },
    select: { id: true, name: true, slug: true, status: true, isTestData: true, createdAt: true }
  });
  console.log(`包含测试特征的软件数: ${testSoftwareItems.length}`);
  for (const item of testSoftwareItems) {
    console.log(`  * [${item.status}] ${item.name} (${item.slug}) - isTestData: ${item.isTestData}, createdAt: ${item.createdAt.toISOString()}`);
  }

  // 2. 订单系统统计
  console.log('\n--- 2. 订单系统与资金统计 ---');
  const totalOrders = await prisma.order.count();
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { totalAmountFen: true, totalRefundedFen: true }
  });
  console.log(`订单总数: ${totalOrders}`);
  for (const group of ordersByStatus) {
    console.log(`  - 状态 ${group.status}: ${group._count.id} 笔, 涉及总金额: ${((group._sum.totalAmountFen || 0) / 100).toFixed(2)} 元, 退款: ${((group._sum.totalRefundedFen || 0) / 100).toFixed(2)} 元`);
  }

  // 深度检查 PAID 订单
  const paidOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PAID },
    include: {
      user: { select: { email: true, username: true } },
      payments: true,
      entitlements: true
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\n已支付 (PAID) 订单总计: ${paidOrders.length} 笔`);
  
  // 检查支付渠道与交易号特征
  let mockCount = 0;
  let testPrefixCount = 0;
  let hasRealWechatWebhook = 0;

  for (const o of paidOrders) {
    const isMockTx = o.transactionId?.startsWith('MOCK_') || o.transactionId?.startsWith('mock_');
    const isTestOrderNo = o.orderNo.includes('TEST') || o.user?.email.includes('test') || o.user?.username.includes('test');
    if (isMockTx) mockCount++;
    if (isTestOrderNo) testPrefixCount++;
    
    // 检查是否有真实微信回调特征 (检查是否来自微信真实回调，比如支付日志记录)
    const hasWechatLog = o.payments.some(p => p.rawNotification && !p.rawNotification.includes('MOCK') && !p.rawNotification.includes('mock'));
    if (hasWechatLog) hasRealWechatWebhook++;
  }
  console.log(`  * 带有 MOCK_ 前缀交易号: ${mockCount} 笔`);
  console.log(`  * 属于测试账号或含 TEST 订单号: ${testPrefixCount} 笔`);
  console.log(`  * 真实公网微信回调记录: ${hasRealWechatWebhook} 笔`);

  // 抽查 5 笔支付记录的 payments 详情
  console.log('\n  抽查 5 笔已支付订单的详细交易流水:');
  for (const o of paidOrders.slice(0, 5)) {
    console.log(`    - 订单号: ${o.orderNo}, 金额: ${(o.totalAmountFen/100).toFixed(2)}元, 交易号: ${o.transactionId}, 渠道: ${o.payChannel}, 用户: ${o.user?.email}, payments数: ${o.payments.length}`);
    for (const p of o.payments) {
      console.log(`      * PaymentLog id: ${p.id}, status: ${p.status}, rawNotification: ${p.rawNotification?.slice(0, 80)}`);
    }
  }

  // 3. 用户与会员权益
  console.log('\n--- 3. 用户与会员权益 ---');
  const totalAdminUsers = await prisma.user.count();
  const totalMemberUsers = await prisma.memberUser.count();
  const testMemberUsers = await prisma.memberUser.count({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { username: { contains: 'test' } }
      ]
    }
  });
  const totalEntitlements = await prisma.entitlement.count();
  const activeEntitlements = await prisma.entitlement.count({ where: { status: 'ACTIVE' } });
  console.log(`管理员账号 (User): ${totalAdminUsers}`);
  console.log(`普通前台会员 (MemberUser): ${totalMemberUsers} (其中测试特征账号: ${testMemberUsers})`);
  console.log(`会员权益总计 (Entitlement): ${totalEntitlements} (有效 ACTIVE: ${activeEntitlements})`);

  // 4. 审核证据与数据来源
  console.log('\n--- 4. 审核证据与数据来源 ---');
  const totalEvidences = await prisma.resourceReviewEvidence.count();
  const notScannedCount = await prisma.resourceReviewEvidence.count({ where: { observedValue: 'NOT_SCANNED' } });
  const notCheckedCount = await prisma.resourceReviewEvidence.count({ where: { observedValue: 'NOT_CHECKED' } });
  const verifiedDomainCount = await prisma.resourceReviewEvidence.count({ where: { fieldName: 'officialDomainVerified', observedValue: 'true' } });
  console.log(`审核证据凭据总数 (ResourceReviewEvidence): ${totalEvidences}`);
  console.log(`  - NOT_SCANNED 标记数: ${notScannedCount}`);
  console.log(`  - NOT_CHECKED 标记数: ${notCheckedCount}`);
  console.log(`  - officialDomainVerified=true 标记数: ${verifiedDomainCount}`);

  const totalSources = await prisma.softwareSource.count();
  const totalDownloadSources = await prisma.downloadSource.count();
  console.log(`官方数据来源 (SoftwareSource): ${totalSources}`);
  console.log(`下载分发渠道 (DownloadSource): ${totalDownloadSources}`);

  // 5. 开发者生态与社区
  console.log('\n--- 5. 开发者生态与社区 ---');
  const totalDevelopers = await prisma.developerProfile.count();
  const verifiedDevelopers = await prisma.developerProfile.count({ where: { verificationStatus: 'VERIFIED' } });
  const totalClaims = await prisma.softwareClaim.count();
  const approvedClaims = await prisma.softwareClaim.count({ where: { status: 'VERIFIED' } });
  const totalThreads = await prisma.discussionThread.count();
  const totalPosts = await prisma.discussionPost.count();
  const totalReports = await prisma.discussionReport.count();
  const totalApiKeys = await prisma.developerApiKey.count();
  const totalApiLogs = await prisma.apiUsageRecord.count();
  console.log(`开发者档案: ${totalDevelopers} (已认证: ${verifiedDevelopers})`);
  console.log(`软件认领申请: ${totalClaims} (已批准: ${approvedClaims})`);
  console.log(`社区讨论主题: ${totalThreads}, 回复贴: ${totalPosts}, 举报: ${totalReports}`);
  console.log(`开放 API Key: ${totalApiKeys}, API 调用日志: ${totalApiLogs}`);

  // 6. 运营内容资产
  console.log('\n--- 6. 运营内容资产 ---');
  const totalTopics = await prisma.topic.count();
  const totalTutorials = await prisma.tutorial.count();
  const publishedTutorials = await prisma.tutorial.count({ where: { status: 'PUBLISHED' } });
  const totalComparisons = await prisma.softwareComparison.count();
  const publishedComparisons = await prisma.softwareComparison.count({ where: { status: 'PUBLISHED' } });
  console.log(`专题合集 (Topic): ${totalTopics}`);
  console.log(`教程文章 (Tutorial): ${totalTutorials} (已发布: ${publishedTutorials})`);
  console.log(`对比评测 (SoftwareComparison): ${totalComparisons} (已发布: ${publishedComparisons})`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('审计失败:', err);
  process.exit(1);
});
