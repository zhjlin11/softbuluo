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

export async function runP874Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.4 游戏中心 UI 3.0 自动化验收测试');
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
    const gamesCat = await prisma.category.findFirst({ where: { slug: 'games' } });
    const officeCat = await prisma.category.findFirst({ where: { slug: 'office' } });
    assert(gamesCat && officeCat, '单机游戏与办公分类必须存在');

    const realGamesCount = await prisma.software.count({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.GAME },
    });
    const realGame = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.GAME },
    });
    assert(realGame, '数据库中必须存在已发布的游戏');

    const nonGamePublished = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.SOFTWARE },
    });

    const draftGame = await prisma.software.create({
      data: {
        name: `P874DraftGame-${ts}`,
        slug: `p874-draft-game-${ts}`,
        developer: 'Draft Studio',
        summary: '未发布草稿游戏，严禁前台露出',
        description: 'Draft Isolation Test',
        categoryId: gamesCat.id,
        type: ResourceType.GAME,
        status: ResourceStatus.DRAFT,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(draftGame.id);

    const testGame = await prisma.software.create({
      data: {
        name: `P874TestGame-${ts}`,
        slug: `p874-test-game-${ts}`,
        developer: 'Test Studio',
        summary: '测试游戏样本，严禁露出正式频道',
        description: 'Test Isolation',
        categoryId: gamesCat.id,
        type: ResourceType.GAME,
        status: ResourceStatus.PUBLISHED,
        isTestData: true,
      },
    });
    tempIds.softwareIds.push(testGame.id);

    const adminUser = await prisma.user.create({
      data: {
        username: `p874_admin_${ts}`,
        email: `p874_admin_${ts}@softtribe.local`,
        passwordHash: await hashPassword('AdminP874Pass!123'),
        role: Role.ADMIN,
      },
    });
    tempIds.userIds.push(adminUser.id);

    const normalUser = await prisma.user.create({
      data: {
        username: `p874_user_${ts}`,
        email: `p874_user_${ts}@softtribe.local`,
        passwordHash: await hashPassword('UserP874Pass!123'),
        role: Role.USER,
      },
    });
    tempIds.userIds.push(normalUser.id);

    // -------------------------------------------------------------
    // 1. /api/v1/channels/games 聚合接口、真实性与严格隔离
    // -------------------------------------------------------------
    console.log('--- 1. 游戏中心聚合接口、图片资源与样本诚实性 ---');

    await it('1.1 /api/v1/channels/games 返回真实已发布游戏数量，绝不泄露草稿与测试数据', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/games' });
      assert.strictEqual(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.strictEqual(body.success, true);

      const d = body.data;
      assert.strictEqual(d.channel, 'GAMES');
      assert.strictEqual(d.meta.totalGamesCount, realGamesCount, '游戏总数必须严格等于已发布非测试 GAME 数量');
      assert(d.heroSlides.length >= 1 && d.heroSlides.length <= 5, 'Hero 轮播应为 1-5 张');
      for (const slide of d.heroSlides) {
        assert(slide.coverImage && slide.coverImage.startsWith('/images/games/'), 'Hero 应使用有效本地游戏图片/矢量横幅');
      }

      const rawStr = JSON.stringify(d);
      assert(!rawStr.includes(draftGame.slug), '禁止泄露草稿游戏 slug');
      assert(!rawStr.includes(testGame.slug), '禁止泄露 isTestData 测试游戏 slug');
      assert(!rawStr.includes('vv146'), '禁止出现重复版本号前缀 vv146');
    });

    await it('1.2 配套辅助工具与游戏本体严格隔离，专题不夸大数量且攻略不暴露草稿游戏', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/games' });
      const d = JSON.parse(res.payload).data;

      assert(Array.isArray(d.companionTools) && d.companionTools.length >= 1, '应单独列出游戏录屏/回放辅助工具');
      for (const ct of d.companionTools) {
        assert.strictEqual(ct.isCompanionTool, true);
        assert.notStrictEqual(ct.type, 'GAME', '辅助工具不可冒充 GAME 类型');
      }

      for (const gb of d.genreBlocks) {
        assert(gb.totalCount > 0 && gb.games.length > 0, '前台题材块不允许存在 0 数量的空分类');
        for (const g of gb.games) {
          assert.strictEqual(g.type, 'GAME');
        }
      }

      for (const t of d.hotTopics) {
        assert(t.resourceCount >= 1 && t.resourceCount <= d.meta.totalGamesCount, '专题统计数仅能计入已发布 GAME 数量');
      }

      for (const g of d.guides) {
        assert(!g.slug.includes('openra'), '未发布草稿 OpenRA 关联教程不得在前台作为可玩游戏攻略暴露');
      }
    });

    await it('1.3 诚实排行榜与来源核验描述：绝不伪造 0 计分，绝不虚标 SHA-256 校验', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/channels/games' });
      const d = JSON.parse(res.payload).data;

      for (const row of d.leaderboards.popularTop) {
        assert(row.software.viewCount > 0, '热度榜禁止用 0 浏览凑数');
        assert.strictEqual(row.software.type, 'GAME');
      }
      for (const row of d.leaderboards.downloadsTop) {
        assert(row.software.downloadCount > 0, '下载榜禁止用 0 下载凑数');
        assert.strictEqual(row.software.type, 'GAME');
      }

      for (const sg of d.spotlightGames) {
        if (sg.verifiedSha256Count === 0) {
          assert(!sg.deliveryLabel.includes('已核验直连'), '无 SHA-256 且无健康直连时不可宣传为已核验直连');
        }
      }
    });

    // -------------------------------------------------------------
    // 2. 游戏资源检索过滤 /api/v1/resources?type=GAME
    // -------------------------------------------------------------
    console.log('\n--- 2. 游戏多维过滤接口精确度与隔离验证 ---');

    await it('2.1 genre / platform / license / search 精确过滤且不混入非游戏与草稿', async () => {
      const allRes = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME' })).payload);
      assert.strictEqual(allRes.data.total, realGamesCount);
      assert(allRes.data.items.every((x: any) => x.type === 'GAME'));

      const strategyRes = JSON.parse(
        (await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME&genre=strategy-tower' })).payload
      );
      assert(strategyRes.data.items.some((x: any) => x.slug === 'mindustry'), '策略塔防应命中 Mindustry');
      assert(!strategyRes.data.items.some((x: any) => x.slug === 'supertuxkart'), '策略塔防不得返回 SuperTuxKart');

      const racingRes = JSON.parse(
        (await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME&genre=racing-sports' })).payload
      );
      assert(racingRes.data.items.some((x: any) => x.slug === 'supertuxkart'), '3D竞速应命中 SuperTuxKart');
      assert(!racingRes.data.items.some((x: any) => x.slug === 'mindustry'), '3D竞速不得返回 Mindustry');

      const macRes = JSON.parse(
        (await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME&platform=macOS' })).payload
      );
      assert(macRes.data.items.length >= 1, '支持 macOS 跨平台游戏应可被命中');

      const noneRes = JSON.parse(
        (await app.inject({ method: 'GET', url: '/api/v1/resources?type=GAME&search=ZZZ不存在游戏XYZ' })).payload
      );
      assert.strictEqual(noneRes.data.items.length, 0, '无匹配关键词时应返回空数组');
    });

    // -------------------------------------------------------------
    // 3. GAMES 后台运营权限、校验边界与频道隔离
    // -------------------------------------------------------------
    console.log('\n--- 3. GAMES 后台配置鉴权与频道零回归 ---');

    await it('3.1 未登录与普通用户严格拦截 (401/403)', async () => {
      const anon = await app.inject({ method: 'GET', url: '/api/v1/admin/channels/GAMES/recommendations' });
      assert.strictEqual(anon.statusCode, 401);

      const userLogin = await app.inject({
        method: 'POST',
        url: '/api/v1/members/login',
        payload: { identifier: normalUser.username, password: 'UserP874Pass!123' },
      });
      if (userLogin.statusCode === 200) {
        const userCookie = userLogin.headers['set-cookie'] as string;
        const forbidden = await app.inject({
          method: 'GET',
          url: '/api/v1/admin/channels/GAMES/candidates',
          headers: { cookie: userCookie },
        });
        assert(forbidden.statusCode === 401 || forbidden.statusCode === 403);
      }
    });

    await it('3.2 Admin 候选仅列游戏本体，POST 拒绝草稿/测试/非游戏软件且不影响 SOFTWARE / SYSTEM_TOOLS', async () => {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/login',
        payload: { identifier: adminUser.username, password: 'AdminP874Pass!123' },
      });
      assert.strictEqual(loginRes.statusCode, 200);
      const adminCookie = loginRes.headers['set-cookie'] as string;

      const candRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/channels/GAMES/candidates',
        headers: { cookie: adminCookie },
      });
      assert.strictEqual(candRes.statusCode, 200);
      const candSoftwares = JSON.parse(candRes.payload).data.softwares;
      assert(candSoftwares.length === realGamesCount);
      assert(!candSoftwares.some((s: any) => s.id === draftGame.id || s.id === testGame.id));

      const badIds = [draftGame.id, testGame.id, ...(nonGamePublished ? [nonGamePublished.id] : [])];
      for (const badId of badIds) {
        const badRes = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/channels/GAMES/recommendations',
          headers: { cookie: adminCookie },
          payload: { slot: 'HERO', targetType: 'SOFTWARE', targetId: badId },
        });
        assert.strictEqual(badRes.statusCode, 400, `GAMES 频道必须拒绝非法/非游戏目标: ${badId}`);
      }

      const swBefore = JSON.stringify(
        JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/software' })).payload).data.heroSlides
      );
      const stBefore = JSON.stringify(
        JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' })).payload).data.heroSlides
      );

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/channels/GAMES/recommendations',
        headers: { cookie: adminCookie },
        payload: {
          slot: 'HERO',
          targetType: 'SOFTWARE',
          targetId: realGame.id,
          badgeText: 'P874测试推荐',
          sortOrder: 0,
          isActive: true,
        },
      });
      assert.strictEqual(createRes.statusCode, 201);
      const recId = JSON.parse(createRes.payload).data.id;
      tempIds.recIds.push(recId);

      const gamesAfter = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/games' })).payload).data;
      assert(gamesAfter.heroSlides.some((s: any) => s.badge === 'P874测试推荐'));

      const swAfter = JSON.stringify(
        JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/software' })).payload).data.heroSlides
      );
      const stAfter = JSON.stringify(
        JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/channels/system-tools' })).payload).data.heroSlides
      );
      assert.strictEqual(swBefore, swAfter, '配置 GAMES 不得影响 /software');
      assert.strictEqual(stBefore, stAfter, '配置 GAMES 不得影响 /system-tools');

      await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/channels/GAMES/recommendations/${recId}`,
        headers: { cookie: adminCookie },
      });
    });

    // -------------------------------------------------------------
    // 4. SSR / Canonical / Sitemap / Robots / 无虚假安全文案
    // -------------------------------------------------------------
    console.log('\n--- 4. SSR SEO、Sitemap、Robots 与诚实声明审计 ---');

    await it('4.1 GET /games SSR 返回 200、独立 /games Canonical、JSON-LD 且无草稿/虚假校验宣称', async () => {
      const ssr = await app.inject({ method: 'GET', url: '/games' });
      assert.strictEqual(ssr.statusCode, 200);
      const html = ssr.payload;
      assert(html.includes('<h1') && html.includes('精品独立与开源 PC 游戏中心'));
      assert(html.includes('/games"'), 'SSR Canonical 必须包含 /games');
      assert(html.includes('application/ld+json'));
      assert(!html.includes('https://softbuluo.com/'), '禁止硬编码旧域名');
      assert(!html.includes(draftGame.name), 'SSR HTML 禁止泄露草稿游戏');
      assert(!html.includes('官方原厂哈希') || !html.includes('无捆绑 · 无内置充值 · 官方原厂哈希'));
    });

    await it('4.2 Sitemap 与 Robots 准确包含 /games，未混入其它 Sitemap', async () => {
      const smGames = await app.inject({ method: 'GET', url: '/sitemap-games.xml' });
      assert.strictEqual(smGames.statusCode, 200);
      assert(smGames.payload.includes('/games</loc>'), 'sitemap-games.xml 必须包含 /games');

      const smTopics = await app.inject({ method: 'GET', url: '/sitemap-topics.xml' });
      assert(!smTopics.payload.includes('/games</loc>'), 'sitemap-topics.xml 不得误收 /games');

      const rb = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(rb.statusCode, 200);
      assert(rb.payload.includes('Allow: /games'), 'robots.txt 必须收录 Allow: /games');

      const staticRb = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf-8');
      assert(staticRb.includes('Allow: /games'), 'public/robots.txt 必须同步 Allow: /games');

      const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/GamesPage.tsx'), 'utf-8');
      assert(!pageSrc.includes('无内置充值 · 官方原厂哈希'), '新版 GamesPage 不得残留虚假无条件哈希宣称');
    });
  } finally {
    if (tempIds.recIds.length > 0) {
      await prisma.channelRecommendation.deleteMany({ where: { id: { in: tempIds.recIds } } }).catch(() => {});
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
  console.log(`📊 P8.7.4 测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runP874Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
