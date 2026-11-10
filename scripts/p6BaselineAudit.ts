import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('==============================================');
  console.log(' P6-0: 开始基线审计与可靠数据库备份');
  console.log('==============================================');

  const backupsDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const dumpPath = path.join(backupsDir, 'backup_pre_p6.dump');
  console.log(`执行 pg_dump 备份到: ${dumpPath}`);
  
  // 执行 pg_dump
  let pgDumpCmd = `pg_dump -h localhost -p 5432 -U postgres -d softbuluo -F c -b -v -f "${dumpPath}"`;
  const defaultPgDump = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
  if (fs.existsSync(defaultPgDump)) {
    pgDumpCmd = `"${defaultPgDump}" -h localhost -p 5432 -U postgres -d softbuluo -F c -b -v -f "${dumpPath}"`;
  }
  try {
    execSync(pgDumpCmd, {
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'postgres' },
      stdio: 'pipe'
    });
    const stat = fs.statSync(dumpPath);
    console.log(`[PASS] pg_dump 备份成功! 大小: ${stat.size.toLocaleString()} bytes`);
  } catch (err: any) {
    console.error('[FAIL] pg_dump 备份异常:', err.message);
  }

  // 审计当前数据基线
  const softwareTotal = await prisma.software.count();
  const softwarePublished = await prisma.software.count({ where: { status: 'PUBLISHED' } });
  const softwareDraft = await prisma.software.count({ where: { status: 'DRAFT' } });
  const softwarePending = await prisma.software.count({ where: { status: 'PENDING_REVIEW' } });
  const softwareTest = await prisma.software.count({ where: { isTestData: true } });
  const categoriesCount = await prisma.category.count();
  const officialSourcesCount = await prisma.softwareSource.count();
  const downloadSourcesCount = await prisma.downloadSource.count();
  const ordersCount = await prisma.order.count();
  const adminUsersCount = await prisma.user.count();
  const memberUsersCount = await prisma.memberUser.count();
  const topicsCount = await prisma.topic.count();
  const tutorialsCount = await prisma.tutorial.count();
  const comparisonsCount = await prisma.softwareComparison.count();
  const reviewsCount = await (prisma as any).softwareReview ? await (prisma as any).softwareReview.count() : 0;

  // 审计当前数据完整性状态分布
  const integrityGroups = await prisma.software.groupBy({
    by: ['dataIntegrityStatus'],
    _count: { id: true }
  });

  // 审计当前 HostedFile 安全扫描与数字签名真实记录
  const hostedFilesTotal = await prisma.hostedFile.count();
  const hostedFilesScanned = await prisma.hostedFile.count({ where: { scanStatus: 'CLEAN' } });
  const signaturesValid = await prisma.signatureVerification.count({ where: { signatureStatus: 'VALID' } });

  console.log('\n--- 数据库实际记录数量盘点 ---');
  console.log(`软件总数: ${softwareTotal} 款 (PUBLISHED: ${softwarePublished}, DRAFT: ${softwareDraft}, PENDING: ${softwarePending}, 测试标记: ${softwareTest})`);
  console.log(`分类数: ${categoriesCount} 个`);
  console.log(`官方来源: ${officialSourcesCount} 个`);
  console.log(`下载源: ${downloadSourcesCount} 条`);
  console.log(`历史订单: ${ordersCount} 笔 (必须完好保留)`);
  console.log(`管理员账户: ${adminUsersCount} 名`);
  console.log(`会员用户数: ${memberUsersCount} 名`);
  console.log(`专题数: ${topicsCount} 个`);
  console.log(`教程数: ${tutorialsCount} 篇`);
  console.log(`对比数: ${comparisonsCount} 篇`);
  console.log(`真实评价数: ${reviewsCount} 条`);

  console.log('\n--- 数据质量完整性分布 ---');
  for (const g of integrityGroups) {
    console.log(`- ${g.dataIntegrityStatus}: ${g._count.id} 款`);
  }

  console.log('\n--- 安全认证现状审计 (P6-A2 审计对象) ---');
  console.log(`HostedFile 真实物理文件记录总数: ${hostedFilesTotal}`);
  console.log(`HostedFile 真实标记 CLEAN 的文件数: ${hostedFilesScanned}`);
  console.log(`SignatureVerification 真实 VALID 签名数: ${signaturesValid}`);
  console.log(`注意: 历史接口中当无 HostedFile 时曾默认回退到 CLEAN，需在 P6-A2 中彻底修正为 NOT_SCANNED！`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
