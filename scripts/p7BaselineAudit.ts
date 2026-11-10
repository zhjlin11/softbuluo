import { prisma } from '../server/src/db';
import fs from 'fs';
import path from 'path';
import { ResourceStatus, DeveloperVerificationStatus, ClaimStatus } from '@prisma/client';

async function main() {
  console.log('====================================================');
  console.log('🔍 软游部落 P7-0 完整工程与运行基线审计');
  console.log('====================================================\n');

  // 1. 软件资源统计
  const totalSoftware = await prisma.software.count();
  const publishedSoftware = await prisma.software.count({ where: { status: ResourceStatus.PUBLISHED } });
  const draftSoftware = await prisma.software.count({ where: { status: ResourceStatus.DRAFT } });
  const pendingSoftware = await prisma.software.count({ where: { status: ResourceStatus.PENDING_REVIEW } });
  const testSoftware = await prisma.software.count({ where: { isTestData: true } });

  // 2. 来源与下载
  const officialSources = await prisma.softwareSource.count();
  const downloadSources = await prisma.downloadSource.count();
  const hostedFiles = await prisma.hostedFile.count();
  const signatureVerifications = await prisma.signatureVerification.count();

  // 3. 真实审核凭据
  const reviewEvidences = await prisma.resourceReviewEvidence.count();

  // 4. 商业、会员与订单
  const totalOrders = await prisma.order.count();
  const paidOrders = await prisma.order.count({ where: { status: 'PAID' } });
  const totalMembers = await prisma.memberUser.count();
  const activeEntitlements = await prisma.entitlement.count({ where: { status: 'ACTIVE' } });
  const adminUsers = await prisma.user.count();

  // 5. 开发者与认领
  const devProfiles = await prisma.developerProfile.count();
  const verifiedDevs = await prisma.developerProfile.count({ where: { verificationStatus: DeveloperVerificationStatus.VERIFIED } });
  const totalClaims = await prisma.softwareClaim.count();
  const verifiedClaims = await prisma.softwareClaim.count({ where: { status: ClaimStatus.VERIFIED } });

  // 6. 社区互动与治理
  const totalThreads = await prisma.discussionThread.count();
  const totalPosts = await prisma.discussionPost.count();
  const pendingReports = await prisma.discussionReport.count({ where: { status: 'PENDING' } });

  // 7. 开放 API
  const totalApiKeys = await prisma.developerApiKey.count();
  const totalApiUsage = await prisma.apiUsageRecord.count();

  // 8. 运营内容
  const totalTopics = await prisma.topic.count();
  const totalTutorials = await prisma.tutorial.count();
  const totalComparisons = await prisma.softwareComparison.count();

  // 9. 备份文件盘点
  const backupDir = path.join(process.cwd(), 'backups');
  let backupFiles: string[] = [];
  if (fs.existsSync(backupDir)) {
    backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.dump') || f.endsWith('.sql'));
  }

  // 10. 部署配置文件
  const nginxExists = fs.existsSync(path.join(process.cwd(), 'deploy', 'nginx', 'softbuluo.conf'));
  const caddyExists = fs.existsSync(path.join(process.cwd(), 'deploy', 'caddy', 'Caddyfile'));
  const pm2Exists = fs.existsSync(path.join(process.cwd(), 'deploy', 'ecosystem.config.js'));

  console.log('【1. 软件资源底座】');
  console.log(`  - 资源总数: ${totalSoftware} 款`);
  console.log(`  - 已发布 (PUBLISHED): ${publishedSoftware} 款`);
  console.log(`  - 待审核草稿 (DRAFT): ${draftSoftware} 款`);
  console.log(`  - 审核中 (PENDING_REVIEW): ${pendingSoftware} 款`);
  console.log(`  - 隔离测试数据 (isTestData): ${testSoftware} 款`);
  console.log(`  - 官方来源登记: ${officialSources} 个`);
  console.log(`  - 下载来源链接: ${downloadSources} 条`);
  console.log(`  - 物理托管安装包 (HostedFile): ${hostedFiles} 条`);
  console.log(`  - 数字签名核验证明 (SignatureVerification): ${signatureVerifications} 条`);
  console.log(`  - 归档审核凭证 (ResourceReviewEvidence): ${reviewEvidences} 条\n`);

  console.log('【2. 会员、订单与权限底座】');
  console.log(`  - 注册会员总数: ${totalMembers} 名`);
  console.log(`  - 商业订单总数: ${totalOrders} 笔 (已支付: ${paidOrders} 笔)`);
  console.log(`  - 有效会员权益: ${activeEntitlements} 条`);
  console.log(`  - 管理员账号: ${adminUsers} 名\n`);

  console.log('【3. 开发者与社区生态】');
  console.log(`  - 开发者入驻申请: ${devProfiles} 个 (已官方认证: ${verifiedDevs} 个)`);
  console.log(`  - 软件所有权认领: ${totalClaims} 条 (已认证归属: ${verifiedClaims} 条)`);
  console.log(`  - 社区讨论主题: ${totalThreads} 篇`);
  console.log(`  - 社区回帖互动: ${totalPosts} 条`);
  console.log(`  - 待处理举报: ${pendingReports} 条\n`);

  console.log('【4. 开放 API 与运营资产】');
  console.log(`  - 开发者 API Key: ${totalApiKeys} 个 (历史调用日志: ${totalApiUsage} 条)`);
  console.log(`  - 精选专题: ${totalTopics} 个`);
  console.log(`  - 实用教程: ${totalTutorials} 篇`);
  console.log(`  - 软件对比评测: ${totalComparisons} 篇\n`);

  console.log('【5. 部署文件与备份资产】');
  console.log(`  - Nginx 生产配置: ${nginxExists ? '✅ 存在 (deploy/nginx/softbuluo.conf)' : '❌ 缺失'}`);
  console.log(`  - Caddy 生产配置: ${caddyExists ? '✅ 存在 (deploy/caddy/Caddyfile)' : '❌ 缺失'}`);
  console.log(`  - PM2 进程配置: ${pm2Exists ? '✅ 存在 (deploy/ecosystem.config.js)' : '❌ 缺失'}`);
  console.log(`  - 备份 Dump 清单: ${backupFiles.join(', ') || '暂无'}\n`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('基线审计失败:', err);
  process.exit(1);
});
