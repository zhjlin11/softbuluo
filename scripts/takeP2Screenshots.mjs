import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const artifactDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
  const localOutDir = path.resolve('public/screenshots');

  if (!fs.existsSync(localOutDir)) {
    fs.mkdirSync(localOutDir, { recursive: true });
  }

  console.log('🚀 正在启动 Playwright Chromium 进行 P1.5 + P2 页面渲染与截图验收...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. 软件详情页 (展示 P1.5 解耦安全徽标与免费直链直达)
  console.log('📸 截图 1: 软件详情页 (P1.5 来源/安全/签名解耦与官方直达)');
  await page.goto('http://localhost:3000/software/vscode', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const detailPath = path.join(localOutDir, 'screenshot-p15-detail.png');
  await page.screenshot({ path: detailPath });
  fs.copyFileSync(detailPath, path.join(artifactDir, 'screenshot-p15-detail.png'));

  // 2. 会员与商业化套餐选购页 (/membership)
  console.log('📸 截图 2: 会员中心与商业化服务方案 (/membership)');
  await page.goto('http://localhost:3000/membership', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const memberPath = path.join(localOutDir, 'screenshot-p2-membership.png');
  await page.screenshot({ path: memberPath, fullPage: true });
  fs.copyFileSync(memberPath, path.join(artifactDir, 'screenshot-p2-membership.png'));

  // 3. 注册并登录会员，创建一笔订单进入收银台 (/checkout/:orderNo)
  console.log('📸 截图 3: 创建真实订单并前往扫码收银台 (/checkout/:orderNo)');
  // 先通过前端注册一个演示账号
  const testUsername = `user_${Date.now().toString().slice(-4)}`;
  const testEmail = `demo_${Date.now()}@softbuluo.com`;

  await page.evaluate(async ({ u, e }) => {
    await fetch('/api/v1/members/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: u, email: e, password: 'Password2026!' }),
    });
  }, { u: testUsername, e: testEmail });

  // 刷新会员页以体现登录态
  await page.goto('http://localhost:3000/membership', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 点击月度会员购买
  const buyButton = await page.$('text=常用热门推荐');
  if (buyButton) {
    const card = await buyButton.evaluateHandle((el) => el.closest('div.relative'));
    const orderBtn = await card.$('button');
    if (orderBtn) {
      await orderBtn.click();
      await page.waitForURL(/\/checkout\/ORD/, { timeout: 10000 });
      await page.waitForTimeout(1500);

      const checkoutPath = path.join(localOutDir, 'screenshot-p2-checkout.png');
      await page.screenshot({ path: checkoutPath });
      fs.copyFileSync(checkoutPath, path.join(artifactDir, 'screenshot-p2-checkout.png'));
      console.log('     收银台截图已生成:', page.url());

      // 4. 在收银台点击模拟支付
      const mockPayBtn = await page.$('text=模拟微信支付成功');
      if (mockPayBtn) {
        await mockPayBtn.click();
        await page.waitForTimeout(1500);
        const paidPath = path.join(localOutDir, 'screenshot-p2-payment-success.png');
        await page.screenshot({ path: paidPath });
        fs.copyFileSync(paidPath, path.join(artifactDir, 'screenshot-p2-payment-success.png'));
        console.log('     支付成功状态截图已生成');
      }
    }
  }

  // 5. 前往用户个人中心 (/account) 查看会员与权益
  console.log('📸 截图 4: 用户个人中心 (/account) 会员与订单');
  await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const accountPath = path.join(localOutDir, 'screenshot-p2-account.png');
  await page.screenshot({ path: accountPath });
  fs.copyFileSync(accountPath, path.join(artifactDir, 'screenshot-p2-account.png'));

  // 6. 管理员登录并截取订单管理与退款审核后台
  console.log('📸 截图 5: 管理员订单中心 (/admin/orders)');
  await page.evaluate(async () => {
    await fetch('/api/v1/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: 'superadmin', password: 'Admin@123456' }),
    });
  });

  await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const adminOrdersPath = path.join(localOutDir, 'screenshot-p2-admin-orders.png');
  await page.screenshot({ path: adminOrdersPath });
  fs.copyFileSync(adminOrdersPath, path.join(artifactDir, 'screenshot-p2-admin-orders.png'));

  console.log('📸 截图 6: 管理员退款审核中心 (/admin/refunds)');
  await page.goto('http://localhost:3000/admin/refunds', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const adminRefundsPath = path.join(localOutDir, 'screenshot-p2-admin-refunds.png');
  await page.screenshot({ path: adminRefundsPath });
  fs.copyFileSync(adminRefundsPath, path.join(artifactDir, 'screenshot-p2-admin-refunds.png'));

  // 7. 管理员大盘数据 (/admin)
  console.log('📸 截图 7: 管理员大盘仪表盘 (/admin)');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const adminDashPath = path.join(localOutDir, 'screenshot-p2-admin-dashboard.png');
  await page.screenshot({ path: adminDashPath });
  fs.copyFileSync(adminDashPath, path.join(artifactDir, 'screenshot-p2-admin-dashboard.png'));

  await browser.close();
  console.log('🎉 P1.5 + P2 全套真实浏览器验收截图已生成并复制至制品库！');
}

main().catch(console.error);
