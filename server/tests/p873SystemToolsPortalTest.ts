import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { PrismaClient, ResourceStatus, ResourceType, TopicStatus, Role } from '@prisma/client';
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

export async function runP873Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.3 系统工具频道 UI 3.0 自动化验收测试');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  const ts = Date.now();
  const tempIds: {
    softwareIds: string[];
    topicIds: string[];
    recIds: string[];
    userIds: string[];
  } = { softwareIds: [], topicIds: [], recIds: [], userIds: [] };

  try {
    const sysCat = await prisma.category.findFirst({ where: { slug: 'sys-tools' } });
    const officeCat = await prisma.category.findFirst({ where: { slug: 'office' } });
    assert(sysCat && officeCat, '系统工具与办公软件分类必须存在');

    const realTool = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.TOOL },
    });
    assert(realTool, '数据库中必须存在已发布的系统工具');

    const officeSoftware = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.SOFTWARE, categoryId: officeCat.id },
    });

    const draftTool = await prisma.software.create({
      data: {
        name: `P873DraftTool-${ts}`,
        slug: `p873-draft-tool-${ts}`,
        developer: 'Draft Dev',
        summary: '草稿工具隔离验证',
        description: '严禁对外泄露',
        categoryId: sysCat.id,
        type: ResourceType.TOOL,
        status: ResourceStatus.DRAFT,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(draftTool.id);

    const testTool = await prisma.software.create({
      data: {
        name: `P873TestTool-${ts}`,
        slug: `p873-test-tool-${ts}`,
        developer: 'Test Dev',
        summary: '测试工具隔离验证',
        description: '严禁泄露',
        categoryId: sysCat.id,
        type: ResourceType.TOOL,
        status: ResourceStatus.PUBLISHED,
        isTestData: true,
      },
    });
    tempIds.softwareIds.push(testTool.id);

    const gameSw = await prisma.software.create({
      data: {
        name: `P873Game-${ts}`,
        slug: `p873-game-${ts}`,
        developer: 'Game Studio',
        summary: '游戏不得混入系统工具',
        description: '游戏隔离校验',
        categoryId: sysCat.id,
        type: ResourceType.GAME,
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(gameSw.id);

    const draftTopic = await prisma.topic.create({
      data: {
        title: `P873DraftTopic-${ts}`,
        slug: `p873-draft-topic-${ts}`,
        description: '未审专题不得公开',
        status: TopicStatus.DRAFT,
      },
    });
    tempIds.topicIds.push(draftTopic.id);

    const adminUser = await prisma.user.create({
      data: {
        username: `p873_admin_${ts}`,
        email: `p873_admin_${ts}@softtribe.local`,
        passwordHash: await hashPassword('AdminP873Pass!123'),
        role: Role.ADMIN,
      },
    });
    tempIds.userIds.push(adminUser.id);

    let channelPayload: any = null;

    // -------------------------------------------------------------
    // 1. 聚合接口结构、真实数据边界与去重检查
    // -------------------------------------------------------------
    console.log('--- 1. 系统工具频道聚合结构与数据真实性 ---');

    await it('1.1 GET /api/v1/channels/system-tools 返回完整门户结构与诚实指标', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.success, true);
      channelPayload = json.data;

      assert.strictEqual(channelPayload.meta.channel, 'SYSTEM_TOOLS');
      assert(channelPayload.meta.totalToolsCount >= 10, '应返回真实工具总量');
      assert(channelPayload.meta.utilityToolsCount >= 8, '应统计真实维保实操工具数');
      assert(channelPayload.meta.registeredSourcesCount >= channelPayload.meta.approvedHealthySourcesCount);
      assert(channelPayload.heroSlides.length >= 2 && channelPayload.heroSlides.length <= 4, '焦点专题应保持 2-4 帧');
      assert.strictEqual(channelPayload.commonTools.length, 8, '维修常用工具矩阵应稳定为 8 款');
      assert(channelPayload.scenarios.length >= 5, '应包含电脑故障场景导航');
      assert(channelPayload.domainBlocks.length >= 4, '应包含多个专业工具分类');
      assert(channelPayload.editorPicks.length >= 5, '编辑精选应包含多款实操工具');
    });

    await it('1.2 工具池绝不混入 OFFICE 软件/游戏/草稿/测试数据，且本地矢量横幅真实存在', async () => {
      const payloadStr = JSON.stringify(channelPayload);
      assert(!payloadStr.includes(draftTool.slug), '禁止泄露草稿工具');
      assert(!payloadStr.includes(testTool.slug), '禁止泄露测试数据工具');
      assert(!payloadStr.includes(gameSw.slug), '禁止混入 GAME 类型资源');
      assert(!payloadStr.includes(draftTopic.slug), '禁止泄露草稿专题');
      assert(!payloadStr.includes('office-2024') && !payloadStr.includes('libreoffice'), '不可拿办公软件充当系统工具');

      for (const slide of channelPayload.heroSlides) {
        if (slide.coverImage && slide.coverImage.startsWith('/images/system-tools/')) {
          const fullPath = path.join(process.cwd(), 'public', slide.coverImage);
          assert(fs.existsSync(fullPath), `缺少本地系统工具矢量横幅: ${slide.coverImage}`);
        }
      }
    });

    await it('1.3 模块内无重复工具，每个工具在分类区只归属主领域且编辑精选尽量不与常用工具重叠', async () => {
      const commonIds = new Set(channelPayload.commonTools.map((x: any) => x.id));
      assert.strictEqual(commonIds.size, channelPayload.commonTools.length, '维修常用工具内部存在重复');

      const editorIds = new Set(channelPayload.editorPicks.map((x: any) => x.id));
      assert.strictEqual(editorIds.size, channelPayload.editorPicks.length, '编辑精选内部存在重复');

      const domainSeen = new Set<string>();
      for (const d of channelPayload.domainBlocks) {
        for (const t of d.tools) {
          assert(!domainSeen.has(t.id), `工具 ${t.slug} 不应在分类区多模块重复出现`);
          domainSeen.add(t.id);
        }
      }
    });

    await it('1.4 电脑故障场景绑定真实工具与教程，且高危工具及磁盘场景自带安全与备份警示', async () => {
      const diskSc = channelPayload.scenarios.find((s: any) => s.id === 'disk_health');
      assert(diskSc, '必须存在硬盘健康与数据恢复场景');
      assert(diskSc.tools.length >= 1, '硬盘场景必须关联至少 1 款已发布真工具');
      assert(diskSc.safetyWarning.includes('写入'), '磁盘故障场景必须明确警示严禁向故障盘写入文件');

      const allItems = [...channelPayload.commonTools, ...channelPayload.editorPicks];
      const dg = allItems.find((x: any) => x.slug === 'diskgenius');
      const rufus = allItems.find((x: any) => x.slug === 'rufus');
      if (dg) {
        assert.strictEqual(dg.riskLevel, 'HIGH');
        assert.strictEqual(dg.requireBackup, true);
      }
      if (rufus) {
        assert.strictEqual(rufus.riskLevel, 'HIGH');
        assert.strictEqual(rufus.requireBackup, true);
      }
    });

    await it('1.5 榜单严格排除 0 计数项，且最近更新与最新收录采用不同日期字段排序', async () => {
      for (const v of channelPayload.leaderboards.mostViewed) {
        assert(v.viewCount > 0, `浏览榜禁止出现 0 浏览工具: ${v.slug}`);
      }
      for (const d of channelPayload.leaderboards.mostDownloaded) {
        assert(d.downloadCount > 0, `下载点击榜禁止出现 0 点击工具: ${d.slug}`);
        assert(d.downloadCount < 500, '下载数字必须真实非伪造');
      }

      const verUpdates = channelPayload.latestUpdates.versionUpdates;
      assert(verUpdates.length >= 5);
      for (let i = 1; i < verUpdates.length; i++) {
        assert(verUpdates[i - 1].releaseDate >= verUpdates[i].releaseDate, '最近更新必须按 releaseDate 降序');
      }
      const cataloged = channelPayload.latestUpdates.newlyCataloged;
      for (let i = 1; i < cataloged.length; i++) {
        assert(
          new Date(cataloged[i - 1].catalogedAt).getTime() >= new Date(cataloged[i].catalogedAt).getTime(),
          '最新收录必须按 catalogedAt 降序'
        );
      }
    });

    // -------------------------------------------------------------
    // 2. 多维检索与真假源过滤校验
    // -------------------------------------------------------------
    console.log('\n--- 2. 系统工具库多维筛选与来源诚实度 ---');

    await it('2.1 /api/v1/resources?type=TOOL 大小写不敏感授权过滤生效 (opensource / free / commercial)', async () => {
      const ossRes = await app.inject({ method: 'GET', url: '/api/v1/resources?type=TOOL&license=opensource&limit=50' });
      assert.strictEqual(ossRes.statusCode, 200);
      const ossSlugs = JSON.parse(ossRes.payload).data.items.map((x: any) => x.slug);
      assert(ossSlugs.includes('7zip') && ossSlugs.includes('rufus') && ossSlugs.includes('wireshark'), 'opensource 筛选必须匹配 GPL/LGPL 系统工具');

      const freeRes = await app.inject({ method: 'GET', url: '/api/v1/resources?type=TOOL&license=free&limit=50' });
      const freeSlugs = JSON.parse(freeRes.payload).data.items.map((x: any) => x.slug);
      assert(freeSlugs.includes('everything') && freeSlugs.includes('diskgenius'), 'free 筛选必须匹配 Freeware/Shareware 工具');
    });

    await it('2.2 /api/v1/resources?type=TOOL 严格区分已审核健康直连与待审核渠道 (sourceVerified 不再盲目为 true)', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=TOOL&limit=50' });
      const items = JSON.parse(res.payload).data.items;
      const win11 = items.find((x: any) => x.slug === 'windows-11');
      const zip7 = items.find((x: any) => x.slug === '7zip');
      assert(win11 && zip7);
      assert.strictEqual(win11.sourceVerified, false, 'windows-11 当前无已审核健康源，sourceVerified 不得为 true');
      assert.strictEqual(zip7.sourceVerified, true, '7-Zip 具备已审核健康源，sourceVerified 应为 true');
    });

    // -------------------------------------------------------------
    // 3. SYSTEM_TOOLS 后台运营配置权限、防绕过与软件频道保护
    // -------------------------------------------------------------
    console.log('\n--- 3. SYSTEM_TOOLS 后台运营边界与频道隔离 ---');

    await it('3.1 未授权访问 SYSTEM_TOOLS 运营接口必须返回 401', async () => {
      const r1 = await app.inject({ method: 'GET', url: '/api/v1/admin/channels/SYSTEM_TOOLS/recommendations' });
      assert.strictEqual(r1.statusCode, 401);
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { identifier: adminUser.username, password: 'AdminP873Pass!123' },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    const adminCookie = loginRes.headers['set-cookie'] as string;

    await it('3.2 SYSTEM_TOOLS 推荐拦截草稿/测试/游戏/无关办公软件，合法配置增删与生效不污染 SOFTWARE', async () => {
      const badTargets = [draftTool.id, testTool.id, gameSw.id, ...(officeSoftware ? [officeSoftware.id] : [])];
      for (const badId of badTargets) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/channels/SYSTEM_TOOLS/recommendations',
          headers: { cookie: adminCookie },
          payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: badId },
        });
        assert.strictEqual(res.statusCode, 400, `必须拦截不合法推荐目标: ${badId}`);
      }

      const swBefore = JSON.stringify(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/software' })).payload).data.heroSlides);

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/SYSTEM_TOOLS/recommendations',
        headers: { cookie: adminCookie },
        payload: {
          slot: 'EDITOR_PICK',
          targetType: 'SOFTWARE',
          targetId: realTool.id,
          badgeText: 'P873测试徽章',
          sortOrder: 0,
          isActive: true,
        },
      });
      assert.strictEqual(createRes.statusCode, 201);
      const recId = JSON.parse(createRes.payload).data.id;
      tempIds.recIds.push(recId);

      const sysAfter = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' })).payload).data;
      assert(sysAfter.editorPicks.some((x: any) => x.id === realTool.id && x.badgeText === 'P873测试徽章'));

      const swAfter = JSON.stringify(JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/software' })).payload).data.heroSlides);
      assert.strictEqual(swBefore, swAfter, '配置 SYSTEM_TOOLS 不得影响电脑软件频道');

      await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/channels/SYSTEM_TOOLS/recommendations/${recId}`,
        headers: { cookie: adminCookie },
      });
    });

    // -------------------------------------------------------------
    // 4. SSR SEO / Canonical / Sitemap / Robots / 无虚假宣传文案
    // -------------------------------------------------------------
    console.log('\n--- 4. SSR SEO、Sitemap 与诚信安全文案检查 ---');

    await it('4.1 GET /system-tools SSR HTML 返回 200、独立 Canonical、JSON-LD 且无虚假免毒宣称', async () => {
      const ssr = await app.inject({ method: 'GET', url: '/system-tools' });
      assert.strictEqual(ssr.statusCode, 200);
      const html = ssr.payload;
      assert(html.includes('<h1') && html.includes('专业电脑维护与系统工具中心'));
      assert(html.includes('/system-tools"'), 'SSR Canonical 应包含 /system-tools');
      assert(html.includes('application/ld+json'));
      assert(!html.includes('所有工具安全无毒'), '不可做虚假免毒保证');
      assert(!html.includes('https://softbuluo.com/'), 'SSR HTML 不可硬编码错误旧域名');

      const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/SystemToolsPage.tsx'), 'utf-8');
      assert(!pageSrc.includes('全部工具经严格人工沙盒验证'), '前端不可保留旧版失实沙盒校验宣传');
      assert(!pageSrc.includes('人工校验\n'), '工具卡不得再统一盲标人工校验');
    });

    await it('4.2 Sitemap 与 Robots 已纳入 /system-tools', async () => {
      const sm = await app.inject({ method: 'GET', url: '/sitemap-software.xml' });
      assert.strictEqual(sm.statusCode, 200);
      assert(sm.payload.includes('/system-tools'), 'sitemap-software.xml 必须包含 /system-tools');

      const rb = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(rb.statusCode, 200);
      assert(rb.payload.includes('Allow: /system-tools'), 'robots.txt 必须放行 /system-tools');
    });
  } finally {
    if (tempIds.recIds.length > 0) {
      await prisma.channelRecommendation.deleteMany({ where: { id: { in: tempIds.recIds } } }).catch(() => {});
    }
    if (tempIds.topicIds.length > 0) {
      await prisma.topic.deleteMany({ where: { id: { in: tempIds.topicIds } } }).catch(() => {});
    }
    if (tempIds.softwareIds.length > 0) {
      await prisma.software.deleteMany({ where: { id: { in: tempIds.softwareIds } } }).catch(() => {});
    }
    if (tempIds.userIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: tempIds.userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: tempIds.userIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.3 测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runP873Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
