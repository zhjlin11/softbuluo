import assert from 'assert';
import { PrismaClient, ResourceStatus, ResourceType, TopicStatus } from '@prisma/client';
import { buildApp } from '../src/app';

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

export async function runP87Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7 全站独立栏目与专题中心自动化验证套件');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  try {
    // -------------------------------------------------------------
    // 1. 电脑软件栏目 API 与多维筛选能力核验
    // -------------------------------------------------------------
    console.log('--- 1. 电脑软件栏目 API 与多维检索核验 ---');

    await it('1.1 /api/v1/resources 支持默认分页与基础结构', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?limit=5' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.success, '请求必须成功');
      assert(Array.isArray(json.data.items), 'items 必须为数组');
      assert.strictEqual(json.data.limit, 5);
      assert(json.data.total > 0, '资源总数必须大于 0');
    });

    await it('1.2 /api/v1/resources 支持按 type=SOFTWARE 过滤且排除测试数据', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=SOFTWARE&limit=10' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items.length > 0, '必须能读取到已发布软件');
      for (const item of json.data.items) {
        assert.strictEqual(item.type, 'SOFTWARE');
        assert.strictEqual(item.isTestData, false, '严禁测试数据向公开客户端泄露');
      }
    });

    await it('1.3 /api/v1/resources 支持按分类 Slug 过滤', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?categorySlug=office&limit=5' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(Array.isArray(json.data.items));
    });

    await it('1.4 /api/v1/resources 支持排序 (sort=popular / sort=latest / sort=name)', async () => {
      const popularRes = await app.inject({ method: 'GET', url: '/api/v1/resources?sort=popular&limit=5' });
      assert.strictEqual(popularRes.statusCode, 200);
      const latestRes = await app.inject({ method: 'GET', url: '/api/v1/resources?sort=latest&limit=5' });
      assert.strictEqual(latestRes.statusCode, 200);
      const nameRes = await app.inject({ method: 'GET', url: '/api/v1/resources?sort=name&limit=5' });
      assert.strictEqual(nameRes.statusCode, 200);
    });

    await it('1.5 /api/v1/resources 支持关键词检索 (search / q)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?search=code' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items.length > 0, '检索 "code" 必须找到匹配软件');
    });

    // -------------------------------------------------------------
    // 2. 系统工具栏目与维护排障核验
    // -------------------------------------------------------------
    console.log('\n--- 2. 系统工具栏目与维护排障核验 ---');

    await it('2.1 /api/v1/resources?type=TOOL 正确返回维护类工具', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=TOOL&limit=20' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items.length > 0, '必须收录有系统维护类工具');
      for (const item of json.data.items) {
        assert.strictEqual(item.type, 'TOOL');
      }
    });

    await it('2.2 系统工具包含官方原厂安装包与来源已核验标记', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=TOOL&limit=10' });
      const json = JSON.parse(res.payload);
      for (const item of json.data.items) {
        assert(item.officialSiteUrl, '必须包含官方来源链接');
        assert(item.sourceStatus, '必须包含来源核验状态');
      }
    });

    // -------------------------------------------------------------
    // 3. 游戏中心栏目核验
    // -------------------------------------------------------------
    console.log('\n--- 3. 游戏中心栏目核验 ---');

    await it('3.1 /api/v1/resources?type=GAME 返回开源与精品单机游戏', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items.length > 0, '必须收录有经典游戏');
      for (const g of json.data.items) {
        assert.strictEqual(g.type, 'GAME');
        assert(g.name, '游戏必须具有有效名称');
      }
    });

    // -------------------------------------------------------------
    // 4. 最新更新栏目 (严格区分收录与版本迭代)
    // -------------------------------------------------------------
    console.log('\n--- 4. 最新更新栏目与流水线核验 ---');

    await it('4.1 /api/v1/versions/feed 正确返回版本演进动态流水', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/versions/feed?limit=10' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.success);
      assert(Array.isArray(json.data.items));
      assert(json.data.items.length > 0, '必须有版本更新流水');
      const sample = json.data.items[0];
      assert(sample.version, '必须有版本号 (如 1.96.2)');
      assert(sample.releaseDate, '必须包含官方发版日期 releaseDate');
      assert(sample.changelog, '必须包含更新日志说明');
      assert(sample.software?.name, '必须关联具体软件名称');
      assert(sample.software?.slug, '必须提供软件直达 slug');
    });

    await it('4.2 /api/v1/versions/feed 支持 platform 筛选', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/versions/feed?platform=windows&limit=5' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.items.length > 0);
    });

    // -------------------------------------------------------------
    // 5. 软件教程栏目与图文实操核验
    // -------------------------------------------------------------
    console.log('\n--- 5. 软件教程与深度实操核验 ---');

    await it('5.1 /api/v1/tutorials 获取教程公开列表与分页', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/tutorials?limit=5' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.success);
      assert(Array.isArray(json.data));
      assert(json.data.length > 0, '必须收录有教程');
      assert(json.pagination.total > 0, '总数必须大于 0');
    });

    await it('5.2 /api/v1/tutorials/:slug 正确获取教程详情并累加阅读数', async () => {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/tutorials?limit=1' });
      const first = JSON.parse(listRes.payload).data[0];
      assert(first?.slug, '必须有可用教程 slug');

      const detailRes = await app.inject({ method: 'GET', url: `/api/v1/tutorials/${first.slug}` });
      assert.strictEqual(detailRes.statusCode, 200);
      const json = JSON.parse(detailRes.payload);
      assert.strictEqual(json.data.title, first.title);
      assert(json.data.viewCount >= 0, '阅读量字段必须有效');
    });

    // -------------------------------------------------------------
    // 6. 软件专题中心核验 (对标华军软件园 /zt/)
    // -------------------------------------------------------------
    console.log('\n--- 6. 软件专题中心 (对标成熟门户) 核验 ---');

    await it('6.1 /api/v1/topics 获取专题合集列表与关联数量统计', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/topics' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.success);
      assert(Array.isArray(json.data));
      assert(json.data.length >= 10, '专题合集库必须拥有丰富专题数量 (>=10)');
      for (const t of json.data) {
        assert(t.title, '专题必须有标题');
        assert(t.slug, '专题必须有 slug');
        assert(typeof t._count?.resources === 'number', '必须包含关联软件数');
      }
    });

    await it('6.2 /api/v1/topics/:slug 正确获取专题详情与关联软件列表', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/topics/win11-essential-tools' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.success);
      assert.strictEqual(json.data.slug, 'win11-essential-tools');
      assert(Array.isArray(json.data.softwares), '专题下必须有软件列表');
      assert(json.data.softwares.length > 0, '装机必备专题必须关联有实际软件');
    });

    // -------------------------------------------------------------
    // 7. 分类索引与前台导航配置核验
    // -------------------------------------------------------------
    console.log('\n--- 7. 分类索引与导航结构核验 ---');

    await it('7.1 /api/v1/categories 正确返回全站分类及可用软件数量', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/categories' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.data.length, 10, '必须包含 10 个系统分类');
    });

  } finally {
    await app.close();
    await prisma.$disconnect();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7 测试执行完毕: 通过: ${passed} | 失败: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// 直接脚本调用入口
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('p87NavigationPagesTest')) {
  runP87Tests().catch((err) => {
    console.error('P8.7 测试执行异常:', err);
    process.exit(1);
  });
}
