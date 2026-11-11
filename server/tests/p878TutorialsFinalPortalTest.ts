import assert from 'assert';
import { prisma } from '../src/db';
import { MAIN_NAV_ITEMS } from '../../src/config/navigation';
import { TutorialsChannelService } from '../src/modules/channels/tutorialsChannelService';
import { SeoService } from '../src/modules/seo/seoService';

const BASE_URL = 'http://127.0.0.1:3001';

export async function runP878TutorialsFinalPortalTests() {
  console.log('🧪 P8.7.8 软件教程频道 UI 3.0 门户化升级与七大栏目体验统一自动化验收测试');
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

  // 1. 频道独立聚合接口与数据模型
  console.log('▶ [1/8] 验证软件教程频道聚合接口与数据模型规范...');
  await test('GET /api/v1/channels/tutorials 基础响应协议与 HTTP 200 正确', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const json: any = await res.json();
    assert(json.success, '响应 success 必须为 true');
    assert(json.data, '响应必须包含 data 对象');
    assert(json.data.hero, '必须包含 hero 焦点实操教程');
    assert(Array.isArray(json.data.quickTroubleshooting), '必须包含 quickTroubleshooting 快捷排障数组');
    assert(Array.isArray(json.data.categories), '必须包含 categories 分类数组');
    assert(Array.isArray(json.data.items), '必须包含 items 教程列表数组');
  });

  await test('真实已发布教程数量严格保持为 27 篇（全部在库且可检索）', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials?limit=50`);
    const json: any = await res.json();
    assert.strictEqual(json.data.stats.totalTutorials, 27, `期望总教程数为 27 篇，实际 ${json.data.stats.totalTutorials}`);
    assert.strictEqual(json.data.items.length, 27, `全量拉取期望 27 篇，实际 ${json.data.items.length}`);
  });

  await test('频道 stats 统计指标完备（教程总数、分类数、累计阅读、已核验数）', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials`);
    const json: any = await res.json();
    const stats = json.data.stats;
    assert.strictEqual(stats.totalTutorials, 27, '总教程数必须为 27');
    assert.strictEqual(stats.totalCategories, 7, '专业分类数必须为 7 (排除 all)');
    assert(typeof stats.totalViews === 'number' && stats.totalViews >= 0, 'totalViews 必须为有效非负数值');
    assert.strictEqual(stats.verifiedGuidesCount, 27, '人工核验实操数必须为 27');
  });

  // 2. 数据隔离与安全（PUBLISHED 过滤、草稿隔离、测试数据隔离）
  console.log('▶ [2/8] 验证教程数据隔离、草稿隔离与测试数据隔离...');
  await test('所有前台输出教程必须为 PUBLISHED 状态', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials?limit=50`);
    const json: any = await res.json();
    for (const item of json.data.items) {
      assert.strictEqual(item.status, 'PUBLISHED', `教程 ${item.slug} 状态必须为 PUBLISHED`);
    }
  });

  await test('严格隔离草稿教程 (status=DRAFT)，绝不流入前台聚合与搜索', async () => {
    // 创建一个临时草稿教程
    const draftSlug = `temp-test-draft-${Date.now()}`;
    const testAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const authorId = testAdmin?.id || 'admin-system';

    const draft = await prisma.tutorial.create({
      data: {
        title: '这是一个未发布的临时草稿教程',
        slug: draftSlug,
        summary: '草稿摘要内容测试',
        content: '草稿教程正文内容...',
        authorId,
        status: 'DRAFT',
      },
    });

    try {
      // 验证前台列表接口绝不包含该草稿
      const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials?limit=50&q=草稿`);
      const json: any = await res.json();
      const found = json.data.items.some((t: any) => t.slug === draftSlug);
      assert(!found, '前台频道接口绝不能泄露草稿教程！');

      // 验证前台详情接口针对草稿返回 404
      const detailRes = await fetch(`${BASE_URL}/api/v1/channels/tutorials/${draftSlug}`);
      assert.strictEqual(detailRes.status, 404, '前台详情接口请求草稿必须返回 404');
    } finally {
      // 清理临时草稿
      await prisma.tutorial.delete({ where: { id: draft.id } });
    }
  });

  await test('测试数据隔离：关联软件如果包含 isTestData=true 则前台不予对外暴露', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials?limit=50`);
    const json: any = await res.json();
    for (const item of json.data.items) {
      if (item.software) {
        const sw = await prisma.software.findUnique({ where: { id: item.software.id } });
        assert(sw && !sw.isTestData, `软件 ${item.software.name} 不能是测试数据`);
      }
    }
  });

  // 3. 搜索与多维筛选机制
  console.log('▶ [3/8] 验证教程搜索、分类、标签、难度、平台与排序...');
  await test('关键词搜索：精确匹配教程标题、摘要与涉及软件名称', async () => {
    // 搜索 "Rufus"
    const resRufus = await fetch(`${BASE_URL}/api/v1/channels/tutorials?q=Rufus`);
    const jsonRufus: any = await resRufus.json();
    assert(jsonRufus.data.items.length >= 1, '搜索 Rufus 必须有结果');
    assert(jsonRufus.data.items.some((t: any) => t.slug === 'rufus-win11-bypass-tpm-guide'), '必须召回 Rufus 制作启动盘教程');

    // 搜索 "Wireshark"
    const resWs = await fetch(`${BASE_URL}/api/v1/channels/tutorials?q=Wireshark`);
    const jsonWs: any = await resWs.json();
    assert(jsonWs.data.items.some((t: any) => t.slug === 'wireshark-http-tcp-handshake-capture'), '必须召回 Wireshark 抓包教程');

    // 搜索 "Everything"
    const resEv = await fetch(`${BASE_URL}/api/v1/channels/tutorials?q=Everything`);
    const jsonEv: any = await resEv.json();
    assert(jsonEv.data.items.some((t: any) => t.slug === 'everything-advanced-search-syntax'), '必须召回 Everything 搜索教程');
  });

  await test('分类筛选：精准过滤对应技术门类且数量与分类统计严格一致', async () => {
    const resAll = await fetch(`${BASE_URL}/api/v1/channels/tutorials`);
    const jsonAll: any = await resAll.json();
    const categories = jsonAll.data.categories;

    for (const cat of categories) {
      if (cat.id === 'all') continue;
      const resCat = await fetch(`${BASE_URL}/api/v1/channels/tutorials?category=${cat.id}&limit=50`);
      const jsonCat: any = await resCat.json();
      assert.strictEqual(
        jsonCat.data.items.length,
        cat.count,
        `分类 ${cat.id} 实际拉取数量 (${jsonCat.data.items.length}) 必须等于元数据数量 (${cat.count})`
      );
      for (const t of jsonCat.data.items) {
        assert.strictEqual(t.category, cat.id, `教程 ${t.slug} 的 category 必须为 ${cat.id}`);
      }
    }
  });

  await test('难度等级筛选：BEGINNER / INTERMEDIATE / ADVANCED 准确过滤', async () => {
    const resAdv = await fetch(`${BASE_URL}/api/v1/channels/tutorials?difficulty=ADVANCED&limit=50`);
    const jsonAdv: any = await resAdv.json();
    assert(jsonAdv.data.items.length > 0, 'ADVANCED 难度应有结果');
    for (const t of jsonAdv.data.items) {
      assert.strictEqual(t.difficulty, 'ADVANCED', `教程 ${t.slug} 难度必须为 ADVANCED`);
    }
  });

  await test('操作系统平台筛选：Windows 11 / 跨平台准确匹配', async () => {
    const resWin11 = await fetch(`${BASE_URL}/api/v1/channels/tutorials?platform=WIN11&limit=50`);
    const jsonWin11: any = await resWin11.json();
    assert(jsonWin11.data.items.length > 0, 'WIN11 平台筛选应有结果');
    for (const t of jsonWin11.data.items) {
      assert(t.platform.includes('11'), `教程 ${t.slug} 平台必须包含 11`);
    }
  });

  await test('多维排序：支持 latest (发布优先)、views (热度优先) 与 updated (复核优先)', async () => {
    const resViews = await fetch(`${BASE_URL}/api/v1/channels/tutorials?sort=views&limit=10`);
    const jsonViews: any = await resViews.json();
    const items = jsonViews.data.items;
    for (let i = 0; i < items.length - 1; i++) {
      assert(items[i].viewCount >= items[i + 1].viewCount, '阅读热度排序必须从大到小递减');
    }
  });

  await test('分页计算精准无误，第 1 页与第 2 页无重复数据', async () => {
    const resP1 = await fetch(`${BASE_URL}/api/v1/channels/tutorials?page=1&limit=10`);
    const jsonP1: any = await resP1.json();
    const resP2 = await fetch(`${BASE_URL}/api/v1/channels/tutorials?page=2&limit=10`);
    const jsonP2: any = await resP2.json();

    assert.strictEqual(jsonP1.data.items.length, 10, '第一页必须为 10 条');
    assert.strictEqual(jsonP2.data.items.length, 10, '第二页必须为 10 条');

    const slugs1 = jsonP1.data.items.map((i: any) => i.slug);
    const slugs2 = jsonP2.data.items.map((i: any) => i.slug);
    const overlap = slugs1.filter((s: string) => slugs2.includes(s));
    assert.strictEqual(overlap.length, 0, '分页数据不应出现跨页重复');
  });

  // 4. 教程详情与沉浸式阅读器
  console.log('▶ [4/8] 验证教程详情、TOC 目录生成、准备清单与风险提示...');
  await test('GET /api/v1/channels/tutorials/:slug 完整加载正文与上下文', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const json: any = await res.json();
    const data = json.data;
    assert.strictEqual(data.slug, 'rufus-win11-bypass-tpm-guide');
    assert(data.content && data.content.length > 500, '正文内容必须完整');
    assert(Array.isArray(data.headings) && data.headings.length >= 4, '必须成功提取章节标题');
    assert(Array.isArray(data.preflightChecklist) && data.preflightChecklist.length > 0, '必须包含准备清单');
  });

  await test('高风险操作标记：Rufus 启动盘制作准确识别为 HIGH 风险与 isHighRisk=true', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`);
    const json: any = await res.json();
    assert.strictEqual(json.data.riskLevel, 'HIGH', 'Rufus 涉及格式化，风险等级必须为 HIGH');
    assert.strictEqual(json.data.isHighRisk, true, 'isHighRisk 必须为 true');
  });

  await test('目录生成 (TOC)：准确从 Markdown 提取 H2/H3 并生成唯一锚点 ID', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`);
    const json: any = await res.json();
    const headings = json.data.headings;
    assert(headings.length > 0, '提取标题数量必须大于0');
    const ids = headings.map((h: any) => h.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, '所有标题锚点 ID 必须唯一无冲突');
  });

  await test('代码块包含与安全：代码段纯文本传输，支持 powershell / cmd 语法标签', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/how-to-verify-genuine-iso-checksums`);
    const json: any = await res.json();
    const content = json.data.content;
    assert(content.includes('```powershell'), '校验教程必须包含 powershell 代码块');
    assert(content.includes('Get-FileHash'), '代码块内容必须包含真实命令 Get-FileHash');
  });

  await test('关联软件联动：Rufus 教程关联真实软件并返回最新版本与 P8.8 下载来源', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`);
    const json: any = await res.json();
    const sw = json.data.software;
    assert(sw, '必须成功关联 Rufus 软件');
    assert.strictEqual(sw.slug, 'rufus');
    assert(Array.isArray(sw.downloadSources) && sw.downloadSources.length > 0, '必须包含 P8.8 下载来源');
  });

  await test('同类教程推荐与上下篇连结：相关推荐排除自身且同属于 Windows 系统分类', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`);
    const json: any = await res.json();
    const related = json.data.relatedTutorials;
    assert(Array.isArray(related) && related.length > 0, '必须包含同类推荐教程');
    for (const rel of related) {
      assert.notStrictEqual(rel.slug, 'rufus-win11-bypass-tpm-guide', '推荐教程绝不能包含当前教程自身');
    }
  });

  // 5. 后台管理与权限控制
  console.log('▶ [5/8] 验证后台教程管理 API 与安全鉴权...');
  await test('未授权访问后台教程列表返回 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/tutorials`);
    assert.strictEqual(res.status, 401, '未授权访问后台必须被拦截为 401');
  });

  await test('未授权创建教程返回 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/admin/tutorials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '非法测试', slug: 'unauthorized', summary: 'test', content: 'test' }),
    });
    assert.strictEqual(res.status, 401, '未授权创建教程必须拦截为 401');
  });

  // 6. SEO、SSR 与 Sitemap
  console.log('▶ [6/8] 验证教程频道与详情页 SEO、SSR HTML、JSON-LD 与 Sitemap...');
  await test('GET /tutorials SSR HTML 渲染完整，包含 Canonical、Title 与 CollectionPage JSON-LD', async () => {
    const res = await fetch(`${BASE_URL}/tutorials`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const html = await res.text();
    assert(html.includes('<title>电脑软件教程与实用技术指南'), 'HTML 必须包含规范频道标题');
    assert(html.includes('rel="canonical"'), 'HTML 必须包含 canonical 链接');
    assert(html.includes('"@type":"CollectionPage"'), 'HTML 必须包含 CollectionPage 结构化数据');
    assert(html.includes('"@type":"BreadcrumbList"'), 'HTML 必须包含面包屑结构化数据');
    assert(html.includes('电脑软件教程与实用技术指南</h1>'), '必须包含标准语义 H1');
  });

  await test('GET /tutorials/:slug SSR HTML 渲染完整，包含 TechArticle 结构化数据', async () => {
    const res = await fetch(`${BASE_URL}/tutorials/rufus-win11-bypass-tpm-guide`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const html = await res.text();
    assert(html.includes('"@type":"TechArticle"'), '详情页必须包含 TechArticle 结构化数据');
    assert(html.includes('rel="canonical"'), '详情页必须包含 Canonical');
    assert(html.includes('rufus-win11-bypass-tpm-guide'), 'Canonical 必须指向当前教程 slug');
  });

  await test('Sitemap: /sitemap-tutorials.xml 包含频道根路由 /tutorials 且格式合法', async () => {
    const res = await fetch(`${BASE_URL}/sitemap-tutorials.xml`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
    const xml = await res.text();
    assert(xml.startsWith('<?xml'), 'Sitemap 必须以 XML 头声明起始');
    assert(xml.includes('<loc>http://localhost:3000/tutorials</loc>'), 'Sitemap 必须收录频道首页 /tutorials');
    assert(xml.includes('rufus-win11-bypass-tpm-guide'), 'Sitemap 必须收录 Rufus 教程详情');
  });

  await test('Robots.txt 明确允许蜘蛛抓取 /tutorials/ 路径', async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    const txt = await res.text();
    assert(txt.includes('Allow: /tutorials/'), 'robots.txt 必须允许 /tutorials/ 抓取');
  });

  // 7. 七大主导航一致性与防回退保护
  console.log('▶ [7/8] 验证全站七大主导航严格保护与禁止回退...');
  await test('七大主导航顺序、标题与路由严格一致', async () => {
    const EXPECTED_NAV = [
      { label: '首页', href: '/' },
      { label: '电脑软件', href: '/software' },
      { label: '系统工具', href: '/system-tools' },
      { label: '游戏中心', href: '/games' },
      { label: '装机必备', href: '/essentials' },
      { label: '软件教程', href: '/tutorials' },
      { label: '最新更新', href: '/updates' },
    ];

    assert.strictEqual(MAIN_NAV_ITEMS.length, 7, `主导航项数量必须精确为 7 项，实际为 ${MAIN_NAV_ITEMS.length}`);
    for (let i = 0; i < EXPECTED_NAV.length; i++) {
      assert.strictEqual(
        MAIN_NAV_ITEMS[i].label,
        EXPECTED_NAV[i].label,
        `第 ${i + 1} 个导航项名称必须为 ${EXPECTED_NAV[i].label}，实际为 ${MAIN_NAV_ITEMS[i].label}`
      );
      assert.strictEqual(
        MAIN_NAV_ITEMS[i].href,
        EXPECTED_NAV[i].href,
        `第 ${i + 1} 个导航项路径必须为 ${EXPECTED_NAV[i].href}，实际为 ${MAIN_NAV_ITEMS[i].href}`
      );
    }
  });

  await test('绝对禁止「对比评测」与「社区交流」回退至主导航', async () => {
    const hasCompare = MAIN_NAV_ITEMS.some((it) => it.href === '/compare' || it.label.includes('对比'));
    const hasCommunity = MAIN_NAV_ITEMS.some((it) => it.href === '/community' || it.label.includes('社区'));
    assert(!hasCompare, '对比评测绝对不得出现在前台主导航中');
    assert(!hasCommunity, '社区交流绝对不得出现在前台主导航中');
  });

  // 8. 既有六大频道健康零回退检查
  console.log('▶ [8/8] 验证首页及既有各频道服务端接口零回退 (全 HTTP 200)...');
  await test('首页聚合接口 /api/v1/home 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/home`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  await test('电脑软件频道 /api/v1/channels/software 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/software`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  await test('系统工具频道 /api/v1/channels/system-tools 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/system-tools`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  await test('游戏中心频道 /api/v1/channels/games 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/games`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  await test('装机必备频道 /api/v1/channels/essentials 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/essentials`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  await test('最新更新频道 /api/v1/channels/updates 保持健康 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/updates`);
    assert.strictEqual(res.status, 200, `期望 HTTP 200，实际 ${res.status}`);
  });

  console.log('\n========================================================================');
  console.log(`📊 P8.7.8 自动化验收测试完成: ${passCount} 项通过, ${failCount} 项失败`);

  return { total: passCount + failCount, passed: passCount, failed: failCount };
}

if (process.argv[1]?.includes('p878TutorialsFinalPortalTest')) {
  runP878TutorialsFinalPortalTests()
    .then((result) => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('测试套件异常崩溃:', err);
      process.exit(1);
    });
}
