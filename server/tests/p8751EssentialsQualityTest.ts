import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { PrismaClient, ResourceStatus, ResourceType, Role } from '@prisma/client';
import { buildApp } from '../src/app';
import { hashPassword } from '../src/utils/security';

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

export async function runP8751Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.5.1 装机必备质量专项修复与数据治理自动化测试');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  const ts = Date.now();
  const tempIds: {
    softwareIds: string[];
    recIds: string[];
    userIds: string[];
  } = { softwareIds: [], recIds: [], userIds: [] };

  try {
    // -------------------------------------------------------------
    // 1. 真实数据统计与排行榜真实口径检验
    // -------------------------------------------------------------
    console.log('--- 1. 真实浏览量与下载事件统计口径 (真实过滤与低样本自适应) ---');

    await it('1.1 /api/v1/channels/essentials 真实返回 200 且元数据标签诚实明确', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      assert.strictEqual(res.statusCode, 200);
      const data = res.json().data;
      assert.strictEqual(data.channel, 'ESSENTIALS');
      assert(data.meta.viewStatsLabel.includes('真实浏览') || data.meta.viewStatsLabel.includes('非下载'));
      assert(data.meta.downloadStatsLabel.includes('非测试') || data.meta.downloadStatsLabel.includes('点击'));
      assert(typeof data.meta.totalDownloadEvents === 'number');
      assert(data.meta.totalPublishedSoftwareCount >= 28, '已发布桌面/工具软件数应 >= 28');
    });

    await it('1.2 双榜严格过滤未被浏览或未被下载的零值软件，绝不用 0 填充', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const { mostViewed, mostDownloaded } = res.json().data.leaderboards;

      // 浏览榜中每一项 viewCount 必须 > 0
      for (const item of mostViewed) {
        assert(item.viewCount > 0, `浏览榜单软件 ${item.slug} viewCount 必须大于 0，实际: ${item.viewCount}`);
        assert(item.type !== ResourceType.GAME, `装机榜单严禁混入游戏 ${item.slug}`);
      }

      // 下载榜中每一项 downloadCount 必须 > 0
      for (const item of mostDownloaded) {
        assert(item.downloadCount > 0, `下载榜单软件 ${item.slug} downloadCount 必须大于 0，实际: ${item.downloadCount}`);
        assert(item.type !== ResourceType.GAME, `装机榜单严禁混入游戏 ${item.slug}`);
      }

      // 验证降序排列
      for (let i = 0; i < mostViewed.length - 1; i++) {
        assert(mostViewed[i].viewCount >= mostViewed[i + 1].viewCount, '浏览榜必须严格降序');
      }
      for (let i = 0; i < mostDownloaded.length - 1; i++) {
        assert(mostDownloaded[i].downloadCount >= mostDownloaded[i + 1].downloadCount, '下载榜必须严格降序');
      }
    });

    await it('1.3 真实事件与数据库完全对齐，排除 isTestEvent 与 isTestData', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const { mostDownloaded } = res.json().data.leaderboards;

      // 从数据库聚合真实下载事件
      const realEvents = await prisma.downloadEvent.findMany({
        where: { isTestEvent: false },
        select: { softwareId: true },
      });
      const countsBySoftwareId = new Map<string, number>();
      for (const ev of realEvents) {
        countsBySoftwareId.set(ev.softwareId, (countsBySoftwareId.get(ev.softwareId) || 0) + 1);
      }

      for (const topItem of mostDownloaded) {
        const expectedCount = countsBySoftwareId.get(topItem.id) || 0;
        assert.strictEqual(
          topItem.downloadCount,
          expectedCount,
          `软件 ${topItem.slug} 下载数 (${topItem.downloadCount}) 必须与 DB 真实非测试事件数 (${expectedCount}) 完全相等`
        );
      }
    });

    // -------------------------------------------------------------
    // 2. 方案与清单数据治理：草稿与游戏绝对隔离
    // -------------------------------------------------------------
    console.log('\n--- 2. 装机方案与清单数据治理 (草稿、测试与游戏绝对隔离) ---');

    await it('2.1 六套装机方案绑定的所有软件在数据库中 100% 存在且均为 PUBLISHED', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const setupPlans = res.json().data.setupPlans;
      assert.strictEqual(setupPlans.length, 6, '必须包含 6 套标准装机方案');

      const allPlanSlugs = new Set<string>();
      for (const plan of setupPlans) {
        assert(plan.items.length >= 3, `方案 ${plan.id} 软件清单数应 >= 3`);
        for (const item of plan.items) {
          allPlanSlugs.add(item.slug);
        }
      }

      // 验证全集与 DB 状态
      const dbSoftwares = await prisma.software.findMany({
        where: { slug: { in: Array.from(allPlanSlugs) } },
        select: { id: true, slug: true, status: true, isTestData: true, type: true },
      });

      assert.strictEqual(
        dbSoftwares.length,
        allPlanSlugs.size,
        `方案中引用的 ${allPlanSlugs.size} 个 slug 必须全部在数据库中收录`
      );

      for (const sw of dbSoftwares) {
        assert.strictEqual(sw.status, ResourceStatus.PUBLISHED, `${sw.slug} 必须为 PUBLISHED`);
        assert.strictEqual(sw.isTestData, false, `${sw.slug} 不得为测试数据`);
        assert.notStrictEqual(sw.type, ResourceType.GAME, `${sw.slug} 严禁为 GAME 类型`);
      }
    });

    await it('2.2 草稿软件（如 MemTest86）与未上线软件绝不在装机方案中露出', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const setupPlans = res.json().data.setupPlans;
      const jsonStr = JSON.stringify(setupPlans);

      assert(!jsonStr.includes('memtest86'), '草稿软件 memtest86 严禁出现在任何装机方案中');
      assert(!jsonStr.includes('ventoy'), '未上线软件 ventoy 严禁出现在任何装机方案中');
      assert(!jsonStr.includes('crystaldiskinfo'), '未上线软件 crystaldiskinfo 严禁出现在任何装机方案中');
    });

    await it('2.3 动态注入草稿软件与测试软件时，装机必备聚合接口绝对阻断其混入', async () => {
      const sysCat = await prisma.category.findFirst({ where: { slug: 'sys-tools' } });
      assert(sysCat);

      const injectedDraft = await prisma.software.create({
        data: {
          name: `P8751DraftTool-${ts}`,
          slug: `p8751-draft-tool-${ts}`,
          developer: 'Injected Dev',
          summary: '动态注入草稿软件',
          description: 'Draft Injection Test',
          categoryId: sysCat.id,
          type: ResourceType.TOOL,
          status: ResourceStatus.DRAFT,
          isTestData: false,
        },
      });
      tempIds.softwareIds.push(injectedDraft.id);

      const injectedGame = await prisma.software.create({
        data: {
          name: `P8751Game-${ts}`,
          slug: `p8751-game-${ts}`,
          developer: 'Injected Game Dev',
          summary: '动态注入已发布游戏',
          description: 'Game Injection Test',
          categoryId: sysCat.id,
          type: ResourceType.GAME,
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
        },
      });
      tempIds.softwareIds.push(injectedGame.id);

      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const payload = res.payload;

      assert(!payload.includes(injectedDraft.slug), `装机必备严禁泄露草稿软件 ${injectedDraft.slug}`);
      assert(!payload.includes(injectedGame.slug), `装机必备严禁泄露游戏资源 ${injectedGame.slug}`);

      // 及时清理临时注入数据，避免干扰后续全量测试
      await prisma.software.deleteMany({ where: { id: { in: tempIds.softwareIds } } });
      tempIds.softwareIds = [];
    });

    // -------------------------------------------------------------
    // 3. 导出安全性与域名规范
    // -------------------------------------------------------------
    console.log('\n--- 3. 导出规范性与安全域名 (无 localhost 泄露、规范 URI) ---');

    await it('3.1 前端代码与站点配置统一绑定生产域名 softtribe.top', async () => {
      const siteConfigPath = path.join(process.cwd(), 'src/config/site.ts');
      const siteConfigContent = fs.readFileSync(siteConfigPath, 'utf-8');
      assert(siteConfigContent.includes('domain: "softtribe.top"'), 'siteConfig domain 必须为 softtribe.top');
      assert(siteConfigContent.includes('url: "https://softtribe.top"'), 'siteConfig url 必须为 https://softtribe.top');
      assert(!siteConfigContent.includes('softbuluo.com'), 'siteConfig 绝不保留软部落旧域名');

      const checklistCompPath = path.join(
        process.cwd(),
        'src/components/essentials/EssentialsSetupPlansAndChecklist.tsx'
      );
      const checklistCompContent = fs.readFileSync(checklistCompPath, 'utf-8');
      assert(checklistCompContent.includes('siteConfig'), '组件必须引入 siteConfig');
      assert(
        !checklistCompContent.includes('window.location.origin'),
        '组件导出不得直接使用 window.location.origin 导致泄露 localhost:3000'
      );
      assert(checklistCompContent.includes('encodeURIComponent(it.slug)'), '导出链接必须对 slug 执行 URI 编码');
    });

    // -------------------------------------------------------------
    // 4. 8 步系统安装指引与安全文案规范
    // -------------------------------------------------------------
    console.log('\n--- 4. 八步装机教程提示词优化与安全风险警告 ---');

    await it('4.1 8 步流程中第 4 步和第 5 步必须标记为 isHighRisk 且文案严谨中立', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const workflow = res.json().data.installWorkflow;
      assert.strictEqual(workflow.length, 8, '系统安装流程必须为 8 步');

      const step4 = workflow.find((s: any) => s.step === 4);
      assert(step4, '必须包含步骤 4 制作启动盘');
      assert.strictEqual(step4.isHighRisk, true);
      assert(step4.complianceWarning.includes('格式化') || step4.complianceWarning.includes('清空'));

      const step5 = workflow.find((s: any) => s.step === 5);
      assert(step5, '必须包含步骤 5 原版系统安装与分区');
      assert.strictEqual(step5.isHighRisk, true);
      // 必须包含快捷键与 OEM 还原分区提示
      assert(step5.summary.includes('快捷键') || step5.summary.includes('F8') || step5.summary.includes('F12'));
      assert(
        step5.checklist.some((c: string) => c.includes('OEM') || c.includes('数据盘')),
        '步骤 5 检查清单需提醒 OEM 还原分区及用户数据盘'
      );
      assert(step5.complianceWarning.includes('OEM') || step5.complianceWarning.includes('非系统分区'));
    });

    // -------------------------------------------------------------
    // 5. SSR 与 SEO 规范检验
    // -------------------------------------------------------------
    console.log('\n--- 5. SSR 元数据、H1 标题与 Canonical 标签 ---');

    await it('5.1 /essentials SSR 渲染返回 200，包含 H1、Canonical 与 ItemList 结构化数据', async () => {
      const res = await app.inject({ method: 'GET', url: '/essentials' });
      assert.strictEqual(res.statusCode, 200);
      const html = res.payload;

      assert(html.includes('<h1') && html.includes('新电脑装机与必备软件中心'), 'SSR 必须输出装机必备 H1 标题');
      assert(html.includes('rel="canonical"') && html.includes('/essentials'), 'Canonical 必须准确指向 /essentials');
      assert(html.includes('"@type":"ItemList"') || html.includes('"@type": "ItemList"'), '必须包含装机必备 ItemList 结构化数据');
    });

    await it('5.2 robots.txt 与 Sitemap 结构一致性', async () => {
      const rb = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(rb.statusCode, 200);
      assert(rb.payload.includes('Allow: /essentials'), 'robots.txt 必须允许抓取 /essentials');

      const smIndex = await app.inject({ method: 'GET', url: '/sitemap.xml' });
      assert.strictEqual(smIndex.statusCode, 200);
      assert(smIndex.payload.includes('/sitemap-essentials.xml'), '主 Sitemap 索引必须引用 sitemap-essentials.xml');

      const smEssentials = await app.inject({ method: 'GET', url: '/sitemap-essentials.xml' });
      assert.strictEqual(smEssentials.statusCode, 200);
      assert(smEssentials.payload.includes('/essentials</loc>'), 'sitemap-essentials.xml 必须包含 /essentials 主入口');
    });

    // -------------------------------------------------------------
    // 6. 全量历史频道防退化
    // -------------------------------------------------------------
    console.log('\n--- 6. 全量频道防退化与路由可达性 ---');

    await it('6.1 首页及各主要独立频道 SSR 全部返回 200', async () => {
      for (const route of ['/', '/software', '/system-tools', '/games', '/essentials']) {
        const res = await app.inject({ method: 'GET', url: route });
        assert.strictEqual(res.statusCode, 200, `频道 ${route} SSR 必须返回 200`);
      }
    });

    await it('6.2 电脑软件、系统工具、游戏中心各聚合 API 正常且互不干扰', async () => {
      const softApi = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
      const sysApi = await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' });
      const gameApi = await app.inject({ method: 'GET', url: '/api/v1/channels/games' });
      const essApi = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });

      assert.strictEqual(softApi.statusCode, 200);
      assert.strictEqual(sysApi.statusCode, 200);
      assert.strictEqual(gameApi.statusCode, 200);
      assert.strictEqual(essApi.statusCode, 200);

      // 游戏中心保持 2 款已发布游戏
      assert.strictEqual(gameApi.json().data.meta.totalGamesCount, 2);
    });
  } finally {
    if (tempIds.recIds.length > 0) {
      await prisma.channelRecommendation.deleteMany({ where: { id: { in: tempIds.recIds } } }).catch(() => {});
    }
    if (tempIds.softwareIds.length > 0) {
      await prisma.software.deleteMany({ where: { id: { in: tempIds.softwareIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.5.1 装机必备质量专项测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');
  if (failed > 0) process.exit(1);
}

runP8751Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
