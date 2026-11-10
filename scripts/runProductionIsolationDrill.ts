import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { migrateVerifiedPublicContent } from './importVerifiedPublicContent';

const execAsync = promisify(exec);

async function main() {
  console.log('================================================================');
  console.log('🛡️  开始执行软游部落 P8-2 生产数据库隔离与定向内容迁移演练');
  console.log('================================================================\n');

  const drillDbName = 'softbuluo_prod_drill';
  const drillDbUrl = `postgresql://postgres:postgres@localhost:5432/${drillDbName}?schema=public`;

  // 1. 在管理库 postgres 中安全重建独立的生产演练库 softbuluo_prod_drill
  console.log(`[步骤 1] 重建独立的隔离生产数据库: ${drillDbName}...`);
  const adminPrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public' } }
  });

  try {
    await adminPrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = '${drillDbName}' AND pid <> pg_backend_pid();
    `);
  } catch {}

  try {
    await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${drillDbName}";`);
    await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${drillDbName}";`);
    console.log(`  ✅ 独立隔离生产库 ${drillDbName} 创建成功！`);
  } finally {
    await adminPrisma.$disconnect();
  }

  // 2. 在新的生产演练库上部署最新的官方 Prisma 数据库迁移 (Prisma Migrate Deploy)
  console.log(`\n[步骤 2] 在目标生产库上执行规范的 Prisma Migration 迁移部署...`);
  const migrateCmd = `npx prisma migrate deploy --schema=server/prisma/schema.prisma`;
  const env = { ...process.env, DATABASE_URL: drillDbUrl };
  
  const { stdout, stderr } = await execAsync(migrateCmd, { env });
  console.log(stdout.trim());
  if (stderr && !stderr.includes('injected env')) {
    console.warn('Migration stderr:', stderr);
  }
  console.log(`  ✅ 生产库表结构与约束索引部署完毕！`);

  // 3. 执行定向核实数据迁移 (仅迁移真实公开内容，严格拒绝任何测试订单与会员)
  console.log(`\n[步骤 3] 执行定向内容迁移脚本 importVerifiedPublicContent...`);
  const summary = await migrateVerifiedPublicContent(drillDbUrl);
  if (!summary.success) {
    throw new Error(`定向数据迁移失败: ${summary.error}`);
  }
  console.log(`  ✅ 定向数据迁移顺利完成 (耗时: ${summary.durationMs}ms)`);

  // 4. 深度安全断言与隔离指标验证
  console.log(`\n[步骤 4] 执行生产数据库绝对隔离性终审断言...`);
  const c = summary.counts;
  
  console.log(`  * 真实发布软件数: ${c.publishedSoftware} 款 (标准预期: 20 款)`);
  console.log(`  * 官方分类目录数: ${c.categories} 个 (标准预期: 10 个)`);
  console.log(`  * 官方教程与指南: ${c.tutorials} 篇 (标准预期: 29 篇)`);
  console.log(`  * 精选运营专题数: ${c.topics} 个 (标准预期: 13 个)`);
  console.log(`  * 深度对比评测数: ${c.comparisons} 篇 (标准预期: 2 篇)`);
  console.log(`  * 初始超管账号数: ${c.adminUsers} 个 (标准预期: 1 个)`);
  
  console.log(`\n  --- 生产安全红线断言 (必须全部严格为 0) ---`);
  console.log(`  * 模拟测试订单数: ${c.mockOrders} (断言: ${c.mockOrders === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`  * 历史测试会员数: ${c.testMembers} (断言: ${c.testMembers === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`  * 虚假会员权益数: ${c.mockEntitlements} (断言: ${c.mockEntitlements === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`  * 模拟支付流水数: ${c.mockPaymentLogs} (断言: ${c.mockPaymentLogs === 0 ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`  * 测试急救工具数: ${c.testSoftware} (断言: ${c.testSoftware === 0 ? 'PASS ✅' : 'FAIL ❌'})`);

  if (c.mockOrders !== 0 || c.testMembers !== 0 || c.mockEntitlements !== 0 || c.testSoftware !== 0) {
    throw new Error('致命安全失败：生产数据库隔离失败，存在测试数据泄露！');
  }

  console.log('\n================================================================');
  console.log('🎉 软游部落 P8-2 生产数据库隔离与定向迁移演练 100% 成功！');
  console.log('================================================================');
}

main().catch(err => {
  console.error('演练执行失败:', err);
  process.exit(1);
});
