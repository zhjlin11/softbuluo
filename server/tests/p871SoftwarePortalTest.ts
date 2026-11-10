import assert from 'assert';
import {
  PrismaClient,
  ResourceStatus,
  ResourceType,
  TopicStatus,
  Role,
} from '@prisma/client';
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

export async function runP871Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.1 电脑软件频道 UI 3.0 与运营安全自动化测试');
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
    const defaultCategory = await prisma.category.findFirst({ where: { slug: 'office' } });
    assert(defaultCategory, '办公软件分类必须存在');

    const publishedSoftware = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: { not: ResourceType.GAME } },
      orderBy: { viewCount: 'desc' },
    });
    assert(publishedSoftware, '必须至少存在一款已发布非测试桌面软件');

    const draftSoftware = await prisma.software.create({
      data: {
        name: `P871DraftLeakCheck-${ts}`,
        slug: `p871-draft-${ts}`,
        developer: 'Draft Dev',
        summary: '草稿拦截测试软件',
        description: '严禁对外泄露',
        categoryId: defaultCategory.id,
        type: ResourceType.SOFTWARE,
        status: ResourceStatus.DRAFT,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(draftSoftware.id);

    const testDataSoftware = await prisma.software.create({
      data: {
        name: `P871TestDataLeakCheck-${ts}`,
        slug: `p871-test-${ts}`,
        developer: 'Test Dev',
        summary: '测试数据拦截软件',
        description: '严禁向公开频道泄露',
        categoryId: defaultCategory.id,
        type: ResourceType.TOOL,
        status: ResourceStatus.PUBLISHED,
        isTestData: true,
      },
    });
    tempIds.softwareIds.push(testDataSoftware.id);

    const gameSoftware = await prisma.software.create({
      data: {
        name: `P871GameExcludeCheck-${ts}`,
        slug: `p871-game-${ts}`,
        developer: 'Game Dev',
        summary: '游戏排除校验',
        description: '不应混入电脑软件频道',
        categoryId: defaultCategory.id,
        type: ResourceType.GAME,
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(gameSoftware.id);

    const draftTopic = await prisma.topic.create({
      data: {
        title: `P871DraftTopic-${ts}`,
        slug: `p871-draft-topic-${ts}`,
        description: '草稿专题不得推荐',
        status: TopicStatus.DRAFT,
      },
    });
    tempIds.topicIds.push(draftTopic.id);

    const adminUser = await prisma.user.create({
      data: {
        username: `p871_admin_${ts}`,
        email: `p871_admin_${ts}@softtribe.local`,
        passwordHash: await hashPassword('AdminP871Pass!123'),
        role: Role.ADMIN,
      },
    });
    tempIds.userIds.push(adminUser.id);

    // -------------------------------------------------------------
    // 1. 电脑软件频道聚合接口与真实数据口径验证
    // -------------------------------------------------------------
    console.log('--- 1. 频道聚合数据与真实性核验 ---');

    let channelPayload: any = null;

    await it('1.1 GET /api/v1/channels/software 返回完整合法频道结构', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.success, true);
      channelPayload = json.data;

      assert(channelPayload.meta.totalSoftwareCount >= 20, '应真实统计全部桌面软件总量');
      assert(channelPayload.heroSlides.length >= 1, '焦点展位不可为空');
      assert(channelPayload.weeklyPicks.length >= 8, '本周热推矩阵应至少包含 8 款软件');
      assert(channelPayload.editorPicks.length >= 6, '编辑精选应至少包含 6 款软件');
      assert(channelPayload.leaderboards.mostViewed.length >= 10, '热门关注 TOP10 应完整');
      assert(channelPayload.leaderboards.mostDownloaded.length >= 10, '下载点击 TOP10 应完整');
      assert(channelPayload.hotTopics.length >= 1, '应包含真实专题推荐');
      assert(channelPayload.tutorials.length >= 1, '应包含实用教程');
      assert(channelPayload.comparisons.length >= 1, '应包含对比评测');
    });

    await it('1.2 分类统计排除测试数据并准确匹配真实发布总量', async () => {
      const officeCat = channelPayload.categories.find((c: any) => c.slug === 'office');
      assert(officeCat, '应包含办公软件分类');
      assert(officeCat.count < 25, `办公软件真实计数 (${officeCat.count}) 不得混入测试数据(如 41)`);
      const sumCat = channelPayload.categories.reduce((acc: number, c: any) => acc + c.count, 0);
      assert.strictEqual(sumCat, channelPayload.meta.totalSoftwareCount, '各分类真实总数之和应等于频道总软件数');
    });

    await it('1.3 排行榜严格按真实浏览与非测试下载事件降序排列，杜绝伪造计数', async () => {
      const views = channelPayload.leaderboards.mostViewed;
      for (let i = 1; i < views.length; i++) {
        assert(views[i - 1].viewCount >= views[i].viewCount, '热门关注榜必须按 viewCount 严格降序');
      }
      const dls = channelPayload.leaderboards.mostDownloaded;
      for (let i = 1; i < dls.length; i++) {
        assert(dls[i - 1].downloadCount >= dls[i].downloadCount, '下载点击榜必须按 downloadCount 严格降序');
      }
      assert(dls[0].downloadCount < 500, '下载数字必须为真实统计值，严禁伪造 9999+ 虚高数据');
    });

    await it('1.4 专题列表过滤 P3 自动化测试专题，且每个专题至少关联 1 款已发布软件', async () => {
      for (const topic of channelPayload.hotTopics) {
        assert(!topic.slug.startsWith('topic-p3-'), `不得泄露 P3 测试专题: ${topic.slug}`);
        assert(topic.resourceCount > 0, `专题 ${topic.slug} 的有效关联软件数必须大于 0`);
      }
      for (const tut of channelPayload.tutorials) {
        assert(!tut.slug.startsWith('tut-p3-'), `不得泄露 P3 测试教程: ${tut.slug}`);
      }
    });

    await it('1.5 最近更新与新收录严格分开，且版本更新列表按软件去重不刷屏', async () => {
      const updates = channelPayload.latestUpdates.versionUpdates;
      assert(updates.length >= 6, '应有多个独立软件的版本更新记录');
      const seenSlugs = new Set<string>();
      for (const item of updates) {
        assert(!seenSlugs.has(item.slug), `版本更新列表不应重复刷屏同一软件: ${item.slug}`);
        seenSlugs.add(item.slug);
        assert(item.releaseDate, '版本更新必须带有原厂发布日期');
      }
      const cataloged = channelPayload.latestUpdates.newlyCataloged;
      assert(cataloged.length >= 6, '应包含新收录桌面软件列表');
      for (let i = 1; i < cataloged.length; i++) {
        assert(
          new Date(cataloged[i - 1].catalogedAt).getTime() >= new Date(cataloged[i].catalogedAt).getTime(),
          '新收录列表必须按 catalogedAt 严格降序'
        );
      }
    });

    await it('1.6 草稿、测试数据与游戏资源绝对隔离于公开电脑软件接口', async () => {
      const payloadStr = JSON.stringify(channelPayload);
      assert(!payloadStr.includes(draftSoftware.slug), '频道数据禁止泄露 DRAFT 软件');
      assert(!payloadStr.includes(testDataSoftware.slug), '频道数据禁止泄露 isTestData=true 软件');
      assert(!payloadStr.includes(gameSoftware.slug), '电脑软件频道禁止混入 GAME 类型资源');
      assert(!payloadStr.includes(draftTopic.slug), '频道数据禁止泄露 DRAFT 专题');
    });

    // -------------------------------------------------------------
    // 2. 桌面全量过滤与分类计数接口验证
    // -------------------------------------------------------------
    console.log('\n--- 2. 桌面全量检索与分类筛选验证 ---');

    await it('2.1 /api/v1/resources?type=DESKTOP 同时覆盖 SOFTWARE 与 TOOL 且排除 GAME/DRAFT/Test', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=DESKTOP&limit=50' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      const items = json.data.items;
      const types = new Set(items.map((x: any) => x.type));
      assert(types.has('SOFTWARE') && types.has('TOOL'), 'DESKTOP 筛选应同时包含 SOFTWARE 与 TOOL');
      assert(!types.has('GAME'), 'DESKTOP 筛选绝对禁止包含 GAME');
      assert(!items.some((x: any) => x.slug === draftSoftware.slug || x.slug === testDataSoftware.slug));
    });

    await it('2.2 /api/v1/resources?type=DESKTOP&categorySlug=sys-tools 正常返回系统工具（修复 0 结果 Bug）', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/resources?type=DESKTOP&categorySlug=sys-tools' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.total >= 5, `系统工具分类应返回有效桌面工具，当前: ${json.data.total}`);
    });

    await it('2.3 /api/v1/categories?excludeType=GAME 排除测试数据并反映真实可点击分类量', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/categories?excludeType=GAME' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      const office = json.data.find((c: any) => c.slug === 'office');
      assert(office && office.itemCount < 25, `办公软件分类真实数异常: ${office?.itemCount}`);
    });

    // -------------------------------------------------------------
    // 3. 后台频道运营推荐配置与安全边界校验
    // -------------------------------------------------------------
    console.log('\n--- 3. 后台频道推荐配置与权限安全边界测试 ---');

    await it('3.1 未授权访问后台频道运营接口必须返回 401', async () => {
      const r1 = await app.inject({ method: 'GET', url: '/api/v1/admin/channels/SOFTWARE/recommendations' });
      assert.strictEqual(r1.statusCode, 401);
      const r2 = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/SOFTWARE/recommendations',
        payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: publishedSoftware.id },
      });
      assert.strictEqual(r2.statusCode, 401);
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { identifier: adminUser.username, password: 'AdminP871Pass!123' },
    });
    assert.strictEqual(loginRes.statusCode, 200, '管理员登录测试账号必须成功');
    const adminCookie = loginRes.headers['set-cookie'] as string;

    await it('3.2 管理员推荐接口严禁绕过审核推荐 DRAFT / isTestData=true / GAME 资源', async () => {
      for (const badId of [draftSoftware.id, testDataSoftware.id, gameSoftware.id]) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/channels/SOFTWARE/recommendations',
          headers: { cookie: adminCookie },
          payload: { slot: 'WEEKLY_PICK', targetType: 'SOFTWARE', targetId: badId },
        });
        assert.strictEqual(res.statusCode, 400);
        const body = JSON.parse(res.payload);
        assert.strictEqual(body.error.code, 'ONLY_PUBLISHED_NON_TEST_ALLOWED');
      }

      const topicRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/SOFTWARE/recommendations',
        headers: { cookie: adminCookie },
        payload: { slot: 'HERO', targetType: 'TOPIC', targetId: draftTopic.id },
      });
      assert.strictEqual(topicRes.statusCode, 400);
    });

    await it('3.3 后台封面地址严格拦截 XSS/内网SSRF/非HTTPS/路径穿越', async () => {
      const badUrls = [
        'javascript:alert(1)',
        'http://insecure.example.com/banner.jpg',
        'https://127.0.0.1/secret.png',
        '//evil.com/phish.png',
        '/../etc/passwd',
      ];
      for (const coverImage of badUrls) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/channels/SOFTWARE/recommendations',
          headers: { cookie: adminCookie },
          payload: {
            slot: 'HERO',
            targetType: 'SOFTWARE',
            targetId: publishedSoftware.id,
            coverImage,
          },
        });
        assert.strictEqual(res.statusCode, 400, `必须拦截危险图片 URL: ${coverImage}`);
        const body = JSON.parse(res.payload);
        assert.strictEqual(body.error.code, 'UNSAFE_IMAGE_URL');
      }
    });

    await it('3.4 合法推荐配置生效、停用过滤、目标下线自动隐身及清理完整闭环', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/SOFTWARE/recommendations',
        headers: { cookie: adminCookie },
        payload: {
          slot: 'HERO',
          targetType: 'SOFTWARE',
          targetId: publishedSoftware.id,
          title: `P871置顶焦点-${ts}`,
          badgeText: '编辑严选',
          sortOrder: 0,
          isActive: true,
        },
      });
      assert.strictEqual(createRes.statusCode, 201);
      const created = JSON.parse(createRes.payload).data;
      tempIds.recIds.push(created.id);

      // 前台聚合接口应立即体现该焦点标题
      const pubRes1 = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
      const slides1 = JSON.parse(pubRes1.payload).data.heroSlides;
      assert(slides1.some((s: any) => s.title === `P871置顶焦点-${ts}`), '启用的推荐配置必须实时出现在 Hero 展位');

      // 停用后立即从前台撤出
      const patchRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/channels/SOFTWARE/recommendations/${created.id}`,
        headers: { cookie: adminCookie },
        payload: { isActive: false },
      });
      assert.strictEqual(patchRes.statusCode, 200);
      const pubRes2 = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
      const slides2 = JSON.parse(pubRes2.payload).data.heroSlides;
      assert(!slides2.some((s: any) => s.title === `P871置顶焦点-${ts}`), '停用的推荐配置不得出现在前台');

      // 删除清理
      const delRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/channels/SOFTWARE/recommendations/${created.id}`,
        headers: { cookie: adminCookie },
      });
      assert.strictEqual(delRes.statusCode, 200);
    });

    // -------------------------------------------------------------
    // 4. SEO SSR HTML 与 Sitemap / Robots 规范检查
    // -------------------------------------------------------------
    console.log('\n--- 4. /software SEO SSR 与爬虫规范检查 ---');

    await it('4.1 GET /software 服务端输出完整语义 HTML5，含 Canonical 与 JSON-LD 且无草稿泄露', async () => {
      const res = await app.inject({ method: 'GET', url: '/software' });
      assert.strictEqual(res.statusCode, 200);
      assert(String(res.headers['content-type']).includes('text/html'));
      const html = res.payload;
      assert(html.includes('<h1') && html.includes('电脑软件频道'), 'SSR 页面必须有明确 H1 标题');
      assert(html.includes('rel="canonical"') && html.includes('/software"'), 'Canonical 必须精准指向 /software');
      assert(html.includes('application/ld+json') && html.includes('CollectionPage'), '必须输出 CollectionPage JSON-LD');
      assert(!html.includes(draftSoftware.slug), 'SSR HTML 禁止泄露草稿软件');
    });

    await it('4.2 /sitemap-software.xml 与 /robots.txt 正确暴露 /software 索引路径', async () => {
      const smRes = await app.inject({ method: 'GET', url: '/sitemap-software.xml' });
      assert.strictEqual(smRes.statusCode, 200);
      assert(smRes.payload.includes('/software</loc>'), '软件 sitemap 必须收录 /software 频道页');

      const rbRes = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(rbRes.statusCode, 200);
      assert(rbRes.payload.includes('Allow: /software'), 'robots.txt 必须放行 /software');
    });
  } finally {
    for (const rid of tempIds.recIds) {
      await prisma.channelRecommendation.deleteMany({ where: { id: rid } }).catch(() => {});
    }
    for (const sid of tempIds.softwareIds) {
      await prisma.software.deleteMany({ where: { id: sid } }).catch(() => {});
    }
    for (const tid of tempIds.topicIds) {
      await prisma.topic.deleteMany({ where: { id: tid } }).catch(() => {});
    }
    if (tempIds.userIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: tempIds.userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: tempIds.userIds } } }).catch(() => {});
    }

    await app.close();
    await prisma.$disconnect();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.1 测试执行完毕: 通过: ${passed} | 失败: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('p871SoftwarePortalTest')) {
  runP871Tests().catch((err) => {
    console.error('P8.7.1 测试运行异常:', err);
    process.exit(1);
  });
}
