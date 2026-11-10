import assert from 'assert';
import { PrismaClient, ReviewStatus, DiscussionStatus } from '@prisma/client';
import { buildApp } from '../src/app';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

async function it(desc: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${desc}:`, err.message);
    failed++;
  }
}

export async function runP85Tests() {
  console.log('================================================================');
  console.log('🚀 开始执行软游部落 P8.5 全站质量验收与全业务闭环回归测试');
  console.log('================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  // 测试中需要清理的临时数据 ID
  const cleanupUserIds: string[] = [];
  const cleanupReviewIds: string[] = [];
  const cleanupThreadIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // 维度 1: 核心路由与修复后 API 接口可达性核验
    // -------------------------------------------------------------
    console.log('--- 1. 核心路由与修复后 API 接口可达性核验 ---');

    await it('1.1 首页聚合接口正常返回推荐与合集 (GET /api/v1/home)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/home' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.featured, '必须包含精选软件');
      assert(json.data.categories, '必须包含分类列表');
    });

    await it('1.2 分类列表与分类下资源检索接口正常 (GET /api/v1/categories)', async () => {
      const catRes = await app.inject({ method: 'GET', url: '/api/v1/categories' });
      assert.strictEqual(catRes.statusCode, 200);
      const json = JSON.parse(catRes.payload);
      assert(Array.isArray(json.data), '分类数据必须为数组');
      assert(json.data.length > 0, '分类数据不可为空');
      
      const resList = await app.inject({ method: 'GET', url: `/api/v1/resources?category=${json.data[0].slug}` });
      assert.strictEqual(resList.statusCode, 200);
    });

    await it('1.3 专题合集公开接口正常 (GET /api/v1/topics/win11-essential-tools)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/topics/win11-essential-tools' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.data.slug, 'win11-essential-tools');
      assert(Array.isArray(json.data.softwares), '专题内必须包含软件列表');
    });

    await it('1.4 软件横向对比公开接口正常 (GET /api/v1/comparisons/vscode-vs-sublime)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/comparisons/vscode-vs-sublime' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.data.slug, 'vscode-vs-sublime');
      assert(Array.isArray(json.data.attributes), '必须包含横向对比维度属性');
    });

    await it('1.5 开发者公开主页接口正常 (GET /api/v1/developers/dev-mw8zit6r)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/developers/dev-mw8zit6r' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.data.slug, 'dev-mw8zit6r');
      assert(json.data.displayName, '必须包含开发者昵称');
    });

    await it('1.6 开放 API 文档别名重定向与规范输出 (GET /api/docs -> 302 / OpenAPI 200)', async () => {
      const redirectRes = await app.inject({ method: 'GET', url: '/api/docs' });
      assert.strictEqual(redirectRes.statusCode, 302);
      assert.strictEqual(redirectRes.headers.location, '/developers/api');

      const openApiRes = await app.inject({ method: 'GET', url: '/api/public/v1/openapi.json' });
      assert.strictEqual(openApiRes.statusCode, 200);
      const spec = JSON.parse(openApiRes.payload);
      assert.strictEqual(spec.openapi, '3.0.3');
    });

    // -------------------------------------------------------------
    // 维度 2: 修复后的管理后台路由别名与业务接口测试
    // -------------------------------------------------------------
    console.log('\n--- 2. 修复后的管理后台路由别名与业务接口测试 ---');

    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { identifier: 'admin@softbuluo.com', password: 'Admin@123456' },
    });
    assert.strictEqual(adminLoginRes.statusCode, 200);
    const adminCookie = adminLoginRes.headers['set-cookie'];
    const adminHeader = { cookie: Array.isArray(adminCookie) ? adminCookie[0] : (adminCookie as string) };

    await it('2.1 后台运营待办别名接口正常 (GET /api/v1/admin/operations/pending-actions)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/operations/pending-actions',
        headers: adminHeader,
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data, '必须返回运营待办数据结构');
    });

    await it('2.2 后台 SEO 审计报告别名接口正常 (GET /api/v1/admin/seo/audit)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/seo/audit',
        headers: adminHeader,
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items !== undefined, '必须包含 SEO 审计报告列表');
    });

    await it('2.3 后台分析大盘概览聚合接口正常 (GET /api/v1/admin/analytics/overview)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics/overview',
        headers: adminHeader,
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.businessGrowth !== undefined, '必须包含商业增长统计数据');
      assert(json.data.traffic !== undefined, '必须包含流量趋势统计');
    });

    // -------------------------------------------------------------
    // 维度 3: 业务闭环与用户交互测试 (含自清理机制)
    // -------------------------------------------------------------
    console.log('\n--- 3. 业务闭环与用户交互测试 (严格测试数据自清理) ---');

    const testTime = Date.now();
    const testUser = await prisma.memberUser.create({
      data: {
        username: `tester_${testTime}`,
        email: `tester_${testTime}@softbuluo-qa.local`,
        passwordHash: 'mock_password_hash_for_test',
        status: 'ACTIVE',
      },
    });
    cleanupUserIds.push(testUser.id);

    await it('3.1 软件多维度检索与排序闭环', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/resources?q=code&sort=popularity&limit=5',
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(Array.isArray(json.data.items), '返回数据必须包含 items 数组');
    });

    await it('3.2 软件用户评价提交与合规审核流转闭环', async () => {
      const vscode = await prisma.software.findFirst({ where: { slug: 'vscode' } });
      assert(vscode, 'VS Code 必须存在');

      const review = await prisma.softwareReview.create({
        data: {
          softwareId: vscode.id,
          userId: testUser.id,
          rating: 5,
          title: '轻量高效的代码编辑器',
          content: '生态丰富，扩展插件极其完善，开发体验绝佳。占用内存控制良好。',
          versionUsed: '1.96.2',
          operatingSystem: 'Windows 11',
          status: ReviewStatus.PENDING_REVIEW,
          isTestReview: true,
        },
      });
      cleanupReviewIds.push(review.id);

      // 管理员审核通过
      const auditRes = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/reviews/${review.id}/status`,
        headers: adminHeader,
        payload: { status: 'APPROVED' },
      });
      assert.strictEqual(auditRes.statusCode, 200);

      const updated = await prisma.softwareReview.findUnique({ where: { id: review.id } });
      assert.strictEqual(updated?.status, 'APPROVED');
    });

    await it('3.3 社区交流讨论与特定软件专区发帖闭环', async () => {
      const vscode = await prisma.software.findFirst({ where: { slug: 'vscode' } });
      assert(vscode, 'VS Code 必须存在');

      const thread = await prisma.discussionThread.create({
        data: {
          softwareId: vscode.id,
          userId: testUser.id,
          title: 'P8.5 内测：VS Code 最新配置方案交流',
          content: '请教各位软友部落成员，针对 TypeScript 项目大家一般开启哪些优化设置？',
          status: DiscussionStatus.ACTIVE,
        },
      });
      cleanupThreadIds.push(thread.id);

      // 查询特定软件专区帖子
      const threadsRes = await app.inject({
        method: 'GET',
        url: `/api/v1/community/threads?software=vscode`,
      });
      assert.strictEqual(threadsRes.statusCode, 200);
      const json = JSON.parse(threadsRes.payload);
      assert(json.data.some((t: any) => t.id === thread.id), '新发主题必须出现在软件讨论专区');
    });

    // -------------------------------------------------------------
    // 维度 4: 安全复核与数据防盗链治理
    // -------------------------------------------------------------
    console.log('\n--- 4. 安全复核与数据防盗链治理 ---');

    await it('4.1 订单跨越鉴权防护 (匿名用户查阅他人订单返回 403/401)', async () => {
      const order = await prisma.order.findFirst();
      if (order) {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/orders/${order.orderNo}`,
        });
        assert(res.statusCode === 401 || res.statusCode === 403, `未授权查阅订单必须拦截，实际: ${res.statusCode}`);
      }
    });

    await it('4.2 软件库外链图片注入治理 (确保数据库软件 iconUrl 无失效外链)', async () => {
      const dangerousExternalIcons = await prisma.software.count({
        where: {
          OR: [
            { iconUrl: { contains: 'hwinfo.com' } },
            { iconUrl: { contains: 'videolan.org' } },
            { iconUrl: { contains: 'rufus.ie' } },
            { iconUrl: { contains: '7-zip.org' } },
          ],
        },
      });
      assert.strictEqual(dangerousExternalIcons, 0, '数据库中失效外链图标必须全部清洗');
    });

    await it('4.3 P8.5 自动化深度体检前置数据库备份文件真实存在', async () => {
      const backupDir = path.resolve(process.cwd(), 'backups');
      assert(fs.existsSync(backupDir), '备份目录必须存在');
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.dump'));
      assert(files.length > 0, '必须存在生产体检前置备份 dump 文件');
      const latestBackup = files.sort().reverse()[0];
      const stats = fs.statSync(path.join(backupDir, latestBackup));
      assert(stats.size > 200000, `备份文件必须有效 (>200KB)，实际: ${stats.size} 字节`);
    });

    await it('4.4 路由清单与缺陷登记文档完整性核验', async () => {
      const routeInv = path.resolve(process.cwd(), 'docs/P85_ROUTE_INVENTORY.md');
      assert(fs.existsSync(routeInv), 'P85_ROUTE_INVENTORY.md 必须存在');
      const issueReg = path.resolve(process.cwd(), 'docs/P85_ISSUE_REGISTER.md');
      assert(fs.existsSync(issueReg), 'P85_ISSUE_REGISTER.md 必须存在');
      const perfBase = path.resolve(process.cwd(), 'docs/P85_PERFORMANCE_BASELINE.md');
      assert(fs.existsSync(perfBase), 'P85_PERFORMANCE_BASELINE.md 必须存在');
    });

  } finally {
    // 严格清理测试创建的数据，防止主数据库受到任何污染
    console.log('\n--- 正在清理 P8.5 测试过程临时产生的数据 ---');
    if (cleanupReviewIds.length > 0) {
      await prisma.softwareReview.deleteMany({ where: { id: { in: cleanupReviewIds } } });
    }
    if (cleanupThreadIds.length > 0) {
      await prisma.discussionThread.deleteMany({ where: { id: { in: cleanupThreadIds } } });
    }
    if (cleanupUserIds.length > 0) {
      await prisma.memberUser.deleteMany({ where: { id: { in: cleanupUserIds } } });
    }
    console.log('✅ 测试临时数据清理完毕，主数据库完全零污染。');

    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n================================================================');
  console.log(`🎉 P8.5 全站质量与全业务闭环回归测试完成! PASS: ${passed} | FAIL: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// 允许命令行直接运行
if (process.argv[1] && process.argv[1].endsWith('p85QualityAssuranceTest.ts')) {
  runP85Tests().catch((err) => {
    console.error('P8.5 测试执行异常:', err);
    process.exit(1);
  });
}
