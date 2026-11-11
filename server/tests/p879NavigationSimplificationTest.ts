import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/db';
import { MAIN_NAV_ITEMS } from '../../src/config/navigation';
import { siteConfig } from '../../src/config/site';

const BASE_URL = 'http://127.0.0.1:3001';

export async function runP879NavigationSimplificationTests() {
  console.log('🧪 P8.7.9 顶部导航精简与前台入口治理自动化验收测试');
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

  // 1. 核心导航配置断言
  console.log('▶ [1/6] 验证统一主导航配置 (MAIN_NAV_ITEMS)...');
  await test('主导航项目数量严格等于 7 个', () => {
    assert.strictEqual(MAIN_NAV_ITEMS.length, 7, `期望 7 个导航项目，实际为 ${MAIN_NAV_ITEMS.length}`);
  });

  await test('主导航顺序严格为：首页 -> 电脑软件 -> 系统工具 -> 游戏中心 -> 装机必备 -> 软件教程 -> 最新更新', () => {
    const expectedLabels = ['首页', '电脑软件', '系统工具', '游戏中心', '装机必备', '软件教程', '最新更新'];
    const expectedHrefs = ['/', '/software', '/system-tools', '/games', '/essentials', '/tutorials', '/updates'];
    
    expectedLabels.forEach((label, idx) => {
      assert.strictEqual(MAIN_NAV_ITEMS[idx].label, label, `第 ${idx + 1} 项标签不符`);
      assert.strictEqual(MAIN_NAV_ITEMS[idx].href, expectedHrefs[idx], `第 ${idx + 1} 项路由不符`);
    });
  });

  await test('主导航配置中已彻底移除「对比评测」与「社区交流」', () => {
    const labels = MAIN_NAV_ITEMS.map((item) => item.label);
    const hrefs = MAIN_NAV_ITEMS.map((item) => item.href);
    assert(!labels.includes('对比评测'), '主导航不应包含对比评测');
    assert(!labels.includes('社区交流'), '主导航不应包含社区交流');
    assert(!hrefs.includes('/compare'), '主导航不应包含 /compare');
    assert(!hrefs.includes('/community'), '主导航不应包含 /community');
  });

  await test('siteConfig.navItems 与 MAIN_NAV_ITEMS 保持单一可信源同步', () => {
    assert.strictEqual(siteConfig.navItems.length, 7, 'siteConfig.navItems 应为 7 个项目');
    assert.strictEqual(siteConfig.navItems[0].label, '首页');
    assert.strictEqual(siteConfig.navItems[4].label, '装机必备');
    assert.strictEqual(siteConfig.navItems[5].label, '软件教程');
    assert.strictEqual(siteConfig.navItems[6].label, '最新更新');
  });

  // 2. 组件源码与配置统一性断言
  console.log('\n▶ [2/6] 验证组件源码中主导航与栏目推荐位清理...');
  await test('SiteHeader.tsx 引用统一配置 MAIN_NAV_ITEMS 且无冗余硬编码', () => {
    const headerCode = fs.readFileSync('src/components/layout/SiteHeader.tsx', 'utf-8');
    assert(headerCode.includes("import { MAIN_NAV_ITEMS } from '../../config/navigation'"), '必须从统一模块导入');
    assert(headerCode.includes('const navLinks = MAIN_NAV_ITEMS'), 'navLinks 必须指向 MAIN_NAV_ITEMS');
    assert(!headerCode.includes("{ label: '对比评测', href: '/compare'"), '不得包含硬编码对比评测');
    assert(!headerCode.includes("{ label: '社区交流', href: '/community'"), '不得包含硬编码社区交流');
  });

  await test('SiteFooter.tsx 底部前台链接中已移除「社区交流」主入口', () => {
    const footerCode = fs.readFileSync('src/components/layout/SiteFooter.tsx', 'utf-8');
    assert(!footerCode.includes('<Link to="/community"'), '页脚不应展示社区交流主链接');
  });

  await test('首页 MultiCategoryLeaderboard.tsx 已调整为指向 /software', () => {
    const code = fs.readFileSync('src/components/home/MultiCategoryLeaderboard.tsx', 'utf-8');
    assert(code.includes('to="/software"'), '排行榜右上角应指向 /software');
    assert(!code.includes('to="/compare"'), '排行榜右上角不应指向 /compare');
  });

  await test('首页 EssentialSuites.tsx 已调整为指向 /essentials', () => {
    const code = fs.readFileSync('src/components/home/EssentialSuites.tsx', 'utf-8');
    assert(code.includes('to="/essentials"'), '装机套件底部应指向 /essentials');
    assert(!code.includes('to="/compare"'), '装机套件底部不应指向 /compare');
  });

  await test('电脑软件头部 SoftwarePortalHero.tsx 已调整为指向 /essentials', () => {
    const code = fs.readFileSync('src/components/software/SoftwarePortalHero.tsx', 'utf-8');
    assert(code.includes('to="/essentials"'), '头部徽章应包含装机必备');
    assert(!code.includes('to="/compare"'), '头部徽章不应包含对比评测');
  });

  // 3. 历史数据与底层业务完整性断言 (防误删防破坏)
  console.log('\n▶ [3/6] 验证底层数据与业务逻辑完整保留 (零误删)...');
  await test('数据库中既有对比评测数据完整保留且状态正常', async () => {
    const count = await prisma.softwareComparison.count();
    assert(count >= 1, `对比评测数据表应有数据，实际记录数: ${count}`);
    const activeComp = await prisma.softwareComparison.findFirst({
      where: { status: 'PUBLISHED' },
    });
    assert(activeComp !== null, '必须存在已发布的对比评测记录');
  });

  await test('数据库中既有社区帖子与回复完整保留且状态正常', async () => {
    const threadCount = await prisma.discussionThread.count();
    assert(threadCount >= 1, `社区主题数据表应有数据，实际记录数: ${threadCount}`);
    const postCount = await prisma.discussionPost.count();
    assert(postCount >= 1, `社区回复数据表应有数据，实际记录数: ${postCount}`);
  });

  // 4. API 接口可访问性断言 (保证无 404)
  console.log('\n▶ [4/6] 验证对比与社区 API 服务正常响应 (平滑兼容)...');
  await test('对比评测频道聚合接口 /api/v1/channels/compare 返回 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/channels/compare`);
    assert.strictEqual(res.status, 200, `接口应返回 200，实际: ${res.status}`);
    const data = await res.json();
    assert(data.success === true, '对比评测聚合接口数据返回格式正确');
  });

  await test('社区实时统计接口 /api/v1/community/stats 返回 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/community/stats`);
    assert.strictEqual(res.status, 200, `接口应返回 200，实际: ${res.status}`);
    const data = await res.json();
    assert(data.success === true, '社区统计接口数据返回格式正确');
    assert(data.data.totalThreads >= 1, '社区统计主题数大于 0');
  });

  // 5. SEO 与直接访问路由可访问性
  console.log('\n▶ [5/6] 验证 SEO、Sitemap 与历史路由可访问性...');
  await test('历史对比频道 SSR /compare 路由返回 200 OK (防死链)', async () => {
    const res = await fetch(`${BASE_URL}/compare`);
    assert.strictEqual(res.status, 200, `访问 /compare 应返回 200，实际: ${res.status}`);
  });

  await test('历史社区交流 SSR /community 路由返回 200 OK (防死链)', async () => {
    const res = await fetch(`${BASE_URL}/community`);
    assert.strictEqual(res.status, 200, `访问 /community 应返回 200，实际: ${res.status}`);
  });

  await test('对比评测 Sitemap /sitemap-comparisons.xml 正常返回', async () => {
    const res = await fetch(`${BASE_URL}/sitemap-comparisons.xml`);
    assert.strictEqual(res.status, 200, `Sitemap 应返回 200，实际: ${res.status}`);
    const text = await res.text();
    assert(text.includes('<?xml'), '应输出标准 XML');
  });

  await test('社区交流 Sitemap /sitemap-community.xml 正常返回', async () => {
    const res = await fetch(`${BASE_URL}/sitemap-community.xml`);
    assert.strictEqual(res.status, 200, `Sitemap 应返回 200，实际: ${res.status}`);
    const text = await res.text();
    assert(text.includes('<?xml'), '应输出标准 XML');
  });

  // 6. 保留的 7 大核心主导航页面全部可访问 (零回归)
  console.log('\n▶ [6/6] 验证 7 大保留主频道健康状态 (全绿无回归)...');
  const retainChannels = [
    { label: '首页', path: '/' },
    { label: '电脑软件', path: '/software' },
    { label: '系统工具', path: '/system-tools' },
    { label: '游戏中心', path: '/games' },
    { label: '装机必备', path: '/essentials' },
    { label: '软件教程', path: '/tutorials' },
    { label: '最新更新', path: '/updates' },
  ];

  for (const ch of retainChannels) {
    await test(`频道【${ch.label}】(${ch.path}) 正常可访问 (200 OK)`, async () => {
      // 客户端路由与 SSR 路由分别适配探测
      const targetUrl = ['/tutorials', '/updates'].includes(ch.path)
        ? `http://localhost:3000${ch.path}`
        : `${BASE_URL}${ch.path}`;
      const res = await fetch(targetUrl);
      assert.strictEqual(res.status, 200, `${targetUrl} 应返回 200 OK，实际: ${res.status}`);
    });
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.9 顶部导航精简自动化验收完成: 通过 ${passCount} 项 | 失败 ${failCount} 项`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    throw new Error(`P8.7.9 自动化测试存在 ${failCount} 项失败`);
  }

  return { passed: passCount, failed: failCount };
}

// 独立运行时执行
if (process.argv[1]?.includes('p879NavigationSimplificationTest')) {
  runP879NavigationSimplificationTests()
    .then(() => {
      console.log('🎉 所有测试执行成功！');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 测试执行异常:', err);
      process.exit(1);
    });
}
