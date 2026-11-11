import { chromium } from 'playwright';
import assert from 'assert';
import { MAIN_NAV_ITEMS } from '../src/config/navigation';

const CHANNELS = [
  { name: '首页', path: '/', expectedH1: '官方纯净软件' },
  { name: '电脑软件', path: '/software', expectedH1: '电脑软件' },
  { name: '系统工具', path: '/system-tools', expectedH1: '系统工具' },
  { name: '游戏中心', path: '/games', expectedH1: '游戏中心' },
  { name: '装机必备', path: '/essentials', expectedH1: '装机' },
  { name: '软件教程', path: '/tutorials', expectedH1: '电脑软件教程与实用技术指南' },
  { name: '最新更新', path: '/updates', expectedH1: '软件与游戏最新版本更新中心' },
];

async function main() {
  console.log('🔍 开始七大核心导航频道最终统一验收...');
  const browser = await chromium.launch();

  // 1. 验证 MAIN_NAV_ITEMS 准确为 7 项且顺序完全一致
  console.log('\n[1/3] 检查前台主导航配置单一可信源:');
  assert.strictEqual(MAIN_NAV_ITEMS.length, 7, '导航项必须恰好为 7 个');
  MAIN_NAV_ITEMS.forEach((it, idx) => {
    assert.strictEqual(it.label, CHANNELS[idx].name);
    assert.strictEqual(it.href, CHANNELS[idx].path);
    console.log(`  ✅ 导航 ${idx + 1}: ${it.label} -> ${it.href}`);
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 2. 逐一巡检前端 SPA 各频道可达性、Title、H1 与无控制台报错
  console.log('\n[2/3] 逐一访问前端 SPA 七大频道:');
  for (const ch of CHANNELS) {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const res = await page.goto(`http://localhost:3000${ch.path}`, { waitUntil: 'networkidle' });
    assert.strictEqual(res?.status(), 200, `页面 ${ch.path} 响应码必须为 200`);

    const title = await page.title();
    assert(title && title.includes('软游部落'), `页面 ${ch.path} Title 异常: ${title}`);

    // H1 检查
    const h1Count = await page.locator('h1').count();
    assert(h1Count >= 1, `页面 ${ch.path} 必须包含至少一个 H1 标签`);
    const h1Text = await page.locator('h1').first().innerText();
    assert(h1Text.includes(ch.expectedH1) || ch.name === '首页', `页面 ${ch.path} H1 (${h1Text}) 未包含预期关键词 ${ch.expectedH1}`);

    // 横向溢出检查
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!hasOverflow, `页面 ${ch.path} 存在横向溢出`);

    console.log(`  ✅ [PASS] ${ch.name} (${ch.path}): HTTP 200 | Title: "${title.slice(0, 30)}..." | H1: "${h1Text}" | 零横向溢出`);
  }

  // 3. 逐一巡检后端 SSR 兜底各频道 HTML 与 Canonical
  console.log('\n[3/3] 逐一验证后端 SSR 七大频道 HTML 与 Canonical:');
  for (const ch of CHANNELS) {
    const ssrUrl = `http://127.0.0.1:3001${ch.path}`;
    const res = await fetch(ssrUrl);
    assert.strictEqual(res.status, 200, `SSR ${ch.path} 必须返回 200`);
    const html = await res.text();
    assert(html.includes('<title>'), `SSR ${ch.path} 必须包含 <title>`);
    assert(html.includes('rel="canonical"'), `SSR ${ch.path} 必须包含 canonical 声明`);
    console.log(`  ✅ [PASS] SSR ${ch.name} (${ch.path}): HTTP 200 | Canonical 完备`);
  }

  await browser.close();
  console.log('\n🎉 七大主导航频道统一验收圆满通过！');
}

main().catch((err) => {
  console.error('七大频道验收失败:', err);
  process.exit(1);
});
