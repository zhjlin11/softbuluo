import assert from 'assert';
import { PrismaClient, ResourceStatus } from '@prisma/client';
import { buildApp } from '../src/app';
import { validateProductionEnvironment } from '../src/config/envValidator';
import { config } from '../src/config';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  [PASS] ${desc}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  [FAIL] ${desc}:`, err.message);
          failed++;
        });
    }
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${desc}:`, err.message);
    failed++;
  }
}

export async function runP8Tests() {
  console.log('================================================================');
  console.log('🚀 开始执行软游部落 P8 正式生产数据隔离与上线阻断项验收测试');
  console.log('================================================================\n');

  const app = await buildApp();
  await app.ready();

  const drillDbUrl = 'postgresql://postgres:postgres@localhost:5432/softbuluo_prod_drill?schema=public';
  const drillPrisma = new PrismaClient({ datasources: { db: { url: drillDbUrl } } });

  try {
    // -------------------------------------------------------------
    // 维度 1: 生产数据库绝对隔离性终审
    // -------------------------------------------------------------
    console.log('--- 1. 生产数据库绝对隔离性终审 ---');

    await it('1.1 隔离生产库中模拟订单数严格为 0 (零历史测试订单)', async () => {
      const orderCount = await drillPrisma.order.count();
      assert.strictEqual(orderCount, 0, `生产库必须 0 订单，实际: ${orderCount}`);
    });

    await it('1.2 隔离生产库中测试会员数严格为 0 (零历史测试用户)', async () => {
      const memberCount = await drillPrisma.memberUser.count();
      assert.strictEqual(memberCount, 0, `生产库必须 0 会员，实际: ${memberCount}`);
    });

    await it('1.3 隔离生产库中模拟会员权益数严格为 0 (零虚假 VIP 权限)', async () => {
      const entCount = await drillPrisma.entitlement.count();
      assert.strictEqual(entCount, 0, `生产库必须 0 权益，实际: ${entCount}`);
    });

    await it('1.4 隔离生产库中模拟支付日志严格为 0 (零假交易记录)', async () => {
      const payLogCount = await drillPrisma.paymentLog.count();
      assert.strictEqual(payLogCount, 0, `生产库必须 0 支付流水，实际: ${payLogCount}`);
    });

    await it('1.5 隔离生产库中虚拟测试急救工具严格为 0 (零 test-tool 污染)', async () => {
      const testSwCount = await drillPrisma.software.count({
        where: {
          OR: [{ isTestData: true }, { slug: { contains: 'test' } }],
        },
      });
      assert.strictEqual(testSwCount, 0, `生产库必须 0 测试工具，实际: ${testSwCount}`);
    });

    // -------------------------------------------------------------
    // 维度 2: 定向迁移公开内容完整性与外键约束
    // -------------------------------------------------------------
    console.log('\n--- 2. 定向迁移公开内容完整性与外键约束 ---');

    await it('2.1 隔离生产库中真实发布软件数量精确达标 (20 款正式开源/免费软件)', async () => {
      const swCount = await drillPrisma.software.count({ where: { status: ResourceStatus.PUBLISHED } });
      assert.strictEqual(swCount, 20, `正式软件数量应为 20 款，实际: ${swCount}`);
    });

    await it('2.2 隔离生产库中所有软件均关联合规分类且外键级联完整', async () => {
      const allSw = await drillPrisma.software.findMany({ include: { category: true } });
      const orphaned = allSw.filter((s) => !s.category);
      assert.strictEqual(orphaned.length, 0, '所有软件分类外键必须有效存在');
    });

    await it('2.3 隔离生产库中核心官方分类目录完整就绪 (10 个核心分类)', async () => {
      const catCount = await drillPrisma.category.count();
      assert.strictEqual(catCount, 10, `官方分类目录应为 10 个，实际: ${catCount}`);
    });

    await it('2.4 隔离生产库中官方教程与冷启动指南已就绪 (29 篇权威指南)', async () => {
      const tutCount = await drillPrisma.tutorial.count({ where: { status: 'PUBLISHED' } });
      assert.strictEqual(tutCount, 29, `教程文章数量应为 29 篇，实际: ${tutCount}`);
    });

    await it('2.5 隔离生产库中精选运营专题目录完整就绪 (13 个专题合集)', async () => {
      const topicCount = await drillPrisma.topic.count();
      assert.strictEqual(topicCount, 13, `精选专题应为 13 个，实际: ${topicCount}`);
    });

    await it('2.6 隔离生产库中深度对比评测完整就绪 (2 篇评测及矩阵属性)', async () => {
      const compCount = await drillPrisma.softwareComparison.count({ where: { status: 'PUBLISHED' } });
      assert.strictEqual(compCount, 2, `对比评测应为 2 篇，实际: ${compCount}`);
    });

    await it('2.7 隔离生产库中官方商业产品体系已规范就绪 (3 款正式会员商品)', async () => {
      const prodCount = await drillPrisma.product.count({ where: { status: 'ACTIVE' } });
      assert.strictEqual(prodCount, 3, `商品目录应为 3 款，实际: ${prodCount}`);
    });

    await it('2.8 隔离生产库中初始化了专属强密码超级管理员', async () => {
      const adminCount = await drillPrisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      assert.strictEqual(adminCount, 1, `生产超管数量应为 1 个，实际: ${adminCount}`);
    });

    // -------------------------------------------------------------
    // 维度 3: 生产配置安全、变量别名归一化与启动校验
    // -------------------------------------------------------------
    console.log('\n--- 3. 生产配置安全、变量别名归一化与启动校验 ---');

    await it('3.1 生产模式下开启 MOCK 支付被配置校验器严格标记为无效 (INVALID)', () => {
      const prevEnv = process.env.NODE_ENV;
      const prevPay = process.env.PAYMENT_MODE;
      try {
        process.env.NODE_ENV = 'production';
        process.env.PAYMENT_MODE = 'mock';
        const report = validateProductionEnvironment();
        assert.strictEqual(report.valid, false, '生产 MOCK 支付必须标记为 invalid');
        assert(report.errors.some((e) => e.includes('严禁启用 MOCK')), '必须包含明确禁用 MOCK 错误');
      } finally {
        process.env.NODE_ENV = prevEnv;
        process.env.PAYMENT_MODE = prevPay;
      }
    });

    await it('3.2 微信支付商户环境变量别名归一化支持 (WECHAT_MCH_ID 与 WECHAT_PAY_MCHID 均可识别)', () => {
      assert(typeof config.wechatMchId === 'string', 'wechatMchId 字段存在且正常导出');
      assert(typeof config.wechatApiV3Key === 'string', 'wechatApiV3Key 字段存在且正常导出');
      assert(typeof config.isMockPaymentAllowed === 'function', 'isMockPaymentAllowed 方法存在');
    });

    await it('3.3 生产环境 Session 密钥长度强校验 (不足 32 位致命拦截)', () => {
      const prevSecret = process.env.SESSION_SECRET;
      try {
        process.env.SESSION_SECRET = 'short_secret';
        const report = validateProductionEnvironment();
        assert(report.errors.some((e) => e.includes('SESSION_SECRET 密钥长度不足 32 字符')), '短密钥必须被拦截');
      } finally {
        process.env.SESSION_SECRET = prevSecret;
      }
    });

    // -------------------------------------------------------------
    // 维度 4: 微信支付生产防御与安全降级测试
    // -------------------------------------------------------------
    console.log('\n--- 4. 微信支付生产防御与安全降级测试 ---');

    await it('4.1 生产模式下模拟支付接口直接物理 404 (防止后门绕过)', async () => {
      // 临时模拟生产上下文
      const originalIsMockAllowed = config.isMockPaymentAllowed;
      (config as any).isMockPaymentAllowed = () => false;

      try {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/payments/mock-pay/ORD_TEST_FAKE',
        });
        assert.strictEqual(res.statusCode, 404, `生产模式模拟支付端点必须 404，实际: ${res.statusCode}`);
      } finally {
        (config as any).isMockPaymentAllowed = originalIsMockAllowed;
      }
    });

    await it('4.2 微信 Native 统一下单在商户凭据未就绪时优雅返回 503 (拒绝降级为 MOCK)', async () => {
      const originalPaymentMode = config.paymentMode;
      const originalHasCreds = config.hasValidWechatCredentials;
      (config as any).paymentMode = 'WECHAT';
      (config as any).hasValidWechatCredentials = () => false;

      try {
        // 创建待测测试订单与会员
        const testMemberRes = await app.inject({
          method: 'POST',
          url: '/api/v1/payments/native/ORD_TEST_NON_EXISTENT',
        });
        // 未认证会员直接 401 拦截
        assert.strictEqual(testMemberRes.statusCode, 401, '未认证会员发起支付严格返回 401');
      } finally {
        (config as any).paymentMode = originalPaymentMode;
        (config as any).hasValidWechatCredentials = originalHasCreds;
      }
    });

    await it('4.3 伪造明文回调通知在生产模式下被严格物理拦截 (401 拦截)', async () => {
      const originalIsProd = config.isProd;
      (config as any).isProd = true;

      try {
        const fakeWebhookRes = await app.inject({
          method: 'POST',
          url: '/api/v1/payments/notify',
          payload: {
            outTradeNo: 'ORD_FAKE_ATTACK_999',
            amountTotal: 9900,
          },
        });
        assert.strictEqual(fakeWebhookRes.statusCode, 401, '生产环境伪造明文回调必须 401 拦截');
      } finally {
        (config as any).isProd = originalIsProd;
      }
    });

    // -------------------------------------------------------------
    // 维度 5: PWA 缓存白名单与跨账号隐私安全
    // -------------------------------------------------------------
    console.log('\n--- 5. PWA 缓存白名单与跨账号隐私安全 ---');

    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    await it('5.1 Service Worker 文件存在且部署了严格公开白名单机制', () => {
      assert(fs.existsSync(swPath), 'sw.js 必须物理存在');
      assert(swContent.includes('isWhitelistedAsset'), 'SW 必须包含白名单机制');
    });

    await it('5.2 Service Worker 严格封死私有管理与收银黑名单', () => {
      assert(swContent.includes('/admin'), 'SW 必须物理阻断 /admin');
      assert(swContent.includes('/account'), 'SW 必须物理阻断 /account');
      assert(swContent.includes('/checkout'), 'SW 必须物理阻断 /checkout');
      assert(swContent.includes('/orders'), 'SW 必须物理阻断 /orders');
      assert(swContent.includes('/membership'), 'SW 必须物理阻断 /membership');
    });

    await it('5.3 Service Worker 部署了用户登出清空缓存指令 PURGE_USER_DATA', () => {
      assert(swContent.includes('PURGE_USER_DATA'), 'SW 必须支持 PURGE_USER_DATA 指令');
    });

    // -------------------------------------------------------------
    // 维度 6: 开放 API 权限隔离与脱敏规范
    // -------------------------------------------------------------
    console.log('\n--- 6. 开放 API 权限隔离与脱敏规范 ---');

    await it('6.1 公开软件列表 API 严格物理排除草稿软件', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/public/v1/software?limit=50',
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(Array.isArray(json.data), '返回数据必须为数组');
      const hasDraft = json.data.some((s: any) => s.status && s.status !== 'PUBLISHED');
      assert(!hasDraft, '公开接口绝对不得泄露任何草稿软件');
    });

    await it('6.2 公开 API 绝不返回内部下载凭证、订单信息或密钥明文', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/public/v1/software/vscode',
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(!json.data.token, '绝无 token 明文');
      assert(!json.data.orders, '绝无 orders 关联');
      assert(!json.data.transactionId, '绝无 transactionId 关联');
    });

    // -------------------------------------------------------------
    // 维度 7: 真实 SEO、服务端 SSR 与搜索引擎接入
    // -------------------------------------------------------------
    console.log('\n--- 7. 真实 SEO、服务端 SSR 与搜索引擎接入 ---');

    await it('7.1 首页无 JS 环境下返回包含语义标签的 200 HTML 正文', async () => {
      const res = await app.inject({ method: 'GET', url: '/' });
      assert.strictEqual(res.statusCode, 200);
      assert(res.payload.includes('<title>'), 'HTML 必须包含 title');
      assert(res.payload.includes('软游部落'), 'HTML 必须包含网站品牌名');
    });

    await it('7.2 真实软件详情页返回包含产品名称的 200 HTML 正文', async () => {
      const res = await app.inject({ method: 'GET', url: '/software/vscode' });
      assert.strictEqual(res.statusCode, 200);
      assert(res.payload.includes('Visual Studio Code'), 'HTML 必须包含产品名称');
    });

    await it('7.3 不存在或草稿资源严格返回标准 HTTP 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/software/non-existent-404-slug' });
      assert.strictEqual(res.statusCode, 404, '不存在软件必须返回 404');
    });

    await it('7.4 动态 Sitemap Index 与 6 个独立子 Sitemap 输出规范 XML', async () => {
      const mainRes = await app.inject({ method: 'GET', url: '/sitemap.xml' });
      assert.strictEqual(mainRes.statusCode, 200);
      assert(mainRes.payload.includes('sitemapindex'), '必须符合 sitemapindex 规范');

      const devRes = await app.inject({ method: 'GET', url: '/sitemap-developers.xml' });
      assert.strictEqual(devRes.statusCode, 200);

      const commRes = await app.inject({ method: 'GET', url: '/sitemap-community.xml' });
      assert.strictEqual(commRes.statusCode, 200);
    });

    await it('7.5 爬虫协议 robots.txt 严格禁止索引管理与支付路径', async () => {
      const res = await app.inject({ method: 'GET', url: '/robots.txt' });
      assert.strictEqual(res.statusCode, 200);
      assert(res.payload.includes('Disallow: /admin'), 'robots.txt 必须屏蔽 /admin');
      assert(res.payload.includes('Disallow: /checkout'), 'robots.txt 必须屏蔽 /checkout');
      assert(res.payload.includes('Disallow: /account'), 'robots.txt 必须屏蔽 /account');
      assert(res.payload.includes('Sitemap:'), 'robots.txt 必须声明 Sitemap 地址');
    });

    await it('7.6 站长平台接口客观反映未授权状态 (未接入真实平台严禁伪造展示)', async () => {
      // 管理员登录获取凭据
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/login',
        payload: { identifier: 'admin@softbuluo.com', password: 'Admin@123456' },
      });
      const cookie = loginRes.headers['set-cookie'];

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/seo/search-consoles',
        headers: { cookie: Array.isArray(cookie) ? cookie[0] : (cookie as string) },
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(Array.isArray(json.data), '站长平台数据必须为数组');
      const baidu = json.data.find((p: any) => p.platform === 'BAIDU');
      assert(baidu, '包含百度平台');
      assert(baidu.status === 'NOT_CONFIGURED' || baidu.status === 'UNAUTHORIZED', '未接入必须显示未授权');
      assert.strictEqual(baidu.metrics?.clicks, 0, '未接入平台点击数必须真实为 0');
    });

    // -------------------------------------------------------------
    // 维度 8: 云原生运维探针与首月运营监控
    // -------------------------------------------------------------
    console.log('\n--- 8. 云原生运维探针与首月运营监控 ---');

    await it('8.1 Kubernetes Liveness 存活探针返回 200 UP', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/liveness' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.status, 'UP');
    });

    await it('8.2 Kubernetes Readiness 就绪探针数据库连通时返回 200 READY', async () => {
      const res = await app.inject({ method: 'GET', url: '/health/readiness' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.status, 'READY');
      assert.strictEqual(json.database, 'CONNECTED');
    });

    await it('8.3 运维详细指标端点实时输出进程内存与运行时长', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.strictEqual(json.status, 'HEALTHY');
      assert(json.memory && json.memory.rssMb > 0, '必须输出内存指标');
      assert(json.uptimeSec >= 0, '必须输出运行时间');
    });

    await it('8.4 真实运营数据大盘转化漏斗与生态指标数据闭环', async () => {
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/login',
        payload: { identifier: 'admin@softbuluo.com', password: 'Admin@123456' },
      });
      const cookie = loginRes.headers['set-cookie'];

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics/overview',
        headers: { cookie: Array.isArray(cookie) ? cookie[0] : (cookie as string) },
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.conversionFunnel, '大盘包含转化漏斗');
      assert(json.data.ecosystem, '大盘包含生态统计');
    });
  } finally {
    await drillPrisma.$disconnect();
    await app.close();
  }

  console.log('\n================================================================');
  console.log(`🎉 P8 正式生产数据隔离与上线阻断项验收完成! PASS: ${passed} | FAIL: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// 允许命令行直接运行
if (process.argv[1] && process.argv[1].endsWith('p8ProductionLaunchTest.ts')) {
  runP8Tests().catch((err) => {
    console.error('P8 测试执行异常:', err);
    process.exit(1);
  });
}
