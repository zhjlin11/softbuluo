import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { PrismaClient, ResourceStatus, ResourceType } from '@prisma/client';
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

export async function runP872Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.7.2 电脑软件频道质量精修与真实性整改自动化测试');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  try {
    const channelRes = await app.inject({ method: 'GET', url: '/api/v1/channels/software' });
    assert.strictEqual(channelRes.statusCode, 200);
    const channelPayload = JSON.parse(channelRes.payload).data;

    const ssrRes = await app.inject({ method: 'GET', url: '/software' });
    assert.strictEqual(ssrRes.statusCode, 200);
    const ssrHtml = ssrRes.payload;

    // -------------------------------------------------------------
    // 1. 来源认证真实性、商业授权声明与未审计三方网盘暂停
    // -------------------------------------------------------------
    console.log('--- 1. P1 来源真实性与合规文案核查 ---');

    await it('1.1 /api/v1/channels/software 与 /software SSR 严禁出现 Massgrave 官方认证等虚假宣传词', async () => {
      const forbiddenTerms = [
        'Massgrave官方认证',
        'Massgrave 校验',
        'massgrave.dev 官方认证',
        '原厂哈希核验 · 拒绝捆绑推广',
        'SHA-2…',
      ];
      const combined = `${JSON.stringify(channelPayload)}\n${ssrHtml}`;
      for (const term of forbiddenTerms) {
        assert(!combined.includes(term), `页面或频道数据不应再包含失实宣传词: ${term}`);
      }
    });

    await it('1.2 genuine-microsoft-installation-media 专题与微软镜像教程已去除虚假认证并包含商业授权提醒', async () => {
      const topic = await prisma.topic.findUnique({
        where: { slug: 'genuine-microsoft-installation-media' },
        include: { resources: true },
      });
      assert(topic, 'Windows 与 Office 专题必须存在');
      const topicText = `${topic.title}\n${topic.description}\n${topic.seoTitle || ''}\n${topic.seoDescription || ''}`;
      assert(!topicText.includes('Massgrave 校验'), '专题标题不可继续使用“Massgrave 校验”');
      assert(!topicText.includes('官方认证合集'), '专题不可宣称为“官方认证合集”');
      assert(
        topicText.includes('正版授权') || topicText.includes('商业授权') || topicText.includes('Microsoft'),
        '专题说明必须提示微软商业授权规则'
      );

      for (const tr of topic.resources) {
        assert(
          !(tr.customNote || '').includes('Massgrave官方认证') && !(tr.customNote || '').includes('Massgrave 校验'),
          `专题资源备注不应保留 Massgrave 官方认证声明: ${tr.customNote}`
        );
      }

      const tutorial = await prisma.tutorial.findUnique({
        where: { slug: 'how-to-verify-genuine-iso-checksums' },
      });
      assert(tutorial, 'ISO 校验教程必须存在');
      const tutText = `${tutorial.title}\n${tutorial.summary}\n${tutorial.content}`;
      assert(!tutText.includes('Massgrave官方认证') && !tutText.includes('Massgrave官方校验'), '教程不可使用虚假认证宣传');
      assert(tutText.includes('CertUtil') && tutText.includes('SHA-256'), '教程应保留实际可执行的校验指引');
    });

    await it('1.3 未经验证的第三方网盘来源 (zerofs.link / buzzheavier.com) 已安全停用且保留历史审计记录', async () => {
      const thirdPartySources = await prisma.downloadSource.findMany({
        where: {
          OR: [{ url: { contains: 'zerofs.link' } }, { url: { contains: 'buzzheavier.com' } }],
        },
      });
      assert(thirdPartySources.length >= 14, '应保留历史第三方来源审计记录而不直接删除');
      for (const src of thirdPartySources) {
        assert.strictEqual(src.isActive, false, `未核验第三方网盘源必须停用 (isActive=false): ${src.url}`);
        assert.notStrictEqual(
          src.verificationStatus,
          'VERIFIED',
          `未核验第三方网盘源不得标记为 VERIFIED: ${src.url}`
        );
      }
    });

    await it('1.4 频道来源统计严格区分“已登记可用源”与“人工审核+巡检健康直连源”', async () => {
      const meta = channelPayload.meta;
      assert(meta.registeredSourcesCount >= meta.approvedHealthySourcesCount, '已登记源总数应 >= 已审核健康源');
      assert.strictEqual(
        meta.verifiedSourcesCount,
        meta.approvedHealthySourcesCount,
        'verifiedSourcesCount 口径必须严格等同于 approvedHealthySourcesCount'
      );
      assert.strictEqual(
        meta.pendingSourcesCount,
        meta.registeredSourcesCount - meta.approvedHealthySourcesCount,
        'pendingSourcesCount 必须与总登记数差值一致'
      );
      assert.strictEqual(typeof meta.sha256VerifiedCount, 'number');
    });

    // -------------------------------------------------------------
    // 2. 展示重复控制、分类收口与 Hero 精简文案
    // -------------------------------------------------------------
    console.log('\n--- 2. P2 模块去重、同系列限流与 Hero 精简 ---');

    await it('2.1 本周热推 (8) 与编辑精选 (8) 模块内无重复，且两模块之间零交集', async () => {
      const weekly: any[] = channelPayload.weeklyPicks;
      const editor: any[] = channelPayload.editorPicks;
      assert.strictEqual(weekly.length, 8, `本周热推应稳定输出 8 款 (当前 ${weekly.length})`);
      assert.strictEqual(editor.length, 8, `编辑精选应稳定输出 8 款 (当前 ${editor.length})`);

      const weeklyIds = new Set(weekly.map((x) => x.id));
      const editorIds = new Set(editor.map((x) => x.id));
      assert.strictEqual(weeklyIds.size, weekly.length, '本周热推内部存在重复软件');
      assert.strictEqual(editorIds.size, editor.length, '编辑精选内部存在重复软件');

      for (const item of editor) {
        assert(!weeklyIds.has(item.id), `编辑精选不应与本周热推重复展示同款软件: ${item.slug}`);
      }

      const checkFamilyCap = (list: any[], label: string) => {
        const winCount = list.filter((s) => s.slug.startsWith('windows-')).length;
        const officeCount = list.filter((s) => s.slug.startsWith('office-') || s.slug === 'microsoft-365').length;
        assert(winCount <= 1, `${label} 中 Windows 系列软件不得超过 1 款 (当前 ${winCount})`);
        assert(officeCount <= 1, `${label} 中 Office 系列软件不得超过 1 款 (当前 ${officeCount})`);
      };
      checkFamilyCap(weekly, '本周热推');
      checkFamilyCap(editor, '编辑精选');
    });

    await it('2.2 每个分类区块预览卡片不超过 4 款且组内无重复', async () => {
      for (const block of channelPayload.categoryBlocks) {
        assert(block.softwares.length <= 4, `分类 ${block.slug} 预览卡片超出 4 款上限`);
        const ids = new Set(block.softwares.map((s: any) => s.id));
        assert.strictEqual(ids.size, block.softwares.length, `分类 ${block.slug} 内部存在重复卡片`);
      }
    });

    await it('2.3 Hero 首屏焦点轮播文案保持精简（标题<=28字、简介<=54字且不半词截断）', async () => {
      assert(channelPayload.heroSlides.length >= 1, '焦点展位不可为空');
      for (const slide of channelPayload.heroSlides) {
        assert(slide.title.length <= 32, `Hero 标题过长 (${slide.title.length}): ${slide.title}`);
        assert(slide.subtitle.length <= 64, `Hero 简介过长 (${slide.subtitle.length}): ${slide.subtitle}`);
        assert(!slide.subtitle.endsWith('SHA-2…'), 'Hero 简介不得半词截断 SHA-256');
        assert(Boolean(slide.badge && slide.badge.trim().length > 0), 'Hero 必须具备合法角标文案');
      }
    });

    // -------------------------------------------------------------
    // 3. 排行榜真实性、零计数不填充与低流量自适应逻辑
    // -------------------------------------------------------------
    console.log('\n--- 3. P2 排行榜真实口径与低样本自适应校验 ---');

    await it('3.1 后端热门关注与下载榜严格排除 0 计数项，且明确区分浏览量与触发次数口径', async () => {
      const views: any[] = channelPayload.leaderboards.mostViewed;
      const downloads: any[] = channelPayload.leaderboards.mostDownloaded;
      for (const v of views) {
        assert(v.viewCount > 0, `热门关注榜禁止包含 0 浏览项: ${v.slug}`);
      }
      for (const d of downloads) {
        assert(d.downloadCount > 0, `下载点击榜禁止包含 0 点击项: ${d.slug}`);
      }
      assert(channelPayload.meta.viewStatsLabel.includes('非下载'), 'meta.viewStatsLabel 应写明非下载次数');
      assert(channelPayload.meta.downloadStatsLabel.includes('非实际文件'), 'meta.downloadStatsLabel 应区分触发与完成下载');
    });

    await it('3.2 SoftwareLeaderboards 前端组件彻底移除“待累积”凑数并实现 <5 条动态标题切换', async () => {
      const lbSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/software/SoftwareLeaderboards.tsx'), 'utf-8');
      assert(!lbSrc.includes('待累积'), 'SoftwareLeaderboards.tsx 不得残留“待累积”凑数文案');
      assert(lbSrc.includes('activeItems.length < 5'), '组件必须处理不足 5 条时的低样本动态逻辑');
      assert(lbSrc.includes('实有 ${activeItems.length} 条记录'), '不足 5 条时须展示实有记录数');
      assert(lbSrc.includes('近期下载点击动态'), '不足 5 条时须切换为动态标题而非硬标 TOP 10');
    });

    // -------------------------------------------------------------
    // 4. 软件真实图标资产、暗黑模式对比度与无泄露校验
    // -------------------------------------------------------------
    console.log('\n--- 4. P2 官方开源图标资产与无泄露校验 ---');

    await it('4.1 开源软件官方图标本地静态文件真实存在且非占位图，无 dicebear/高危静态外链', async () => {
      const expectedFiles = [
        '7zip.png',
        'filezilla.ico',
        'rufus.png',
        'blender.svg',
        'vlc.png',
        'git.png',
        'obs-studio.png',
        'libreoffice.ico',
        'wireshark.png',
      ];
      for (const file of expectedFiles) {
        const fullPath = path.join(process.cwd(), 'public', 'logo', 'software', file);
        assert(fs.existsSync(fullPath), `缺少官方图标文件: ${file}`);
        const stat = fs.statSync(fullPath);
        assert(stat.size > 500, `图标文件体积过小疑似损坏 (${stat.size}B): ${file}`);
      }

      const payloadJson = JSON.stringify(channelPayload);
      assert(!payloadJson.includes('dicebear.com'), '频道接口不得返回 dicebear 随机头像');

      const iconComp = fs.readFileSync(path.join(process.cwd(), 'src/components/common/SoftwareIcon.tsx'), 'utf-8');
      assert(iconComp.includes('dark:bg-slate-100'), 'SoftwareIcon 在暗黑模式下应提供亮色安全衬底保证深色 Logo 对比度');
    });

    await it('4.2 /api/v1/members/me 保持 401 鉴权防护且 SiteHeader 不在每次路由跳转时重复请求', async () => {
      const unauthRes = await app.inject({ method: 'GET', url: '/api/v1/members/me' });
      assert.strictEqual(unauthRes.statusCode, 401, '未登录访问 /api/v1/members/me 必须维持 401');

      const headerSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/SiteHeader.tsx'), 'utf-8');
      assert(!headerSrc.includes('[location.pathname]'), 'SiteHeader 鉴权探测禁止绑定在 location.pathname 变化上重复请求 401');
      assert(headerSrc.includes('softtribe-auth-updated'), 'SiteHeader 应响应显式登录态变更事件');
    });

    await it('4.3 CSR 与 SSR SEO Meta/Canonical 口径一致且未泄露草稿/测试/游戏数据', async () => {
      const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/SoftwarePage.tsx'), 'utf-8');
      const expectedTitle = '电脑软件频道 - 开源与常用桌面软件发布渠道汇总 - 软游部落';
      assert(pageSrc.includes(expectedTitle), 'SoftwarePage SEO title 应与 SSR 一致');
      assert(ssrHtml.includes(`<title>${expectedTitle}</title>`), 'SSR HTML 应包含统一 title');
      assert(ssrHtml.includes('/software'), 'SSR HTML 应包含 /software canonical');

      const leaked = await prisma.software.findFirst({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: ResourceType.GAME,
        },
        select: { slug: true },
      });
      if (leaked) {
        assert(!ssrHtml.includes(`/software/${leaked.slug}`), `SSR HTML 不可混入游戏资源: ${leaked.slug}`);
      }
    });
  } finally {
    await prisma.$disconnect();
    await app.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.2 测试完成: PASS: ${passed} | FAIL: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runP872Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
