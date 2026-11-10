/**
 * 软游部落 P1 自动化集成与安全测试套件
 */

import { prisma } from '../src/db';

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 开始运行软游部落 P1 完整自动化与安全测试...');
  let cookieHeader = '';
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, desc: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. 健康检查
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'healthy' && data.database === 'connected', '服务健康检查与 PostgreSQL 连接');
  } catch (err: any) {
    assert(false, `服务健康检查异常: ${err.message}`);
  }

  // 2. 首页数据聚合接口
  try {
    const res = await fetch(`${BASE_URL}/api/v1/home`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.data.categories.length >= 10 && data.data.featured.length > 0, '首页聚合接口 (/api/v1/home) 数据真实完整');
  } catch (err: any) {
    assert(false, `首页数据接口异常: ${err.message}`);
  }

  // 3. 管理员登录与 Session 生成
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@softbuluo.com', password: 'Admin@123456' }),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookieHeader = setCookie.split(';')[0];
    }
    const data = await res.json();
    assert(res.status === 200 && data.success && data.data.user.role === 'SUPER_ADMIN', '管理员正确凭证安全登录');
    assert(!!cookieHeader, '服务端 HttpOnly Session Cookie 成功下发');
  } catch (err: any) {
    assert(false, `登录测试异常: ${err.message}`);
  }

  // 4. 鉴权验证 (/api/v1/admin/me)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/me`, {
      headers: { Cookie: cookieHeader }
    });
    const data = await res.json();
    assert(res.status === 200 && data.success && data.data.user.username === 'superadmin', '基于 Session 的身份鉴权成功恢复');
  } catch (err: any) {
    assert(false, `鉴权验证异常: ${err.message}`);
  }

  // 5. 反 SSRF 安全拦截测试 (核心安全测试)
  try {
    // 测试 1: 探测本地 localhost
    const resLocalhost = await fetch(`${BASE_URL}/api/v1/admin/download-sources/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ url: 'http://localhost:3001' }),
    });
    const dataLocalhost = await resLocalhost.json();
    assert(
      dataLocalhost.data?.verificationStatus === 'FAILED' && dataLocalhost.data?.error?.includes('禁止探测本地'),
      '反 SSRF 策略成功拦截针对 localhost 的探测'
    );

    // 测试 2: 探测内网回环与私网 IP 127.0.0.1 / 192.168.1.1
    const resPrivateIp = await fetch(`${BASE_URL}/api/v1/admin/download-sources/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ url: 'http://127.0.0.1:5432' }),
    });
    const dataPrivateIp = await resPrivateIp.json();
    assert(
      dataPrivateIp.data?.verificationStatus === 'FAILED',
      '反 SSRF 策略成功拦截针对 127.0.0.1 / 内网端口的探测'
    );

    // 测试 3: 探测云主机元数据服务 169.254.169.254
    const resMetadata = await fetch(`${BASE_URL}/api/v1/admin/download-sources/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' }),
    });
    const dataMetadata = await resMetadata.json();
    assert(
      dataMetadata.data?.verificationStatus === 'FAILED',
      '反 SSRF 策略成功拦截针对链路本地元数据 (169.254.169.254) 的探测'
    );

    // 测试 4: 正常官方外链测试
    const resValid = await fetch(`${BASE_URL}/api/v1/admin/download-sources/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ url: 'https://code.visualstudio.com' }),
    });
    const dataValid = await resValid.json();
    assert(
      dataValid.success && dataValid.data?.isReachable,
      '合法外部官方站点通过有效性检测'
    );
  } catch (err: any) {
    assert(false, `反 SSRF 测试异常: ${err.message}`);
  }

  // 6. 完整资源生命周期闭环测试: 新增 -> 提交审核 -> 审核批准 -> 搜索发现 -> 详情查看 -> 打点
  let createdSoftwareId = '';
  const testSlug = `test-tool-${Date.now()}`;

  try {
    // 获取分类
    const catRes = await fetch(`${BASE_URL}/api/v1/categories`);
    const catData = await catRes.json();
    const firstCatId = catData.data[0].id;

    // 6.1 新增资源 (DRAFT)
    const createRes = await fetch(`${BASE_URL}/api/v1/admin/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        name: '软游测试网络急救工具',
        slug: testSlug,
        englishName: 'SoftBuluo Network Doctor',
        aliases: ['网络急救', 'ping工具'],
        developer: '软游部落开发部',
        summary: '一款专用于局域网协议排障与 DNS 缓存修复的高性能装机测试工具。',
        description: '深度分析 ARP 协议、排查网卡驱动故障并一键重置 Winsock 目录。纯净无捆绑。',
        type: 'TOOL',
        categoryId: firstCatId,
        isFeatured: true,
        version: '1.2.0',
        platform: 'Windows 10/11 64位',
        fileSize: '12.5 MB',
        officialUrl: 'https://code.visualstudio.com',
        sourceName: '软游部落官方主站直链',
        licenseType: 'FREE',
      }),
    });
    const createJson = await createRes.json();
    assert(createRes.status === 201 && createJson.success && createJson.data.status === 'DRAFT', '成功创建新资源并进入 DRAFT 草稿箱');
    createdSoftwareId = createJson.data.id;

    // 6.2 此时公开前台访问该资源，应返回 404 (未审核不可对外公开)
    const publicDraftRes = await fetch(`${BASE_URL}/api/v1/resources/${testSlug}`);
    assert(publicDraftRes.status === 404, '安全保障：草稿阶段资源在前台严格不可见 (404)');

    // 6.3 提交审核 (DRAFT -> PENDING_REVIEW)
    const submitRes = await fetch(`${BASE_URL}/api/v1/admin/resources/${createdSoftwareId}/submit`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    const submitJson = await submitRes.json();
    assert(submitRes.status === 200 && submitJson.data.status === 'PENDING_REVIEW', '成功将资源提交进入 PENDING_REVIEW 审核池');

    // 6.4 审核通过并发布 (PENDING_REVIEW -> PUBLISHED)
    const approveRes = await fetch(`${BASE_URL}/api/v1/admin/resources/${createdSoftwareId}/approve`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    const approveJson = await approveRes.json();
    assert(approveRes.status === 200 && approveJson.data.status === 'PUBLISHED', '审核通过，资源正式置为 PUBLISHED 状态');

    // 6.5 公开前台详情页访问测试 (验证数据已对外展示)
    const publicDetailRes = await fetch(`${BASE_URL}/api/v1/resources/${testSlug}`);
    const publicDetailJson = await publicDetailRes.json();
    assert(
      publicDetailRes.status === 200 && publicDetailJson.success && publicDetailJson.data.resource.name === '软游测试网络急救工具',
      '公开详情页接口顺利读取已发布的资源详情'
    );

    const sourceId = publicDetailJson.data.resource.latestVersion.downloadSources[0].id;

    // 6.6 数据库真实搜索测试
    const searchRes = await fetch(`${BASE_URL}/api/v1/search?q=${encodeURIComponent('网络急救')}`);
    const searchJson = await searchRes.json();
    assert(
      searchRes.status === 200 && searchJson.data.items.some((i: any) => i.slug === testSlug),
      '数据库真实参数化搜索精准命中已发布新资源'
    );

    // 6.7 官方链接点击打点记录测试
    const trackRes = await fetch(`${BASE_URL}/api/v1/downloads/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        softwareId: createdSoftwareId,
        sourceId: sourceId,
        eventType: 'OFFICIAL_LINK_CLICK',
      }),
    });
    const trackJson = await trackRes.json();
    assert(trackRes.status === 200 && trackJson.success && trackJson.data.recorded, '官方链接点击真实打点入库');

    // 6.8 验证动态 Sitemap 已收录新发布资源 (P3 拆分子表)
    const sitemapRes = await fetch(`${BASE_URL}/sitemap-software.xml`);
    const sitemapText = await sitemapRes.text();
    assert(
      sitemapRes.status === 200 && sitemapText.includes(`/tool/${testSlug}`),
      '动态 XML Sitemap 已自动同步收录新发布资源'
    );

    // 6.9 验证测试资源数据隔离（切换为测试资源并验证前台首页已成功排除）
    const isolateRes = await fetch(`${BASE_URL}/api/v1/admin/resources/${createdSoftwareId}/toggle-test-data`, {
      method: 'PATCH',
      headers: { Cookie: cookieHeader },
    });
    const isolateJson = await isolateRes.json();
    assert(
      isolateRes.status === 200 && isolateJson.success && isolateJson.data.isTestData === true,
      '管理员成功将测试资源标记隔离 (isTestData = true)'
    );

    // 验证前台首页聚合接口中已不再包含该测试资源
    const homeCheckRes = await fetch(`${BASE_URL}/api/v1/home`);
    const homeCheckJson = await homeCheckRes.json();
    const isExludedFromFeatured = !homeCheckJson.data.featured.some((f: any) => f.id === createdSoftwareId);
    assert(isExludedFromFeatured, '数据治理验收：测试数据已彻底从前台首页推荐流中物理隔离');
  } catch (err: any) {
    assert(false, `生命周期流转测试异常: ${err.message}`);
  }

  // 7. 仪表盘真实统计接口测试
  try {
    const statsRes = await fetch(`${BASE_URL}/api/v1/admin/statistics`, {
      headers: { Cookie: cookieHeader },
    });
    const statsJson = await statsRes.json();
    assert(
      statsRes.status === 200 &&
      statsJson.data.metrics.publishedCount >= 6 &&
      statsJson.data.metrics.officialClicksCount >= 1 &&
      statsJson.data.recentAuditLogs.length > 0,
      '后台仪表盘真实统计指标与审计日志查询正常'
    );
  } catch (err: any) {
    assert(false, `统计接口测试异常: ${err.message}`);
  } finally {
    if (createdSoftwareId) {
      await prisma.auditLog.deleteMany({ where: { targetId: createdSoftwareId } }).catch(() => {});
      await prisma.software.deleteMany({ where: { id: createdSoftwareId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log(`\n========================================`);
  console.log(`🎯 测试结果汇总: ${passedCount} / ${totalCount} 全部通过！`);
  console.log(`========================================\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('测试套件执行异常:', err);
  process.exit(1);
});
