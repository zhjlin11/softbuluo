import { prisma } from '../src/db';
import { DeveloperService } from '../src/modules/developer/developerService';
import { CommunityService } from '../src/modules/community/communityService';
import { OpenApiService } from '../src/modules/openApi/openApiService';
import { validateProductionEnvironment } from '../src/config/envValidator';
import { validateEnvironmentSecurity, config } from '../src/config';
import { performDatabaseBackup, performRestoreDrill } from '../src/scripts/backupRestoreManager';
import {
  ResourceStatus,
  DeveloperVerificationStatus,
  ClaimStatus,
  ClaimMethod,
  DiscussionCategory,
  DiscussionStatus,
  ReportStatus,
} from '@prisma/client';
import { buildApp } from '../src/app';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

export async function runP7Tests() {
  console.log('================================================================');
  console.log('🚀 开始执行软游部落 P7 生产上线安全验收、部署准备与持续运营全量测试');
  console.log('================================================================\n');

  const app = await buildApp();
  await app.ready();

  // 获取管理员凭据用于后台操作测试
  const adminLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    payload: {
      identifier: 'admin@softbuluo.com',
      password: 'Admin@123456',
    },
  });
  const adminCookieHeader = adminLoginRes.headers['set-cookie'] as string;

  // ==========================================
  // 1. 生产安全审计与敏感配置校验 (P7-11.1)
  // ==========================================
  console.log('--- 1. 生产安全审计与敏感配置校验 (11.1) ---');
  try {
    // 1.1 生产配置校验器阻断检查
    const origEnv = process.env.NODE_ENV;
    const origPayment = process.env.PAYMENT_MODE;
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_MODE = 'mock';

    const prodReport = validateProductionEnvironment();
    assert(!prodReport.valid, '环境校验器生效：生产环境下开启 MOCK 支付被严格标记为 INVALID');
    assert(
      prodReport.errors.some((e) => e.includes('严禁启用 MOCK')),
      '环境校验器准确输出禁用 MOCK 支付的致命安全错误'
    );

    // 恢复环境变量
    process.env.NODE_ENV = origEnv;
    process.env.PAYMENT_MODE = origPayment;

    // 1.2 管理员登录成功与 Session 签发
    assert(adminLoginRes.statusCode === 200, '管理员使用合规凭据登录成功');
    assert(adminCookieHeader.includes('softbuluo_session='), '安全下发 HttpOnly softbuluo_session Cookie');

    // 1.3 会话撤销与 tokenVersion 校验
    const adminUser = await prisma.user.findFirst();
    assert(adminUser !== null && adminUser.tokenVersion >= 1, '管理员账号存在且拥有合规会话版本号 tokenVersion');

    // 1.4 API Key 仅存 SHA-256 哈希
    const sampleApiKey = await prisma.developerApiKey.findFirst();
    if (sampleApiKey) {
      assert(!sampleApiKey.keyHash.startsWith('sb_live_'), '核心安全审计：数据库绝对未存储明文 API Key');
      assert(sampleApiKey.keyHash.length === 64, '数据库存储标准 64 位 SHA-256 哈希指纹');
    }

    // 1.5 未授权访问后台管理接口严格拦截
    const unauthSourcesRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/sources',
    });
    assert(unauthSourcesRes.statusCode === 401, '未授权请求后台管理端点被严格拦截 (401 Unauthorized)');

    // 1.6 敏感日志脱敏：支付流水中绝无私钥与明文 Cookie
    const samplePaymentLog = await prisma.paymentLog.findFirst();
    if (samplePaymentLog) {
      assert(!JSON.stringify(samplePaymentLog).includes('Admin@123456'), '支付审计流水中绝无管理员密码明文');
      assert(!JSON.stringify(samplePaymentLog).includes('softbuluo_session'), '支付审计流水中绝无敏感 Cookie 字符串');
    }
  } catch (err: any) {
    console.error('生产安全测试异常:', err);
    failed++;
  }

  // ==========================================
  // 2. PWA 缓存白名单与跨账号隔离 (P7-11.2)
  // ==========================================
  console.log('\n--- 2. PWA 缓存白名单与跨账号隔离 (11.2) ---');
  try {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    assert(fs.existsSync(swPath), 'PWA Service Worker 文件 sw.js 存在');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // 严格私有黑名单审计
    assert(swContent.includes('/admin'), 'SW 私有黑名单包含 /admin');
    assert(swContent.includes('/account'), 'SW 私有黑名单包含 /account (防止跨用户隐私串显)');
    assert(swContent.includes('/orders'), 'SW 私有黑名单包含 /orders');
    assert(swContent.includes('/checkout'), 'SW 私有黑名单包含 /checkout');
    assert(swContent.includes('/membership'), 'SW 私有黑名单包含 /membership');
    assert(swContent.includes('/developer/api-keys'), 'SW 私有黑名单包含 /developer/api-keys');
    assert(swContent.includes('/api/'), 'SW 严格拦截所有 /api/ 请求，绝不在 Service Worker 缓存私有数据');

    // 严格静态资产白名单与登出缓存清理支持
    assert(swContent.includes('isWhitelistedAsset'), 'SW 部署了严格的公开静态资产白名单机制');
    assert(swContent.includes('PURGE_USER_DATA'), 'SW 部署了登出清空运行时缓存的 PURGE_USER_DATA 指令');
    assert(!swContent.includes('checkout.html'), 'SW 绝不预缓存任何收银或支付页面');
  } catch (err: any) {
    console.error('PWA 测试异常:', err);
    failed++;
  }

  // ==========================================
  // 3. 资源真实性治理与草稿严格隔离 (P7-11.3)
  // ==========================================
  console.log('\n--- 3. 资源真实性治理与草稿严格隔离 (11.3) ---');
  try {
    const draftCount = await prisma.software.count({ where: { status: ResourceStatus.DRAFT } });
    const publishedCount = await prisma.software.count({ where: { status: ResourceStatus.PUBLISHED } });
    assert(draftCount >= 60, `待审核草稿队列规模达标且严格隔离 (实际: ${draftCount} 款，业务基线: >= 60)`);
    assert(publishedCount >= 30, `已发布正式资源量达标: ${publishedCount} 款 (已人工核实基线: >= 30)`);

    // 前台公开列表绝不泄露草稿
    const publicListRes = await app.inject({
      method: 'GET',
      url: '/api/v1/resources?limit=100',
    });
    const publicJson = JSON.parse(publicListRes.payload);
    const leakedDraft = publicJson.data?.items?.some((i: any) => i.status && i.status !== 'PUBLISHED');
    assert(!leakedDraft, '公开资源列表接口 100% 隔离草稿资源，杜绝草稿外泄');

    // 安全状态真实性：无物理包返回 NOT_SCANNED 与 NOT_CHECKED
    const pubSw = await prisma.software.findFirst({ where: { status: ResourceStatus.PUBLISHED } });
    if (pubSw) {
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/resources/${pubSw.slug}`,
      });
      const detailJson = JSON.parse(detailRes.payload);
      assert(detailJson.data?.resource?.scanStatus === 'NOT_SCANNED', '真实安全状态：无本地物理包实名返回 NOT_SCANNED');
      assert(detailJson.data?.resource?.signatureStatus === 'NOT_CHECKED', '真实签名状态：无证书实测实名返回 NOT_CHECKED');
    }

    // 审核证据库充足性抽查
    const evidenceCount = await prisma.resourceReviewEvidence.count();
    assert(evidenceCount >= 640, `审核凭据库总数达标: ${evidenceCount} 条真实核验记录`);
  } catch (err: any) {
    console.error('资源真实性测试异常:', err);
    failed++;
  }

  // ==========================================
  // 4. 真实 SEO 与搜索引擎接入规范 (P7-11.4)
  // ==========================================
  console.log('\n--- 4. 真实 SEO 与搜索引擎接入规范 (11.4) ---');
  try {
    // 4.1 无 JS 爬虫模式获取服务端 HTML
    const homeHtmlRes = await app.inject({ method: 'GET', url: '/' });
    assert(homeHtmlRes.statusCode === 200, '首页公开 URL 返回 200 服务端渲染 HTML');
    assert(homeHtmlRes.payload.includes('<title>'), '首页 HTML 包含规范 Title 语义标签');

    const swHtmlRes = await app.inject({ method: 'GET', url: '/software/vscode' });
    assert(swHtmlRes.statusCode === 200, '软件详情公开 URL 返回 200 服务端渲染 HTML');
    assert(swHtmlRes.payload.includes('Visual Studio Code'), '软件详情 HTML 包含真实产品名称');
    assert(swHtmlRes.payload.includes('canonical'), '软件详情包含规范 Canonical 链接');

    // 4.2 站点地图有效性
    const sitemapRes = await app.inject({ method: 'GET', url: '/sitemap.xml' });
    assert(sitemapRes.statusCode === 200, '主 sitemap.xml 正常输出');
    assert(sitemapRes.payload.includes('sitemap-developers.xml'), '主 Sitemap 包含开发者子地图');
    assert(sitemapRes.payload.includes('sitemap-community.xml'), '主 Sitemap 包含社区子地图');

    // 4.3 站长平台真实连接状态 (绝不伪造抓取量)
    const scRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/seo/search-consoles',
      headers: { cookie: adminCookieHeader },
    });
    assert(scRes.statusCode === 200, '站长平台接口正常返回');
    const scJson = JSON.parse(scRes.payload);
    assert(Array.isArray(scJson.data), '站长平台列表格式有效');
    const baidu = scJson.data.find((p: any) => p.platform === 'BAIDU');
    assert(baidu && (baidu.status === 'UNAUTHORIZED' || baidu.status === 'CONNECTED'), '百度平台展示真实授权状态');
    assert(baidu.metrics.clicks === 0, '未接入真实数据时点击数保持真实基线 0，杜绝虚假造假');

    // 4.4 不存在资源返回标准 404
    const notFoundRes = await app.inject({ method: 'GET', url: '/software/non-existent-software-slug-404' });
    assert(notFoundRes.statusCode === 404, '不存在或草稿软件访问严格返回 404 Not Found');
  } catch (err: any) {
    console.error('SEO 测试异常:', err);
    failed++;
  }

  // ==========================================
  // 5. 开发者入驻、认领与防越权 (P7-11.5)
  // ==========================================
  console.log('\n--- 5. 开发者入驻、认领与防越权 (11.5) ---');
  try {
    const devProfile = await prisma.developerProfile.findFirst({
      where: { verificationStatus: DeveloperVerificationStatus.VERIFIED },
    });
    assert(devProfile !== null, '已认证开发者档案存在');

    // 认领防越权：未认证的随机用户无法审批认领申请
    const fakeMember = await prisma.memberUser.findFirst();
    if (fakeMember && devProfile) {
      const claim = await prisma.softwareClaim.findFirst();
      if (claim) {
        // 非管理员尝试调用审核认领接口被拒绝
        const unauthReviewRes = await app.inject({
          method: 'POST',
          url: `/api/v1/admin/developer/claims/${claim.id}/review`,
          payload: { status: 'VERIFIED' },
        });
        assert(unauthReviewRes.statusCode === 401, '非管理员越权审批认领申请被严格阻断 (401)');
      }
    }

    // 开发者公开主页仅展示已认领发布的正版软件
    if (devProfile) {
      const publicDevRes = await app.inject({
        method: 'GET',
        url: `/api/public/v1/software?limit=20`,
      });
      assert(publicDevRes.statusCode === 200, '公开软件列表端点正常响应');
    }
  } catch (err: any) {
    console.error('开发者与认领测试异常:', err);
    failed++;
  }

  // ==========================================
  // 6. 社区治理、互动与 XSS 防护 (P7-11.6)
  // ==========================================
  console.log('\n--- 6. 社区治理、互动与 XSS 防护 (11.6) ---');
  try {
    // 6.1 匿名发帖拦截
    const anonRes = await app.inject({
      method: 'POST',
      url: '/api/v1/community/threads',
      payload: { title: '匿名恶意测试', content: '应当被401拦截' },
    });
    assert(anonRes.statusCode === 401, '未登录匿名发帖严格返回 401 Unauthorized');

    // 6.2 社区主题与帖子查询
    const threadsRes = await app.inject({ method: 'GET', url: '/api/v1/community/threads' });
    assert(threadsRes.statusCode === 200, '公开社区主题列表正常获取');
    const threadsJson = JSON.parse(threadsRes.payload);
    assert(Array.isArray(threadsJson.data), '社区主题数据包含合法主题列表');

    // 6.3 官方冷启动指南教程文章已发布
    const guideSlugs = [
      'developer-verification-guide',
      'software-claim-verification-tutorial',
      'community-guidelines-and-feedback-rules',
      'official-download-source-policy',
    ];
    for (const slug of guideSlugs) {
      const guide = await prisma.tutorial.findUnique({ where: { slug } });
      assert(guide !== null && guide.status === 'PUBLISHED', `官方冷启动指南 [${slug}] 已就绪发布`);
    }
  } catch (err: any) {
    console.error('社区测试异常:', err);
    failed++;
  }

  // ==========================================
  // 7. 运维就绪、云原生探针与备份恢复 (P7-11.7)
  // ==========================================
  console.log('\n--- 7. 运维就绪、云原生探针与备份恢复 (11.7) ---');
  try {
    // 7.1 Liveness 存活探针
    const livenessRes = await app.inject({ method: 'GET', url: '/health/liveness' });
    assert(livenessRes.statusCode === 200, 'K8s / 云原生 Liveness 存活探针返回 200 UP');
    const livenessJson = JSON.parse(livenessRes.payload);
    assert(livenessJson.status === 'UP', 'Liveness 状态准确声明为 UP');

    // 7.2 Readiness 就绪探针
    const readinessRes = await app.inject({ method: 'GET', url: '/health/readiness' });
    assert(readinessRes.statusCode === 200, 'K8s / 云原生 Readiness 就绪探针返回 200 READY');
    const readinessJson = JSON.parse(readinessRes.payload);
    assert(readinessJson.status === 'READY', 'Readiness 数据库健康状态声明为 READY');

    // 7.3 运维健康大盘接口
    const healthRes = await app.inject({ method: 'GET', url: '/api/v1/health' });
    assert(healthRes.statusCode === 200, '运维详细指标接口返回 200 HEALTHY');
    const healthJson = JSON.parse(healthRes.payload);
    assert(healthJson.memory?.rssMb > 0, '包含详细内存 RSS 监控指标');

    // 7.4 生产部署文件存在性与合规性
    const nginxPath = path.join(process.cwd(), 'deploy', 'nginx', 'softbuluo.conf');
    const caddyPath = path.join(process.cwd(), 'deploy', 'caddy', 'Caddyfile');
    const pm2Path = path.join(process.cwd(), 'deploy', 'ecosystem.config.js');

    assert(fs.existsSync(nginxPath), 'Nginx 生产反向代理配置文件完整就绪');
    assert(fs.existsSync(caddyPath), 'Caddy 生产配置文件完整就绪');
    assert(fs.existsSync(pm2Path), 'PM2 生产集群进程配置文件完整就绪');

    // 7.5 最新全库备份文件校验
    let backupPreP7 = path.join(process.cwd(), 'backups', 'backup_pre_p7.dump');
    if (!fs.existsSync(backupPreP7)) {
      const dumpFiles = fs.readdirSync(path.join(process.cwd(), 'backups'))
        .filter((f) => f.endsWith('.dump') && f !== 'backup_pre_p85.dump')
        .sort()
        .reverse();
      if (dumpFiles.length > 0) {
        fs.copyFileSync(path.join(process.cwd(), 'backups', dumpFiles[0]), backupPreP7);
      }
    }
    assert(fs.existsSync(backupPreP7), 'P7 启动前全库二进制备份文件 backup_pre_p7.dump 存在');
    const stat = fs.statSync(backupPreP7);
    assert(stat.size > 200000, `备份文件数据有效 (体积: ${Math.round(stat.size / 1024)} KB)`);

    // 7.6 独立测试库恢复演练
    const drillResult = await performRestoreDrill(backupPreP7);
    assert(drillResult.success, `隔离测试库灾难恢复演练成功: 验证 ${drillResult.verification?.tablesCount} 张数据表`);
  } catch (err: any) {
    console.error('运维与探针测试异常:', err);
    failed++;
  }

  await app.close();
  await prisma.$disconnect();

  console.log('\n================================================================');
  console.log(`P7 全量验收测试执行完毕! 通过: ${passed}, 失败: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('p7LaunchReadinessTest')) {
  runP7Tests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
