import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { PrismaClient, ResourceStatus, ResourceType } from '@prisma/client';
import { buildApp } from '../src/app';
import { governanceService } from '../src/modules/governance/governanceService';

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

export async function runP8741Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.4.1 游戏中心 SEO、CLS 与数据治理专项验收测试');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  try {
    const publishedGames = await prisma.software.findMany({
      where: { type: ResourceType.GAME, status: ResourceStatus.PUBLISHED, isTestData: false },
      select: { slug: true },
    });
    const draftGames = await prisma.software.findMany({
      where: { type: ResourceType.GAME, status: ResourceStatus.DRAFT },
      select: { slug: true },
    });

    // -------------------------------------------------------------
    // 1. Sitemap 与 SEO 静态规则检查 (P1)
    // -------------------------------------------------------------
    console.log('--- 1. Sitemap XML 格式、Nginx 模板与无 HTML 回退验收 ---');

    await it('1.1 /sitemap-games.xml 返回 HTTP 200、application/xml 且不含 HTML 回退', async () => {
      const res = await app.inject({ method: 'GET', url: '/sitemap-games.xml' });
      assert.strictEqual(res.statusCode, 200);
      const ct = String(res.headers['content-type'] || '');
      assert(ct.includes('application/xml') || ct.includes('text/xml'), `Content-Type 应为 XML: ${ct}`);
      assert(!res.payload.includes('<!doctype html') && !res.payload.includes('<html'), '不可回退为 HTML');
      assert(res.payload.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert(res.payload.includes('<urlset') && res.payload.includes('</urlset>'));
    });

    await it('1.2 /sitemap-games.xml URL 精确对应已发布游戏与 /games，绝不泄露草稿与测试数据', async () => {
      const res = await app.inject({ method: 'GET', url: '/sitemap-games.xml' });
      const xml = res.payload;
      assert(xml.includes('/games</loc>'), '必须包含游戏中心主入口 /games');
      for (const pg of publishedGames) {
        assert(xml.includes(`/game/${pg.slug}</loc>`), `必须包含已发布游戏 /game/${pg.slug}`);
      }
      for (const dg of draftGames) {
        assert(!xml.includes(dg.slug), `严禁泄露草稿游戏 ${dg.slug}`);
      }
      assert(!xml.includes('test-tool-'), '严禁泄露测试数据');
    });

    await it('1.3 /sitemap.xml、/sitemap-software.xml、/sitemap-topics.xml、/sitemap-tutorials.xml 全部输出有效 XML 且不混入 P3 脏测试', async () => {
      for (const u of ['/sitemap.xml', '/sitemap-software.xml', '/sitemap-topics.xml', '/sitemap-tutorials.xml']) {
        const res = await app.inject({ method: 'GET', url: u });
        assert.strictEqual(res.statusCode, 200, `${u} 必须返回 200`);
        assert(String(res.headers['content-type'] || '').includes('xml'), `${u} Content-Type 必须为 XML`);
        assert(!res.payload.includes('soft.example.com'), `${u} 不得包含演示域名 soft.example.com`);
        assert(!res.payload.includes('topic-p3-') && !res.payload.includes('tut-p3-'), `${u} 不得包含 P3 测试产物`);
      }
    });

    await it('1.4 SSR /games Canonical、H1 与 robots.txt Allow: /games 一致', async () => {
      const ssr = await app.inject({ method: 'GET', url: '/games' });
      assert.strictEqual(ssr.statusCode, 200);
      assert(ssr.payload.includes('<h1') && ssr.payload.includes('精品独立与开源 PC 游戏中心'));
      assert(ssr.payload.includes('/games"'), 'SSR Canonical 应指向 /games');

      const rb = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(rb.statusCode, 200);
      assert(rb.payload.includes('Allow: /games') && rb.payload.includes('/sitemap-games.xml'));

      const staticRb = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf-8');
      assert(staticRb.includes('Allow: /games'));
    });

    await it('1.5 生产 Nginx 模板与 Vite Dev 代理已配置 Sitemap/Robots 转发且清理过期 public/sitemap.xml', async () => {
      assert(!fs.existsSync(path.join(process.cwd(), 'public/sitemap.xml')), '过期的演示 public/sitemap.xml 必须移除');
      assert(!fs.existsSync(path.join(process.cwd(), 'dist/sitemap.xml')), 'dist 构建目录不得生成静态 sitemap.xml 掩盖后端');

      const prodConf = fs.readFileSync(path.join(process.cwd(), 'softtribe.top.prod.conf'), 'utf-8');
      const matches = prodConf.match(/sitemap\(-\[a-z0-9-\]\+\)\?\\\.xml\|robots\\\.txt/g) || [];
      assert(matches.length >= 2, 'softtribe.top.prod.conf 443 与 8080 端口均须配置 Sitemap/Robots 代理规则');
      assert(prodConf.includes('proxy_pass http://127.0.0.1:3008'), 'Nginx 必须反代至 127.0.0.1:3008 Fastify');

      const viteConf = fs.readFileSync(path.join(process.cwd(), 'vite.config.ts'), 'utf-8');
      assert(viteConf.includes('sitemap'), 'vite.config.ts 开发代理应支持 Sitemap XML 穿透');
    });

    // -------------------------------------------------------------
    // 2. CLS 结构防偏移检查 (P2)
    // -------------------------------------------------------------
    console.log('\n--- 2. 首屏 Suspense 占位与游戏图片尺寸防 CLS 检查 ---');

    await it('2.1 App.tsx PageLoadingFallback 已避免矮壳 Footer 上蹿，且 Games 图片均显式预留 width/height', async () => {
      const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
      assert(!appSrc.includes('min-h-[50vh]'), 'PageLoadingFallback 不得再使用过矮的 min-h-[50vh]');
      assert(appSrc.includes('min-h-[calc(100vh-64px)]'), 'PageLoadingFallback 应预留视口级最小高度，避免 Footer 跳动');

      for (const rel of [
        'src/components/games/GamesPortalHero.tsx',
        'src/components/games/GamesSpotlightGallery.tsx',
        'src/components/games/GamesEditorialAndUpdates.tsx',
        'src/components/games/GamesCatalogSection.tsx',
      ]) {
        const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');
        assert(src.includes('width={') && src.includes('height={'), `${rel} 图片应显式声明 width/height`);
      }
    });

    // -------------------------------------------------------------
    // 3. P5 治理口径与历史测试数据隔离验证 (P2)
    // -------------------------------------------------------------
    console.log('\n--- 3. P5 完整率真实口径与历史测试隔离清理验收 ---');

    await it('3.1 GovernanceService 官方完整性指标排除 isTestData: true 且达标 >= 65%', async () => {
      const metrics = await governanceService.getGovernanceMetrics();
      assert(metrics.totalResources >= 90, `非测试正式资源数量达标: ${metrics.totalResources}`);
      assert(metrics.completenessRate >= 65, `官方资源完整率达标: ${metrics.completenessRate}%`);

      const leakedTestTools = await prisma.software.count({
        where: { isTestData: true, slug: { startsWith: 'test-tool-' } },
      });
      const leakedFastcopy = await prisma.software.count({ where: { slug: 'fastcopy-extreme' } });
      const leakedTopics = await prisma.topic.count({ where: { slug: { startsWith: 'topic-p3-' } } });
      const leakedTutorials = await prisma.tutorial.count({ where: { slug: { startsWith: 'tut-p3-' } } });
      assert.strictEqual(leakedTestTools, 0, '历史残留 test-tool-* 应已清理为 0');
      assert.strictEqual(leakedFastcopy, 0, '历史残留 fastcopy-extreme 应已清理为 0');
      assert.strictEqual(leakedTopics, 0, '历史残留 topic-p3-* 应已清理为 0');
      assert.strictEqual(leakedTutorials, 0, '历史残留 tut-p3-* 应已清理为 0');
    });

    // -------------------------------------------------------------
    // 4. 游戏数据、频道与关键路由零回归 (保护边界)
    // -------------------------------------------------------------
    console.log('\n--- 4. 游戏频道数据与全站基础路由保护验收 ---');

    await it('4.1 游戏中心数据保持真实 (2 发布 / 8 草稿不变)，首页/软件/系统工具 SSR 完好', async () => {
      assert.strictEqual(publishedGames.length, 2, '禁止擅自改变已发布游戏数量 (应保持 2 款)');
      assert.strictEqual(draftGames.length, 8, '禁止擅自转正 8 款草稿游戏');

      for (const url of ['/', '/software', '/system-tools', '/games']) {
        const res = await app.inject({ method: 'GET', url });
        assert.strictEqual(res.statusCode, 200, `${url} SSR 应返回 200`);
      }
    });
  } finally {
    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.4.1 专项测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');
  if (failed > 0) process.exit(1);
}

runP8741Tests().catch((e) => {
  console.error(e);
  process.exit(1);
});
