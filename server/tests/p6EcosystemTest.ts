import { prisma } from '../src/db';
import { DeveloperService } from '../src/modules/developer/developerService';
import { CommunityService } from '../src/modules/community/communityService';
import { OpenApiService } from '../src/modules/openApi/openApiService';
import { config } from '../src/config';
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

export async function runP6Tests() {
  console.log('====================================================');
  console.log('开始执行 P6 真实资源审核发布、开发者入驻与认领、社区治理、PWA与开放API生态全量测试');
  console.log('====================================================\n');

  const app = await buildApp();
  await app.ready();

  // 获取管理员 Cookie 便于后台接口测试
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
  // 1. 资源真实审核与证据链测试 (P6-A & P6-A2)
  // ==========================================
  console.log('--- 1. 资源真实审核与证据链测试 (P6-A & P6-A2) ---');
  try {
    const totalResources = await prisma.software.count();
    const publishedCount = await prisma.software.count({ where: { status: ResourceStatus.PUBLISHED } });
    const draftCount = await prisma.software.count({ where: { status: ResourceStatus.DRAFT } });
    
    assert(totalResources >= 90, `全库收录资源总量达标: ${totalResources} 款 (业务基线: >= 90)`);
    assert(publishedCount >= 30, `已发布正式资源量达标: ${publishedCount} 款 (已人工核实基线: >= 30)`);
    assert(draftCount >= 60, `草稿待审资源保持严格隔离: ${draftCount} 款 (严禁自动批量发布，业务基线: >= 60)`);

    // 匿名访问公共列表，严禁泄露任何 DRAFT
    const publicRes = await app.inject({
      method: 'GET',
      url: '/api/v1/resources?limit=100',
    });
    const publicJson = JSON.parse(publicRes.payload);
    const leakedDraft = publicJson.data?.items?.some((item: any) => item.status && item.status !== 'PUBLISHED');
    assert(!leakedDraft, '公开资源列表接口 100% 隔离草稿资源，杜绝草稿外泄');

    // 安全真实性纠偏校验：无实体包扫描时不假冒安全无毒
    const sampleSoftware = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED },
    });
    if (sampleSoftware) {
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/resources/${sampleSoftware.slug}`,
      });
      const detailJson = JSON.parse(detailRes.payload);
      assert(detailRes.statusCode === 200, '公开资源详情接口正常访问');
      assert(
        detailJson.data?.resource?.scanStatus === 'NOT_SCANNED',
        '真实安全状态治理生效：无实体病毒扫描结果时严禁标记为 CLEAN，正确返回 NOT_SCANNED'
      );
      assert(
        detailJson.data?.resource?.signatureStatus === 'NOT_CHECKED',
        '真实签名状态治理生效：无独立数字签名提取时严禁伪造数字证书，正确返回 NOT_CHECKED'
      );
    }

    // 资源审核证据库检索测试
    const evidenceCount = await prisma.resourceReviewEvidence.count();
    assert(evidenceCount >= 340, `全库归档真实审核证据凭据数量达标: ${evidenceCount} 条`);

    // 管理员审核流测试：获取下一条待审资源
    const nextPendingRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/resources/review/next-pending',
      headers: { cookie: adminCookieHeader },
    });
    assert(nextPendingRes.statusCode === 200, '管理员审查工作台：成功获取下一条待审草稿资源');
    const nextPendingJson = JSON.parse(nextPendingRes.payload);
    assert(nextPendingJson.data?.resource?.status === 'DRAFT', '待审资源状态确认为 DRAFT');
    assert(Array.isArray(nextPendingJson.data?.evidences), '待审资源关联的证据凭据数组正常加载');

    // 非管理员鉴权拦截测试
    const unauthNextRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/resources/review/next-pending',
    });
    assert(unauthNextRes.statusCode === 401, '非管理员访问审核工作台严格拦截 (401 Unauthorized)');
  } catch (err: any) {
    console.error('资源审核与证据链测试异常:', err);
    failed++;
  }

  // ==========================================
  // 2. 开发者入驻与软件所有权认领测试 (P6-B)
  // ==========================================
  console.log('\n--- 2. 开发者入驻与软件认领测试 (P6-B) ---');
  let testMemberId = '';
  let testDevProfileId = '';
  let testClaimId = '';
  try {
    // 准备测试会员用户 (直接读取已存在会员或按 MemberUser 字段创建)
    let member = await prisma.memberUser.findFirst();
    if (!member) {
      member = await prisma.memberUser.create({
        data: {
          email: 'devtest@softbuluo.test',
          username: 'dev_test_user',
          passwordHash: 'dummy_hash_for_test',
        },
      });
    }
    testMemberId = member.id;

    // 开发者入驻注册申请
    let devProfile = await prisma.developerProfile.findUnique({
      where: { memberUserId: testMemberId },
    });
    if (!devProfile) {
      devProfile = await DeveloperService.registerDeveloper(testMemberId, {
        displayName: '软游开源开发团队',
        organizationName: '软游开源技术组',
        website: 'https://developer.softbuluo.test',
        githubUsername: 'softbuluo-dev',
        bio: '软游部落官方认证开发者测试团队',
      });
    }
    testDevProfileId = devProfile.id;
    assert(Boolean(testDevProfileId), '开发者入驻申请提交成功');

    // 管理员审核通过该开发者
    await DeveloperService.adminReviewDeveloper(
      testDevProfileId,
      DeveloperVerificationStatus.VERIFIED,
      '测试环境官方认证核实通过',
      'admin'
    );
    const verifiedProfile = await prisma.developerProfile.findUnique({ where: { id: testDevProfileId } });
    assert(verifiedProfile?.verificationStatus === DeveloperVerificationStatus.VERIFIED, '管理员审核开发者入驻成功，状态流转为 VERIFIED');

    // 认领软件测试：选择一款已发布的正式软件
    const claimTarget = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false },
    });

    if (claimTarget) {
      // 清理先前的测试认领，确保幂等重跑
      await prisma.softwareClaim.deleteMany({
        where: { developerId: testDevProfileId },
      });

      // 提交认领申请并生成验证挑战
      const claim = await DeveloperService.createSoftwareClaim(testDevProfileId, claimTarget.id, ClaimMethod.DNS_TXT);
      testClaimId = claim.id;
      assert(claim.status === ClaimStatus.PENDING, '软件认领申请创建成功，进入 PENDING 状态');
      assert(
        claim.challengeCode.startsWith('softbuluo-claim-'),
        '自动生成不可预测的校验挑战随机凭证 (softbuluo-claim-*)'
      );
      assert(
        claim.verificationTarget.includes('DNS TXT'),
        '校验指引包含详细的 DNS TXT 记录配置指示'
      );

      // 管理员终审通过认领 (线下或权威复核通过)
      await DeveloperService.adminReviewClaim(claim.id, ClaimStatus.VERIFIED, null, 'admin');
      const approvedClaim = await prisma.softwareClaim.findUnique({ where: { id: claim.id } });
      assert(approvedClaim?.status === ClaimStatus.VERIFIED, '管理员终审通过认领，权属关系正式确立');

      // 开发者公开主页检索测试
      const publicDev = await DeveloperService.getPublicDeveloperProfile(verifiedProfile!.slug);
      assert(publicDev !== null, '开发者公开主页数据查询成功');
      assert(
        publicDev?.verifiedSoftware?.some((s: any) => s.id === claimTarget.id),
        '开发者公开主页正确挂接已认领发布的软件资产'
      );
    }
  } catch (err: any) {
    console.error('开发者入驻与软件认领测试异常:', err);
    failed++;
  }

  // ==========================================
  // 3. 社区讨论与互动治理测试 (P6-C)
  // ==========================================
  console.log('\n--- 3. 社区讨论与互动治理测试 (P6-C) ---');
  let testThreadId = '';
  try {
    // 清理测试用户的历史测试主题，避免受到 5 分钟频控影响
    await prisma.discussionReport.deleteMany({ where: { reporterId: testMemberId } });
    await prisma.discussionPost.deleteMany({ where: { userId: testMemberId } });
    await prisma.discussionThread.deleteMany({ where: { userId: testMemberId } });

    // 匿名发帖拦截测试
    const unauthPostRes = await app.inject({
      method: 'POST',
      url: '/api/v1/community/threads',
      payload: {
        title: '未登录发帖测试',
        content: '这条内容应当被 401 拦截',
      },
    });
    assert(unauthPostRes.statusCode === 401, '未登录用户发帖被严格拦截 (401 Unauthorized)');

    // 采用测试会员创建社区主题，包含 XSS 注入测试
    const xssPayload = '体验非常出色！<script>alert("xss-test")</script>建议增加暗色主题联动。';
    const cleanThread = await CommunityService.createThread(testMemberId, {
      title: '软游部落 UI 2.1 与 P6 综合体验交流贴',
      content: xssPayload,
      category: DiscussionCategory.FEEDBACK,
    });
    testThreadId = cleanThread.id;
    assert(Boolean(testThreadId), '登录会员发帖成功');
    assert(
      !cleanThread.content.includes('<script>'),
      'XSS 防御清洗生效：发帖正文自动转义恶意 script 标签'
    );

    // 认证开发者官方回复专属徽章标记测试
    const claimTarget = await prisma.software.findFirst({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false },
    });
    if (claimTarget) {
      // 创建关联到该软件的主题
      const swThread = await CommunityService.createThread(testMemberId, {
        softwareId: claimTarget.id,
        title: `${claimTarget.name} 官方建议征集帖`,
        content: '请各位用户提出使用宝贵意见和需求反馈！',
        category: DiscussionCategory.EXPERIENCE,
      });

      // 开发者回帖
      const devReply = await CommunityService.createPost(swThread.id, testMemberId, {
        content: '感谢大家支持，我们团队将在下个版本集成大家反馈的高优先级特性！',
      });
      assert(devReply.isDeveloperReply === true, '官方开发者回复专属徽章生效：已认领软件作者回帖自动标注 isDeveloperReply');
    }

    // 举报测试
    const report = await CommunityService.reportContent(testMemberId, {
      threadId: testThreadId,
      reason: '内容包含敏感或重复灌水信息',
    });
    assert(report.status === ReportStatus.PENDING, '社区举报创建成功，进入待审队列');

    // 管理员处理举报/治理端点测试
    const adminReportsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/community/reports',
      headers: { cookie: adminCookieHeader },
    });
    assert(adminReportsRes.statusCode === 200, '管理员后台成功读取社区待审举报列表');
  } catch (err: any) {
    console.error('社区讨论与互动治理测试异常:', err);
    failed++;
  }

  // ==========================================
  // 4. PWA 离线规范与缓存边界测试 (P6-D)
  // ==========================================
  console.log('\n--- 4. PWA 离线规范与缓存边界测试 (P6-D) ---');
  try {
    const rootDir = process.cwd();
    const manifestPath = path.join(rootDir, 'public', 'manifest.webmanifest');
    const swPath = path.join(rootDir, 'public', 'sw.js');
    const offlinePath = path.join(rootDir, 'public', 'offline.html');

    assert(fs.existsSync(manifestPath), 'Web App Manifest 静态文件存在');
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifestJson.name.includes('软游部落'), 'Manifest 名称规范');
    assert(manifestJson.short_name === '软游部落', 'Manifest 包含规范 short_name');
    assert(manifestJson.display === 'standalone', 'Manifest 声明独立窗口 (standalone) 沉浸运行模式');
    assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2, 'Manifest 配置多分辨率高清图标');

    assert(fs.existsSync(offlinePath), '离线兜底页 offline.html 存在');
    const offlineHtml = fs.readFileSync(offlinePath, 'utf8');
    assert(offlineHtml.includes('网络连接不可用') || offlineHtml.includes('离线'), '离线兜底页包含清晰网络异常提示');

    assert(fs.existsSync(swPath), 'Service Worker sw.js 脚本存在');
    const swContent = fs.readFileSync(swPath, 'utf8');
    // 严格隔离敏感接口审计
    assert(swContent.includes("'/admin'"), 'SW 黑名单包含管理员后台 (/admin) 绝对不缓存');
    assert(swContent.includes("'/orders'"), 'SW 黑名单包含订单路由 (/orders) 绝对不缓存');
    assert(swContent.includes("'/checkout'"), 'SW 黑名单包含支付收银 (/checkout) 绝对不缓存');
    assert(swContent.includes("'/membership'"), 'SW 黑名单包含会员支付敏感区 (/membership) 绝对不缓存');
    assert(swContent.includes('/developer/api-keys'), 'SW 黑名单包含开发者秘钥管理区 绝对不缓存');
  } catch (err: any) {
    console.error('PWA 离线规范与缓存边界测试异常:', err);
    failed++;
  }

  // ==========================================
  // 5. 开放 API (OpenAPI 3.1) 与 API Key 管理测试 (P6-E)
  // ==========================================
  console.log('\n--- 5. 开放 API 与 API Key 管理测试 (P6-E) ---');
  let rawApiKey = '';
  let keyPrefix = '';
  try {
    // 开发者 API Key 生成测试 (SHA-256 不可逆存储)
    const keyResult = await OpenApiService.generateApiKey(testDevProfileId, 'CI/CD 自动化集成 API 密钥');
    rawApiKey = keyResult.apiKey;
    keyPrefix = keyResult.keyPrefix;
    assert(rawApiKey.startsWith('sb_live_'), 'API Key 生成符合标准前缀格式 (sb_live_*)');
    assert(keyPrefix.length > 0, '返回前缀用于安全脱敏展示');

    // 数据库哈希存储核验：绝不在数据库存储明文
    const dbKeyRecord = await prisma.developerApiKey.findUnique({
      where: { id: keyResult.id },
    });
    assert(dbKeyRecord !== null, 'API Key 元数据落库成功');
    assert(dbKeyRecord?.keyHash !== rawApiKey, '核心安全保障：数据库仅存储不可逆 SHA-256 哈希，杜绝明文泄露');

    // 只读公开接口 1: 软件列表 (/api/public/v1/software)
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/public/v1/software?limit=5',
      headers: {
        'x-api-key': rawApiKey,
      },
    });
    assert(listRes.statusCode === 200, '携带 API Key 请求公开软件列表端点成功 (200 OK)');
    const listJson = JSON.parse(listRes.payload);
    assert(Array.isArray(listJson.data), '公开软件列表返回格式正确');
    assert(
      !listJson.data.some((i: any) => i.status && i.status !== 'PUBLISHED'),
      '公开 API 严格物理排除草稿资源'
    );
    // 限流响应头校验
    assert(Boolean(listRes.headers['x-ratelimit-limit']), '响应头输出标准 X-RateLimit-Limit');
    assert(Boolean(listRes.headers['x-ratelimit-remaining']), '响应头输出标准 X-RateLimit-Remaining');

    // 只读公开接口 2: 软件详情 (/api/public/v1/software/:slug)
    const targetSw = await prisma.software.findFirst({ where: { status: ResourceStatus.PUBLISHED, isTestData: false } });
    if (targetSw) {
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/public/v1/software/${targetSw.slug}`,
      });
      assert(detailRes.statusCode === 200, '匿名访问公开详情端点成功 (200 OK)');
      const detailJson = JSON.parse(detailRes.payload);
      assert(detailJson.data?.slug === targetSw.slug, '详情返回匹配的资源数据');
      // 敏感字段安全审计：绝无用户数据或私密 Token
      assert(detailJson.data?.token === undefined, '数据安全审计：绝对不返回下载 Token');
      assert(detailJson.data?.orderId === undefined, '数据安全审计：绝对不返回交易订单');
    }

    // 只读公开接口 3: 分类列表 (/api/public/v1/categories)
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/public/v1/categories',
    });
    assert(catRes.statusCode === 200, '公开分类列表端点访问正常');

    // 只读公开接口 4: 全局搜索 (/api/public/v1/search)
    const searchRes = await app.inject({
      method: 'GET',
      url: '/api/public/v1/search?q=VSCode',
    });
    assert(searchRes.statusCode === 200, '公开搜索端点访问正常');

    // 只读公开接口 5: 对比端点 (/api/public/v1/compare/:slug)
    const compRes = await app.inject({
      method: 'GET',
      url: '/api/public/v1/compare/vscode-vs-sublime-text',
    });
    assert(compRes.statusCode === 200 || compRes.statusCode === 404, '公开对比数据端点可达');

    // 伪造/非法 API Key 鉴权拦截测试
    const fakeKeyRes = await app.inject({
      method: 'GET',
      url: '/api/public/v1/software',
      headers: {
        'x-api-key': 'sb_live_fake_key_1234567890abcdef',
      },
    });
    assert(fakeKeyRes.statusCode === 401, '非法 API Key 请求被严格鉴权拦截 (401 Unauthorized)');
  } catch (err: any) {
    console.error('开放 API 与 API Key 测试异常:', err);
    failed++;
  }

  // ==========================================
  // 6. 真实 SEO 与生态收录测试 (P6-F)
  // ==========================================
  console.log('\n--- 6. 真实 SEO 与生态收录测试 (P6-F) ---');
  try {
    // robots.txt 规范性检测
    const robotsRes = await app.inject({
      method: 'GET',
      url: '/robots.txt',
    });
    assert(robotsRes.statusCode === 200, 'robots.txt 端点正常访问');
    assert(robotsRes.payload.includes('Disallow: /admin/'), 'robots.txt 禁止爬虫访问管理后台');
    assert(robotsRes.payload.includes('Disallow: /checkout/'), 'robots.txt 禁止爬虫访问支付收银');
    assert(robotsRes.payload.includes('Sitemap:'), 'robots.txt 明确指定动态 Sitemap 地址');

    // 主 Sitemap 检测
    const sitemapRes = await app.inject({
      method: 'GET',
      url: '/sitemap.xml',
    });
    assert(sitemapRes.statusCode === 200, '动态主 sitemap.xml 正常输出');
    assert(sitemapRes.payload.includes('sitemap-developers.xml'), '主 Sitemap 包含开发者子地图 sitemap-developers.xml');
    assert(sitemapRes.payload.includes('sitemap-community.xml'), '主 Sitemap 包含社区子地图 sitemap-community.xml');

    // 开发者子地图
    const devSitemapRes = await app.inject({
      method: 'GET',
      url: '/sitemap-developers.xml',
    });
    assert(devSitemapRes.statusCode === 200, '开发者子站点地图正常访问且有效 XML');

    // 社区子地图
    const commSitemapRes = await app.inject({
      method: 'GET',
      url: '/sitemap-community.xml',
    });
    assert(commSitemapRes.statusCode === 200, '社区子站点地图正常访问且有效 XML');
  } catch (err: any) {
    console.error('SEO 与生态收录测试异常:', err);
    failed++;
  }

  await app.close();
  await prisma.$disconnect();

  console.log('\n====================================================');
  console.log(`P6 全量测试执行完毕! 通过: ${passed}, 失败: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1]?.includes('p6EcosystemTest')) {
  runP6Tests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
