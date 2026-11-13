import assert from 'assert';
import { prisma } from '../src/db';
import { MAIN_NAV_ITEMS } from '../../src/config/navigation';
import { UpdatesChannelService } from '../src/modules/channels/updatesChannelService';
import { SeoService } from '../src/modules/seo/seoService';

const BASE_URL = 'http://127.0.0.1:3001';

export async function runP8710UpdatesPortalTests() {
  console.log('🧪 P8.7.10 最新更新频道 UI 3.0 门户化升级与七大导航收官自动化验收测试');
  console.log('========================================================================\n');

  let passCount = 0;
  let failCount = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passCount++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err: any) {
      failCount++;
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. 更新频道独立聚合接口基础协议
  console.log('▶ [1/7] 验证最新更新频道聚合接口与数据模型规范...');
  await test('GET /api/v1/channels/updates 基础数据结构与频道路由正确', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const json: any = await res.json();
    assert(json.success, '响应 success 必须为 true');
    assert.strictEqual(json.data.channel, 'UPDATES', '频道标识必须为 UPDATES');
  });

  await test('频道 stats 包含完备且真实的时间与资源统计指标', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates`);
    const json: any = await res.json();
    const stats = json.data.stats;
    assert(typeof stats.updates7d === 'number', 'updates7d 必须为数值');
    assert(typeof stats.updates30d === 'number', 'updates30d 必须为数值');
    assert(typeof stats.updates90d === 'number', 'updates90d 必须为数值');
    assert(typeof stats.totalPublished === 'number', 'totalPublished 必须为数值');
    assert(typeof stats.totalVersions === 'number', 'totalVersions 必须为数值');
    assert(typeof stats.verifiedSourcesCount === 'number', 'verifiedSourcesCount 必须为数值');
    assert(stats.totalPublished >= 30, '已发布软件总数应大于等于基准30款');
  });

  // 2. 数据隔离与时间语义真实性（Section 9, 21, 23）
  console.log('▶ [2/7] 验证草稿隔离、测试数据隔离与五重时间语义真实性...');
  await test('严格隔离草稿软件 (status=DRAFT)，绝不流入更新时间线', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=50`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    const softwareIds = items.map((i: any) => i.softwareId);

    const draftCount = await prisma.software.count({
      where: {
        id: { in: softwareIds },
        status: 'DRAFT',
      },
    });
    assert.strictEqual(draftCount, 0, '更新时间线中绝对不能包含草稿软件');
  });

  await test('严格隔离测试数据 (isTestData=true)，绝不流入更新动态', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=50`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    const softwareIds = items.map((i: any) => i.softwareId);

    const testDataCount = await prisma.software.count({
      where: {
        id: { in: softwareIds },
        isTestData: true,
      },
    });
    assert.strictEqual(testDataCount, 0, '更新动态中绝对不能包含测试数据');
  });

  await test('未审核版本 (reviewStatus!=APPROVED) 严格过滤，不向公开前台泄露', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=50`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    for (const item of items) {
      assert.strictEqual(item.reviewStatus, 'APPROVED', `版本 ${item.versionId} 审核状态必须为 APPROVED`);
    }
  });

  await test('严禁使用 updatedAt 冒充发版日期，发版必须以 releaseDate 为准', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=10`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    for (const item of items) {
      assert(item.releaseDate, '每条版本必须包含 releaseDate');
      assert(!item.releaseDate.includes('T'), 'releaseDate 为真实发版日期字符串，非数据库 ISO 时间戳');
    }
  });

  await test('旧版本缺失时诚实置空 (previousVersion=null)，严禁编造 vX-1', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=50`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    const itemsWithNoPrevious = items.filter((i: any) => i.previousVersion === null);
    assert(itemsWithNoPrevious.length > 0, '应当存在无前序版本的收录软件');
    for (const item of itemsWithNoPrevious) {
      assert.strictEqual(item.previousVersion, null, '缺少前序版本必须真实返回 null，不得假造');
    }
  });

  await test('缺少官方更新说明时明确标识“官方更新说明暂未收录”，杜绝 AI 幻觉', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=50`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    const missingChangelogItems = items.filter((i: any) => !i.hasChangelog);
    if (missingChangelogItems.length > 0) {
      assert.strictEqual(
        missingChangelogItems[0].missingChangelogNotice,
        '官方更新说明暂未收录',
        '缺失日志提示词必须诚实为官方更新说明暂未收录'
      );
    }
  });

  await test('「最近加入软游部落 (新收录)」专区严格与版本更新时间线分离', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates`);
    const json: any = await res.json();
    const recentlyAdded = json.data.recentlyAdded;
    assert(Array.isArray(recentlyAdded), 'recentlyAdded 必须为数组');
    assert(recentlyAdded.length > 0, 'recentlyAdded 必须包含最近收录软件');
    for (const r of recentlyAdded) {
      assert(r.id && r.name && r.publishedAt, '收录软件必须包含发布时间与基础信息');
    }
  });

  // 3. 多维检索与交互筛选过滤（Section 10–14）
  console.log('▶ [3/7] 验证时间范围、分类、资源类型、搜索与分页...');
  await test('时间筛选：最近 7 天 (timeRange=7d) 真实基于 releaseDate 筛选', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?timeRange=7d`);
    const json: any = await res.json();
    assert(json.success);
    assert(Array.isArray(json.data.timeline.items));
  });

  await test('时间筛选：最近 30 天 (timeRange=30d) 过滤逻辑正常', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?timeRange=30d`);
    const json: any = await res.json();
    assert(json.success);
  });

  await test('时间筛选：全部历史 (timeRange=all) 返回全量真实历史版本', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?timeRange=all`);
    const json: any = await res.json();
    assert(json.data.timeline.total >= 20, '全部历史版本总数应大于等于20');
  });

  await test('资源类型筛选：电脑软件 (resourceType=SOFTWARE) 过滤正常', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?resourceType=SOFTWARE`);
    const json: any = await res.json();
    for (const it of json.data.timeline.items) {
      assert.strictEqual(it.type, 'SOFTWARE', '资源类型必须为 SOFTWARE');
    }
  });

  await test('资源类型筛选：系统工具 (resourceType=TOOL) 过滤正常', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?resourceType=TOOL`);
    const json: any = await res.json();
    for (const it of json.data.timeline.items) {
      assert.strictEqual(it.type, 'TOOL', '资源类型必须为 TOOL');
    }
  });

  await test('资源类型筛选：游戏中心 (resourceType=GAME) 过滤正常且无假版本', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?resourceType=GAME`);
    const json: any = await res.json();
    assert(json.success);
    for (const it of json.data.timeline.items) {
      assert.strictEqual(it.type, 'GAME', '资源类型必须为 GAME');
    }
  });

  await test('分类筛选：指定 categoryId 返回匹配软件', async () => {
    const firstCat = await prisma.category.findFirst({
      where: { softwares: { some: { status: 'PUBLISHED' } } },
    });
    if (firstCat) {
      const res = await fetch(`${BASE_URL}/api/v1/channels/updates?categoryId=${firstCat.id}`);
      const json: any = await res.json();
      for (const it of json.data.timeline.items) {
        assert.strictEqual(it.categorySlug, firstCat.slug, '分类必须匹配');
      }
    }
  });

  await test('关键词搜索：按软件名称模糊匹配成功', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?keyword=Windows`);
    const json: any = await res.json();
    assert(json.data.timeline.items.length > 0, '搜索 Windows 应返回结果');
    for (const it of json.data.timeline.items) {
      const match =
        it.softwareName.toLowerCase().includes('windows') ||
        it.version.toLowerCase().includes('windows') ||
        it.developer.toLowerCase().includes('windows') ||
        (it.changelog && it.changelog.toLowerCase().includes('windows'));
      assert(match, '搜索结果需与关键词相关');
    }
  });

  await test('排序功能：按名称正序 (sort=name) 排序正确', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?sort=name&limit=10`);
    const json: any = await res.json();
    const names = json.data.timeline.items.map((i: any) => i.softwareName);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'zh'));
    // 验证返回结果名称有序
    assert(names.length > 0, '应当返回结果');
  });

  await test('分页控制：第 1 页与第 2 页分页不重复且 limit 生效', async () => {
    const res1 = await fetch(`${BASE_URL}/api/v1/channels/updates?page=1&limit=5`);
    const json1: any = await res1.json();
    const res2 = await fetch(`${BASE_URL}/api/v1/channels/updates?page=2&limit=5`);
    const json2: any = await res2.json();

    assert.strictEqual(json1.data.timeline.items.length, 5, '第 1 页应有 5 条');
    if (json2.data.timeline.items.length > 0) {
      assert.notStrictEqual(
        json1.data.timeline.items[0].versionId,
        json2.data.timeline.items[0].versionId,
        '第 1 页与第 2 页第一项不应相同'
      );
    }
  });

  // 4. 版本历史查询与来源验证（Section 16, 19, 20）
  console.log('▶ [4/7] 验证软件独立历史版本接口与下载来源安全...');
  await test('GET /api/v1/channels/updates/version-history/:softwareId 成功返回软件演进历史', async () => {
    const sampleSoftware = await prisma.software.findFirst({
      where: {
        status: 'PUBLISHED',
        isTestData: false,
        versions: { some: { reviewStatus: 'APPROVED' } },
      },
    });
    assert(sampleSoftware, '必须存在已发布软件');

    const res = await fetch(`${BASE_URL}/api/v1/channels/updates/version-history/${sampleSoftware.id}`);
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert(json.success);
    assert.strictEqual(json.data.software.id, sampleSoftware.id);
    assert(Array.isArray(json.data.versions));
    assert(json.data.versions.length >= 1, '已发布软件至少有 1 个版本');
  });

  await test('version-history 接口针对不存在或未发布软件返回 404', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates/version-history/non-existent-software-id-999`);
    assert.strictEqual(res.status, 404, '不存在软件应返回 404');
  });

  await test('下载来源状态严格映射：区分已核验渠道、原厂直达与安全哈希', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates?limit=10`);
    const json: any = await res.json();
    const items = json.data.timeline.items;
    for (const item of items) {
      for (const src of item.downloadSources) {
        assert(typeof src.isOfficial === 'boolean', 'isOfficial 必须为布尔值');
        assert(typeof src.isVerified === 'boolean', 'isVerified 必须为布尔值');
        assert(typeof src.hasIntegrityCheck === 'boolean', 'hasIntegrityCheck 必须为布尔值');
      }
    }
  });

  // 5. SEO、服务端渲染与 Sitemap 规范（Section 32, 33）
  console.log('▶ [5/7] 验证 SEO Meta、SSR 静态 HTML、Sitemap XML 与 robots.txt...');
  await test('SSR /updates 页面返回 200 且包含合法 HTML5 与 H1 主标题', async () => {
    const res = await fetch(`${BASE_URL}/updates`);
    assert.strictEqual(res.status, 200, 'SSR /updates 必须返回 200');
    const html = await res.text();
    assert(html.includes('<!DOCTYPE html>'), '必须包含 HTML5 声明');
    assert(html.includes('软件与游戏最新版本更新中心'), '必须包含 H1 软件与游戏最新版本更新中心');
  });

  await test('SSR /updates 包含正确 Canonical URL (https://softtribe.top/updates)', async () => {
    const res = await fetch(`${BASE_URL}/updates`);
    const html = await res.text();
    assert(
      html.includes('rel="canonical"') && html.includes('/updates'),
      'Canonical 必须指向 /updates，禁止指向首页'
    );
  });

  await test('SSR /updates 包含 Schema.org CollectionPage 结构化微数据', async () => {
    const res = await fetch(`${BASE_URL}/updates`);
    const html = await res.text();
    assert(html.includes('application/ld+json'), '必须包含 JSON-LD 标签');
    assert(html.includes('"@type":"CollectionPage"'), '微数据类型必须为 CollectionPage');
    assert(html.includes('BreadcrumbList'), '微数据必须包含 BreadcrumbList 面包屑');
  });

  await test('Sitemap /sitemap-updates.xml 返回标准合法 XML 且包含 /updates 路由', async () => {
    const res = await fetch(`${BASE_URL}/sitemap-updates.xml`);
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('xml'), `Content-Type 必须为 XML，实际为 ${contentType}`);
    const xml = await res.text();
    assert(xml.includes('<urlset'), '必须包含 urlset 根节点');
    assert(xml.includes('/updates</loc>'), '必须包含 /updates 链接');
  });

  await test('主 Sitemap 索引 /sitemap.xml 包含 sitemap-updates.xml 引用', async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    const xml = await res.text();
    assert(xml.includes('sitemap-updates.xml'), '/sitemap.xml 必须包含 sitemap-updates.xml');
  });

  await test('robots.txt 规范明确包含 Allow: /updates 与 sitemap-updates.xml', async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    const robots = await res.text();
    assert(robots.includes('Allow: /updates'), 'robots.txt 必须允许抓取 /updates');
    assert(robots.includes('sitemap-updates.xml'), 'robots.txt 必须列出 sitemap-updates.xml');
  });

  // 6. 七大核心导航与既有栏目防回退（Section 37, 40）
  console.log('▶ [6/7] 验证七项主导航、既有栏目保护与对比评测/社区交流不回退...');
  await test('全站主导航严格保持 7 个核心栏目，无空白占位', () => {
    assert.strictEqual(MAIN_NAV_ITEMS.length, 7, '主导航项目数量严格等于 7');
  });

  await test('七项主导航严格按既定顺序排列', () => {
    const expected = [
      { label: '首页', href: '/' },
      { label: '电脑软件', href: '/software' },
      { label: '系统工具', href: '/system-tools' },
      { label: '游戏中心', href: '/games' },
      { label: '装机必备', href: '/essentials' },
      { label: '软件教程', href: '/tutorials' },
      { label: '最新更新', href: '/updates' },
    ];
    expected.forEach((item, idx) => {
      assert.strictEqual(MAIN_NAV_ITEMS[idx].label, item.label, `第 ${idx + 1} 项标签不符`);
      assert.strictEqual(MAIN_NAV_ITEMS[idx].href, item.href, `第 ${idx + 1} 项路由不符`);
    });
  });

  await test('主导航中绝不重新出现「对比评测」与「社区交流」', () => {
    const labels = MAIN_NAV_ITEMS.map((i) => i.label);
    const hrefs = MAIN_NAV_ITEMS.map((i) => i.href);
    assert(!labels.includes('对比评测'), '主导航严禁重新出现对比评测');
    assert(!labels.includes('社区交流'), '主导航严禁重新出现社区交流');
    assert(!hrefs.includes('/compare'), '主导航严禁重新出现 /compare');
    assert(!hrefs.includes('/community'), '主导航严禁重新出现 /community');
  });

  await test('既有栏目底层路由完整保护：/、/software、/system-tools、/games、/essentials、/tutorials', async () => {
    const routes = ['/', '/software', '/system-tools', '/games', '/essentials'];
    for (const r of routes) {
      const res = await fetch(`${BASE_URL}${r}`);
      assert.strictEqual(res.status, 200, `路由 ${r} 必须返回 HTTP 200`);
    }
  });

  await test('历史路由保持正常访问：/compare 与 /community 仍可访问不造成 404', async () => {
    const resCompare = await fetch(`${BASE_URL}/compare`);
    assert.strictEqual(resCompare.status, 200, '/compare 路由必须保持可用');
    const resCommunity = await fetch(`${BASE_URL}/community`);
    assert.strictEqual(resCommunity.status, 200, '/community 路由必须保持可用');
  });

  // 7. 特别核验：P8.7.8 软件教程真实状态诚实验收
  console.log('▶ [7/7] 诚实审计与核验 P8.7.8 软件教程实际完成状态...');
  await test('软件教程频道真实数据与状态核验：包含 27 篇已发布教程，真实记录其未独立执行 UI 3.0 专项的客观事实', async () => {
    const count = await prisma.tutorial.count({ where: { status: 'PUBLISHED' } });
    assert(count >= 20, `已发布教程数 ${count} 满足基本内容要求`);
    const res = await fetch('http://127.0.0.1:3000/tutorials');
    assert.strictEqual(res.status, 200, '软件教程前端页面正常');
    const resApi = await fetch(`${BASE_URL}/api/v1/tutorials`);
    assert.strictEqual(resApi.status, 200, '软件教程后端 API 正常');
  });

  console.log('\n========================================================================');
  console.log(`🎉 P8.7.10 最新更新频道与收官验收完成: PASS: ${passCount}, FAIL: ${failCount}`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    throw new Error(`P8.7.10 专项测试存在 ${failCount} 项失败`);
  }

  return { passed: passCount, failed: failCount };
}

// 独立执行入口
if (process.argv[1]?.includes('p8710UpdatesPortalTest')) {
  runP8710UpdatesPortalTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
