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

export async function runP875Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.5 装机必备频道 UI 3.0 自动化验收测试');
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
    const sysCat = await prisma.category.findFirst({ where: { slug: 'sys-tools' } });
    assert(sysCat, 'sys-tools 分类必须存在');

    const realDesktopSw = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.SOFTWARE },
    });
    const realGame = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.GAME },
    });
    assert(realDesktopSw && realGame, '必须存在正式非测试软件与游戏参考样本');

    // 注入草稿 & 测试软件以检验绝对隔离
    const draftSw = await prisma.software.create({
      data: {
        name: `P875DraftTool-${ts}`,
        slug: `p875-draft-tool-${ts}`,
        developer: 'Draft Dev',
        summary: '未审核草稿软件，严禁露出装机必备频道',
        description: 'Draft Isolation Test',
        categoryId: sysCat.id,
        type: ResourceType.TOOL,
        status: ResourceStatus.DRAFT,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(draftSw.id);

    const testSw = await prisma.software.create({
      data: {
        name: `P875TestApp-${ts}`,
        slug: `p875-test-app-${ts}`,
        developer: 'Test Dev',
        summary: '测试软件样本，严禁混入装机必备频道',
        description: 'Test Isolation Test',
        categoryId: sysCat.id,
        type: ResourceType.SOFTWARE,
        status: ResourceStatus.PUBLISHED,
        isTestData: true,
      },
    });
    tempIds.softwareIds.push(testSw.id);

    const adminUser = await prisma.user.create({
      data: {
        username: `p875_admin_${ts}`,
        email: `p875_admin_${ts}@softtribe.local`,
        passwordHash: await hashPassword('AdminP875Pass!123'),
        role: Role.ADMIN,
      },
    });
    tempIds.userIds.push(adminUser.id);

    const normalMember = await prisma.memberUser.create({
      data: {
        username: `p875_member_${ts}`,
        email: `p875_member_${ts}@softtribe.local`,
        passwordHash: await hashPassword('UserP875Pass!123'),
      },
    });

    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { identifier: adminUser.username, password: 'AdminP875Pass!123' },
    });
    assert.strictEqual(adminLoginRes.statusCode, 200, '管理员登录应返回 200');
    const rawAdminCookie = adminLoginRes.headers['set-cookie'];
    const adminCookie = Array.isArray(rawAdminCookie) ? rawAdminCookie[0] : (rawAdminCookie as string);
    assert(adminCookie, '临时管理员登录失败');

    // -------------------------------------------------------------
    // 1. 聚合接口与真实数据校验
    // -------------------------------------------------------------
    console.log('--- 1. 装机必备聚合接口与真实来源口径验收 ---');

    await it('1.1 GET /api/v1/channels/essentials 返回真实统计与全部核心模块数据', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.success, true);
      const d = body.data;
      assert.strictEqual(d.channel, 'ESSENTIALS');
      assert(d.meta.totalPublishedSoftwareCount >= 28, `正式装机 pool 至少 28 款 (实际: ${d.meta.totalPublishedSoftwareCount})`);
      assert(
        d.meta.approvedHealthySourcesCount <= d.meta.registeredSourcesCount,
        '不得将全部登记源直接冒充为已审核直连健康源'
      );
      assert(d.heroSlides.length >= 2 && d.heroSlides.length <= 4, '应具备 2-4 条已发布装机专题大图');
      assert(d.quickTools.length === 8, `右侧常用装机工具应为 8 款 (实际: ${d.quickTools.length})`);
      assert(d.setupPlans.length === 6, `应具备 6 套场景化装机方案 (实际: ${d.setupPlans.length})`);
      assert(d.installWorkflow.length === 8, '系统安装与驱动配置流程应具备 8 个完整步骤');
      assert(d.toolboxGroups.length >= 4, '装机维修工具箱应至少有 4 个非空分组');
      assert(d.categoryShelves.length >= 5, '常用分类推荐不得包含空分类');
    });

    await it('1.2 绝对隔离 DRAFT、isTestData=true 与 GAME 资源及 P3 测试专题/教程', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const raw = res.payload;
      assert(!raw.includes(draftSw.slug), '不得泄露未发布 DRAFT 软件');
      assert(!raw.includes(testSw.slug), '不得泄露 isTestData=true 测试软件');
      assert(!raw.includes('topic-p3-') && !raw.includes('tut-p3-'), '不得泄露 P3 测试专题或教程');
      assert(!raw.includes('developer-verification-guide'), '不得混入内部政策白皮书教程');

      const d = res.json().data;
      for (const shelf of d.categoryShelves) {
        assert(shelf.slug !== 'drivers' && shelf.slug !== 'security' && shelf.slug !== 'games', `不应输出空分类或游戏分类: ${shelf.slug}`);
        assert(shelf.totalCount > 0 && shelf.softwares.length > 0);
      }
      const shelfAllSlugs = d.categoryShelves.flatMap((s: any) => s.softwares.map((sw: any) => sw.slug));
      assert.strictEqual(new Set(shelfAllSlugs).size, shelfAllSlugs.length, '分类软件货架中同软件不可重复出现');
    });

    await it('1.3 全部 6 大场景方案仅绑定已发布存在资源且标明高风险提示', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const d = res.json().data;
      const publishedSlugs = new Set(
        (
          await prisma.software.findMany({
            where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: { not: ResourceType.GAME } },
            select: { slug: true },
          })
        ).map((s) => s.slug)
      );

      for (const plan of d.setupPlans) {
        assert(plan.items.length >= 5, `方案 ${plan.id} 绑定的真实软件应充足`);
        assert(plan.groups.length >= 2, `方案 ${plan.id} 应具备用途分组`);
        for (const item of plan.items) {
          assert(publishedSlugs.has(item.slug), `方案 ${plan.id} 引用了非已发布或不存在软件: ${item.slug}`);
          assert(item.rolePurpose && item.installTip, '清单条目必须具备用途与安装避坑说明');
        }
      }

      const repairPlan = d.setupPlans.find((p: any) => p.id === 'repair_station');
      assert(repairPlan, '必须包含电脑维修工作站方案');
      const dg = repairPlan.items.find((i: any) => i.slug === 'diskgenius');
      const rufus = repairPlan.items.find((i: any) => i.slug === 'rufus');
      assert(dg?.riskLevel === 'HIGH' && dg?.requireBackup, 'DiskGenius 必须标为高风险需备份');
      assert(rufus?.riskLevel === 'HIGH' && rufus?.requireBackup, 'Rufus 必须标为高风险需备份');
    });

    await it('1.4 系统安装流程严守安全合规边界（官方通道 vs 第三方整理、驱动官网与风险预警）', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const wf = res.json().data.installWorkflow;
      const step3 = wf.find((s: any) => s.step === 3);
      const step4 = wf.find((s: any) => s.step === 4);
      const step6 = wf.find((s: any) => s.step === 6);
      assert(step3 && step3.checklist.join('').includes('并非微软官网') && step3.complianceWarning, '步骤 3 必须明确区分微软官网与第三方整理');
      assert(step4 && step4.isHighRisk && step4.complianceWarning.includes('清空'), '步骤 4 启动盘制作必须预警清空 U 盘');
      assert(step6 && step6.checklist.join('').includes('Windows Update'), '步骤 6 驱动引导优先 Windows Update 与硬件官网');
    });

    // -------------------------------------------------------------
    // 2. 后台 ESSENTIALS 运营配置鉴权与安全边界
    // -------------------------------------------------------------
    console.log('\n--- 2. 后台 ESSENTIALS 频道运营推荐接口与安全边界验证 ---');

    await it('2.1 未认证与非管理员账号禁止操作 /api/v1/admin/channels/ESSENTIALS/recommendations', async () => {
      const unauth = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/channels/ESSENTIALS/recommendations',
      });
      assert.strictEqual(unauth.statusCode, 401);

      const memLogin = await app.inject({
        method: 'POST',
        url: '/api/v1/members/login',
        payload: { identifier: normalMember.username, password: 'UserP875Pass!123' },
      });
      if (memLogin.statusCode === 200) {
        const mc = Array.isArray(memLogin.headers['set-cookie'])
          ? memLogin.headers['set-cookie'][0]
          : (memLogin.headers['set-cookie'] as string);
        const denied = await app.inject({
          method: 'GET',
          url: '/api/v1/admin/channels/ESSENTIALS/candidates',
          headers: { cookie: mc },
        });
        assert(denied.statusCode === 401 || denied.statusCode === 403);
      }
    });

    await it('2.2 管理员禁止向 ESSENTIALS 推荐 DRAFT、测试软件或 GAME 类型资源', async () => {
      const rejectDraft = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/ESSENTIALS/recommendations',
        headers: { cookie: adminCookie },
        payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: draftSw.id },
      });
      assert.strictEqual(rejectDraft.statusCode, 400);

      const rejectTest = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/ESSENTIALS/recommendations',
        headers: { cookie: adminCookie },
        payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: testSw.id },
      });
      assert.strictEqual(rejectTest.statusCode, 400);

      const rejectGame = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/ESSENTIALS/recommendations',
        headers: { cookie: adminCookie },
        payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: realGame.id },
      });
      assert.strictEqual(rejectGame.statusCode, 400);
    });

    await it('2.3 管理员可将已发布非游戏软件配置到 ESSENTIALS 并实时在前台生效，删后复原', async () => {
      const upsertRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/ESSENTIALS/recommendations',
        headers: { cookie: adminCookie },
        payload: {
          slot: 'EDITOR_PICK',
          targetType: 'SOFTWARE',
          targetId: realDesktopSw.id,
          badgeText: 'P875契约验证',
          sortOrder: 0,
          isActive: true,
        },
      });
      assert(upsertRes.statusCode === 200 || upsertRes.statusCode === 201, `创建推荐应返回 200/201 (实际: ${upsertRes.statusCode})`);
      const recId = upsertRes.json().data.id;
      tempIds.recIds.push(recId);

      const portalRes = await app.inject({ method: 'GET', url: '/api/v1/channels/essentials' });
      const ep = portalRes.json().data.editorPicks;
      assert(ep.some((item: any) => item.id === realDesktopSw.id && item.badgeText === 'P875契约验证'));

      const delRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/channels/ESSENTIALS/recommendations/${recId}`,
        headers: { cookie: adminCookie },
      });
      assert.strictEqual(delRes.statusCode, 200);
      tempIds.recIds = tempIds.recIds.filter((id) => id !== recId);
    });

    // -------------------------------------------------------------
    // 3. SSR、SEO、Sitemap 与全站保护回归
    // -------------------------------------------------------------
    console.log('\n--- 3. SEO、SSR、Sitemap 及全站既有频道零回归保护 ---');

    await it('3.1 GET /essentials 与 /seo/essentials SSR 含独立 H1、Canonical 与 CollectionPage/ItemList 结构化数据', async () => {
      for (const u of ['/essentials', '/seo/essentials']) {
        const res = await app.inject({ method: 'GET', url: u });
        assert.strictEqual(res.statusCode, 200);
        assert(res.payload.includes('<h1') && res.payload.includes('新电脑装机与必备软件中心'));
        assert(res.payload.includes('/essentials"'), `${u} Canonical 应指向 /essentials`);
        assert(res.payload.includes('CollectionPage') && res.payload.includes('ItemList'));
        assert(!res.payload.includes(draftSw.slug) && !res.payload.includes(testSw.slug));
      }
    });

    await it('3.2 /sitemap-essentials.xml、/sitemap.xml 与 /robots.txt 全链路 XML 一致性', async () => {
      const sm = await app.inject({ method: 'GET', url: '/sitemap-essentials.xml' });
      assert.strictEqual(sm.statusCode, 200);
      assert(String(sm.headers['content-type'] || '').includes('xml'));
      assert(sm.payload.includes('/essentials</loc>'));
      assert(!sm.payload.includes('<!doctype html'));

      const idx = await app.inject({ method: 'GET', url: '/sitemap.xml' });
      assert.strictEqual(idx.statusCode, 200);
      assert(idx.payload.includes('/sitemap-essentials.xml</loc>'));

      const rb = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert(rb.payload.includes('Allow: /essentials') && rb.payload.includes('/sitemap-essentials.xml'));

      const staticRb = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf-8');
      assert(staticRb.includes('Allow: /essentials') && staticRb.includes('sitemap-essentials.xml'));
    });

    await it('3.3 原创 Banner SVG 资源就绪，且首页、电脑软件、系统工具、游戏中心频道完好无损', async () => {
      for (const svgName of [
        'hero-essentials-win11.svg',
        'hero-essentials-office.svg',
        'hero-essentials-boot.svg',
        'hero-essentials-repair.svg',
      ]) {
        assert(fs.existsSync(path.join(process.cwd(), 'public/images/essentials', svgName)), `缺少 SVG: ${svgName}`);
      }

      for (const route of ['/', '/software', '/system-tools', '/games']) {
        const res = await app.inject({ method: 'GET', url: route });
        assert.strictEqual(res.statusCode, 200, `${route} SSR 必须保持 200`);
      }

      const softApi = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
      const sysApi = await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' });
      const gameApi = await app.inject({ method: 'GET', url: '/api/v1/channels/games' });
      assert.strictEqual(softApi.statusCode, 200);
      assert.strictEqual(sysApi.statusCode, 200);
      assert.strictEqual(gameApi.statusCode, 200);
      assert.strictEqual(gameApi.json().data.meta.totalGamesCount, 2);
    });
  } finally {
    if (tempIds.recIds.length > 0) {
      await prisma.channelRecommendation.deleteMany({ where: { id: { in: tempIds.recIds } } }).catch(() => {});
    }
    if (tempIds.softwareIds.length > 0) {
      await prisma.software.deleteMany({ where: { id: { in: tempIds.softwareIds } } }).catch(() => {});
    }
    const p875Users = await prisma.user.findMany({ where: { username: { startsWith: 'p875_' } }, select: { id: true } });
    if (p875Users.length > 0) {
      const ids = p875Users.map((u) => u.id);
      await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.5 装机必备频道自动化测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');
  if (failed > 0) process.exit(1);
}

runP875Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
