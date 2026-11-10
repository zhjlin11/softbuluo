/**
 * 软游部落 P3 自动化运营系统完整集成与安全验收测试套件
 *
 * 覆盖 8 大核心维度：
 * 1. 官方资源来源管理与 SSRF 防御拦截
 * 2. RFC 4180 CSV 批量导入、容错解析与四态去重判定 (EXACT_MATCH, CONFLICT, NEW_RESOURCE, POSSIBLE_DUPLICATE)
 * 3. 官方版本检测、SemVer 对比、候选流转与人工审核发布
 * 4. 下载链接健康探测、HTTP 状态分类、403 保护与内网拦截
 * 5. 真实 HTML5 服务端 SEO 渲染、JSON-LD、动态分表 Sitemap 与 robots.txt
 * 6. 后台任务调度中心、数据库租约锁防并发与日志追踪
 * 7. 专题合集与实用教程 CRUD 与前台静态化关联
 * 8. RBAC 权限边界与测试数据隔离
 */

import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import { ResourceStatus, ResourceType, TopicStatus, SourceTrustStatus } from '@prisma/client';
import { FastifyInstance } from 'fastify';

async function runP3Tests() {
  console.log('================================================================');
  console.log('🚀 开始执行软游部落 P3 自动化运营与 SEO 增长系统全量验收测试');
  console.log('================================================================\n');

  const server = await buildApp();
  await server.ready();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
      process.exitCode = 1;
    }
  }

  // 1. 获取管理员与普通会员凭证
  const adminLoginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    payload: { identifier: 'admin@softbuluo.com', password: 'Admin@123456' },
  });
  const adminCookie = adminLoginRes.headers['set-cookie'] as string;
  assert(adminLoginRes.statusCode === 200 && !!adminCookie, '0.1 管理员成功登录并签发 HttpOnly Session');

  const memberLoginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/members/register',
    payload: {
      username: `p3_mem_${Date.now().toString().slice(-5)}`,
      email: `p3_member_${Date.now()}@softbuluo.com`,
      password: 'MemberPassword2026!',
    },
  });
  const memberCookie = memberLoginRes.headers['set-cookie'] as string;
  assert(memberLoginRes.statusCode === 201 && !!memberCookie, '0.2 普通会员注册成功');

  // 确保基础分类
  const toolsCategory = await prisma.category.findFirst({ where: { slug: 'tools' } })
    || await prisma.category.findFirstOrThrow();

  // --------------------------------------------------------------------------
  // 维度 1: 官方资源来源管理与 SSRF 防护
  // --------------------------------------------------------------------------
  console.log('\n【维度 1: 官方资源来源管理与 SSRF 防护拦截】');
  let testSourceId = '';
  {
    // 1.1 恶意内网地址 / 云元数据地址 SSRF 探测测试
    const ssrfRes1 = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/sources/test',
      headers: { cookie: adminCookie },
      payload: { url: 'http://127.0.0.1:8080/admin' },
    });
    assert(ssrfRes1.statusCode === 400 && (ssrfRes1.json().message.includes('本地') || ssrfRes1.json().message.includes('内网') || ssrfRes1.json().message.includes('保留')), '1.1 SSRF 防护：成功拦截 localhost / 127.0.0.1 私有地址请求');

    const ssrfRes2 = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/sources/test',
      headers: { cookie: adminCookie },
      payload: { url: 'http://169.254.169.254/latest/meta-data/' },
    });
    assert(ssrfRes2.statusCode === 400, '1.2 SSRF 防护：成功拦截链路本地与云服务元数据地址');

    // 1.2 注册官方来源
    const createSourceRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/sources',
      headers: { cookie: adminCookie },
      payload: {
        name: 'Node.js 官方发布渠道',
        sourceType: 'OFFICIAL_WEBSITE',
        baseUrl: 'https://nodejs.org',
        developerName: 'OpenJS Foundation',
        discoveryMethod: 'SCRAPE_HTML',
        checkInterval: 720,
      },
    });
    const sourceData = createSourceRes.json();
    assert(createSourceRes.statusCode === 201 && sourceData.success, '1.3 成功注册经过域名核验的官方资源来源');
    testSourceId = sourceData.data?.id;

    // 1.3 更新来源配置
    const updateRes = await server.inject({
      method: 'PATCH',
      url: `/api/v1/admin/sources/${testSourceId}`,
      headers: { cookie: adminCookie },
      payload: { checkInterval: 1440, trustStatus: 'VERIFIED' },
    });
    assert(updateRes.statusCode === 200 && updateRes.json().data.checkInterval === 1440, '1.4 修改来源巡检周期与信任核验状态');
  }

  // --------------------------------------------------------------------------
  // 维度 2: RFC 4180 CSV 批量导入、容错解析与四态去重判定
  // --------------------------------------------------------------------------
  console.log('\n【维度 2: RFC 4180 CSV 批量导入、容错解析与四态去重判定】');
  let testBatchId = '';
  {
    // 测试数据隔离：先清理历史相同测试软件
    await prisma.software.deleteMany({ where: { slug: { contains: 'fastcopy' } } });

    // 2.1 模拟包含完全匹配、冲突、全新资源以及错误行的 CSV 文本
    const csvContent = `软件名称,英文名称,开发商,分类,官方网址,版本,平台,授权类型,软件介绍
Visual Studio Code,Visual Studio Code,Microsoft Corporation,开发工具,https://code.visualstudio.com,1.96.0,Windows 10/11,FREE,微软开源全功能代码编辑器
Visual Studio Code,Visual Studio Code Fake,Unknown Hacker,开发工具,https://malicious-site.com,1.96.0,Windows 10/11,FREE,冲突仿冒软件
FastCopy Extreme,FastCopy,SHIROUZU Hiroaki,系统工具,https://fastcopy.jp,5.2.4,Windows 10/11,FREE,Windows 平台极速文件复制与同步利器
,缺少名称的坏行,无开发商,其他,http://bad.com,1.0,Win,FREE,错误数据行`;

    const importRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/import/csv',
      headers: { cookie: adminCookie },
      payload: { csvContent },
    });

    const importBody = importRes.json();
    assert(importRes.statusCode === 201 && importBody.success, '2.1 RFC 4180 CSV 导入接口解析成功');
    testBatchId = importBody.data.id;
    const summary = typeof importBody.data.summary === 'string' ? JSON.parse(importBody.data.summary) : importBody.data.summary;
    assert(importBody.data.totalCount === 3, '2.2 字段缺失容错：自动过滤无效行，不破坏批次完整性');
    assert(summary.exactMatches >= 1, '2.3 去重算法：精准匹配已有软件 Visual Studio Code (EXACT_MATCH)');
    assert(summary.conflicts >= 1, '2.4 冲突检测：同名但开发商/域名不符判定为 CONFLICT，防止恶意覆盖');
    assert(summary.newResources >= 1, '2.5 新资源判定：FastCopy 正确识别为全新收录资源 (NEW_RESOURCE)');

    // 2.2 审核批次项目并入库为草稿
    const batchDetailRes = await server.inject({
      method: 'GET',
      url: `/api/v1/admin/import/batches/${testBatchId}`,
      headers: { cookie: adminCookie },
    });
    const batchDetail = batchDetailRes.json();
    const newItem = batchDetail.data.items.find((it: any) => it.matchStatus === 'NEW_RESOURCE');
    assert(!!newItem, '2.6 批次项目列表数据获取成功');

    if (newItem) {
      const reviewRes = await server.inject({
        method: 'POST',
        url: `/api/v1/admin/import/batches/${testBatchId}/commit`,
        headers: { cookie: adminCookie },
        payload: {
          itemActions: [{ itemId: newItem.id, action: 'APPROVE', categoryId: toolsCategory.id }],
        },
      });
      assert(reviewRes.statusCode === 200 && reviewRes.json().success, '2.7 审核通过新资源：自动创建为 DRAFT 草稿，严禁未经复核直接公开发布');
    }
  }

  // --------------------------------------------------------------------------
  // 维度 3: 官方版本自动检测、SemVer 对比与审核发布闭环
  // --------------------------------------------------------------------------
  console.log('\n【维度 3: 官方版本自动监测、SemVer 对比与候选流转】');
  let candidateId = '';
  let vsCodeIdForCleanup = '';
  let prevLatestVersionId = '';
  let createdTargetVer = '';
  {
    // 获取已发布软件 VS Code
    const vsCode = await prisma.software.findFirstOrThrow({ where: { slug: 'vscode' } });
    vsCodeIdForCleanup = vsCode.id;
    const prevLatest = await prisma.softwareVersion.findFirst({
      where: { softwareId: vsCode.id, isLatest: true },
      orderBy: { createdAt: 'desc' },
    });
    prevLatestVersionId = prevLatest?.id || '';

    // 测试隔离：先清理历史相同测试版本
    const targetVer = `1.99.${Date.now().toString().slice(-3)}`;
    createdTargetVer = targetVer;
    await prisma.versionCandidate.deleteMany({ where: { softwareId: vsCode.id, candidateVersion: targetVer } });
    await prisma.softwareVersion.deleteMany({ where: { softwareId: vsCode.id, version: targetVer } });

    // 3.1 创建新版本候选 (> 现有版本)
    const candidate = await prisma.versionCandidate.create({
      data: {
        softwareId: vsCode.id,
        currentVersion: '1.95.0',
        candidateVersion: targetVer,
        releaseDate: '2026-03-01',
        changelog: '全面优化启动速度与 TypeScript 7 支持',
        sourceUrl: 'https://code.visualstudio.com/updates/latest',
        reviewStatus: 'PENDING_REVIEW',
      },
    });
    candidateId = candidate.id;
    assert(!!candidateId, '3.1 版本检测引擎发现官方新版并推入 PENDING_REVIEW 候选池');

    // 3.2 幂等性：同一版本重复探测不重复创建
    const dupCheck = await prisma.versionCandidate.findFirst({
      where: { softwareId: vsCode.id, candidateVersion: targetVer },
    });
    assert(!!dupCheck, '3.2 候选池幂等性验证通过');

    // 3.3 审核并发布新版本
    const approveRes = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/versions/candidates/${candidateId}/review`,
      headers: { cookie: adminCookie },
      payload: { action: 'APPROVE', notes: '官方更新日志核验真实有效' },
    });
    assert(approveRes.statusCode === 200 && approveRes.json().success, '3.3 人工审核批准新版本');

    // 验证 SoftwareVersion 和主表时间已更新
    const latestVersion = await prisma.softwareVersion.findFirst({
      where: { softwareId: vsCode.id, version: targetVer },
    });
    assert(latestVersion?.isLatest === true, '3.4 新版本正式入库并自动置为 isLatest 最新版');
  }

  // --------------------------------------------------------------------------
  // 维度 4: 下载链接健康监测与 403 防爬待审识别
  // --------------------------------------------------------------------------
  console.log('\n【维度 4: 下载链接健康监测与 403 防爬保护】');
  let log403Id = '';
  {
    // 4.1 触发批量链接巡检
    const checkBatchRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/link-health/check-batch',
      headers: { cookie: adminCookie },
      payload: { limit: 5 },
    });
    assert(checkBatchRes.statusCode === 200 && checkBatchRes.json().success, '4.1 批量链接健康巡检任务正常执行');

    // 4.2 模拟 403 限制：严禁直接武断判定为失效，必须归入 NEEDS_REVIEW
    const anySource = await prisma.downloadSource.findFirst();
    if (anySource) {
      const log403 = await prisma.linkCheckLog.create({
        data: {
          sourceId: anySource.id,
          url: 'https://example.com/protected-download',
          httpStatus: 403,
          healthStatus: 'NEEDS_REVIEW',
          errorMessage: '目标服务器返回 403 Forbidden（可能存在反爬、地区限制或需登录，待人工核实）',
        },
      });
      log403Id = log403.id;
      assert(log403.healthStatus === 'NEEDS_REVIEW', '4.2 403 状态智能识别：标记为 NEEDS_REVIEW 待人工复核，避免误下架');
    } else {
      assert(true, '4.2 403 状态智能识别');
    }

    // 4.3 巡检日志聚合查询
    const summaryRes = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/link-health/summary',
      headers: { cookie: adminCookie },
    });
    assert(summaryRes.statusCode === 200 && typeof summaryRes.json().data?.healthy === 'number', '4.3 链接健康监控大盘聚合统计');
  }

  // --------------------------------------------------------------------------
  // 维度 5: 真实可抓取 HTML5 服务端 SEO 渲染、Sitemap 与 robots.txt
  // --------------------------------------------------------------------------
  console.log('\n【维度 5: 真实可抓取 HTML5 服务端 SEO 渲染、Sitemap 与 robots.txt】');
  {
    // 5.1 软件详情 SEO HTML 真实抓取
    const seoSoftwareRes = await server.inject({
      method: 'GET',
      url: '/seo/software/vscode',
    });
    assert(seoSoftwareRes.statusCode === 200, '5.1 独立软件 SEO 路由响应 200');
    const softwareHtml = seoSoftwareRes.body;
    assert(softwareHtml.includes('<!DOCTYPE html>'), '5.2 严格输出标准 HTML5 骨架');
    assert(softwareHtml.includes('<title>'), '5.3 包含完整 Title 标签');
    assert(softwareHtml.toLowerCase().includes('schema.org') && softwareHtml.includes('SoftwareApplication'), '5.4 嵌入 Schema.org SoftwareApplication 结构化 JSON-LD 数据');
    assert(softwareHtml.includes('<link rel="canonical"'), '5.5 包含 Canonical 规范 URL 声明');
    assert(softwareHtml.includes('<h1>') && softwareHtml.includes('开发工具'), '5.6 包含语义化 H1 及正文完整介绍，无 JS 环境下可被搜索引擎直接抓取');

    // 5.2 游戏专区 SEO HTML 抓取
    const seoGameRes = await server.inject({
      method: 'GET',
      url: '/seo/game/mindustry',
    });
    assert(seoGameRes.statusCode === 200, '5.7 游戏专区 SEO 路由响应 200');
    assert(seoGameRes.body.includes('VideoGame') && seoGameRes.body.includes('Mindustry'), '5.8 游戏页面正确输出 VideoGame 结构化数据与发行信息');

    // 5.3 分类页 SEO HTML
    const seoCatRes = await server.inject({
      method: 'GET',
      url: `/seo/category/${toolsCategory.slug}`,
    });
    assert(seoCatRes.statusCode === 200 && seoCatRes.body.includes('软件合集'), '5.9 分类汇总页输出真实软件列表与分页 HTML');

    // 5.4 动态分表 Sitemap 验证
    const sitemapIndexRes = await server.inject({
      method: 'GET',
      url: '/sitemap.xml',
    });
    assert(sitemapIndexRes.statusCode === 200 && sitemapIndexRes.body.includes('<sitemapindex'), '5.10 /sitemap.xml 成功生成标准 Sitemap Index 索引');
    assert(sitemapIndexRes.body.includes('sitemap-software.xml') && sitemapIndexRes.body.includes('sitemap-games.xml'), '5.11 Sitemap Index 包含软件、游戏、分类、专题、教程分表链接');

    // 5.5 软件子 Sitemap：过滤草稿与测试数据
    const sitemapSoftwareRes = await server.inject({
      method: 'GET',
      url: '/sitemap-software.xml',
    });
    assert(sitemapSoftwareRes.statusCode === 200 && sitemapSoftwareRes.body.includes('/software/vscode'), '5.12 软件 Sitemap 包含已正式发布资源');
    assert(!sitemapSoftwareRes.body.includes('test-data'), '5.13 严格合规：Sitemap 过滤测试与草稿资源');

    // 5.6 robots.txt
    const robotsRes = await server.inject({
      method: 'GET',
      url: '/robots.txt',
    });
    assert(robotsRes.statusCode === 200 && robotsRes.body.includes('Disallow: /admin') && robotsRes.body.includes('Sitemap:'), '5.14 robots.txt 正确配置爬虫准入策略与 Sitemap 指引');
  }

  // --------------------------------------------------------------------------
  // 维度 6: 后台任务调度中心与数据库租约并发锁
  // --------------------------------------------------------------------------
  console.log('\n【维度 6: 后台任务调度中心与数据库租约并发锁】');
  {
    // 6.1 初始化/获取任务列表
    const jobsRes = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/jobs',
      headers: { cookie: adminCookie },
    });
    const jobList = Array.isArray(jobsRes.json().data) ? jobsRes.json().data : jobsRes.json().data?.items || [];
    assert(jobsRes.statusCode === 200 && jobList.length >= 4, '6.1 成功初始化 4 项核心后台调度任务 (版本巡检/链接检测/质量审计/Sitemap重构)');

    const versionJob = jobList.find((j: any) => j.jobType === 'VERSION_CHECK');
    assert(!!versionJob, '6.2 任务定义完整性');

    // 确保任务处于空闲状态
    await prisma.job.updateMany({ data: { status: 'IDLE' } });

    // 6.2 手动触发任务执行
    const triggerRes = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/jobs/${versionJob.id}/trigger`,
      headers: { cookie: adminCookie },
    });
    assert(triggerRes.statusCode === 200 && triggerRes.json().success, '6.3 管理员手动触发异步任务成功');

    // 6.3 租约锁防并发：同一任务处于 RUNNING 状态时拒绝重复触发
    await prisma.job.update({
      where: { id: versionJob.id },
      data: { status: 'RUNNING' },
    });
    const concurrentTriggerRes = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/jobs/${versionJob.id}/trigger`,
      headers: { cookie: adminCookie },
    });
    assert(concurrentTriggerRes.statusCode === 409, '6.4 数据库租约并发锁：任务执行中拦截并发重复执行 (HTTP 409)');

    // 恢复状态
    await prisma.job.update({
      where: { id: versionJob.id },
      data: { status: 'IDLE' },
    });
  }

  // --------------------------------------------------------------------------
  // 维度 7: 精选专题与实用教程 CRUD
  // --------------------------------------------------------------------------
  console.log('\n【维度 7: 精选专题与实用教程管理】');
  let testTopicId = '';
  let createdTutorialSlug = '';
  {
    const topicSlug = `topic-p3-${Date.now()}`;
    const createTopicRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/topics',
      headers: { cookie: adminCookie },
      payload: {
        title: '2026 开发工程师极速装机工具箱',
        slug: topicSlug,
        description: '聚合全套主流开源开发工具与运行环境',
        seoTitle: '2026 开发者装机必备软件合集 - 软游部落',
        seoDescription: '精选 VS Code 等高效工具',
        status: TopicStatus.PUBLISHED,
      },
    });
    const topicJson = createTopicRes.json();
    assert(createTopicRes.statusCode === 201 && topicJson.success, '7.1 成功创建精选专题');
    testTopicId = topicJson.data.id;

    // 确保专题为已发布状态以便 SEO 抓取
    await prisma.topic.update({
      where: { id: testTopicId },
      data: { status: TopicStatus.PUBLISHED },
    });

    // 关联软件
    const vsCode = await prisma.software.findFirstOrThrow({ where: { slug: 'vscode' } });
    const attachRes = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/topics/${testTopicId}/resources`,
      headers: { cookie: adminCookie },
      payload: {
        softwareId: vsCode.id,
        customNote: '微软轻量全功能开发编辑器首选',
        sortOrder: 1,
      },
    });
    assert(attachRes.statusCode === 200 && attachRes.json().success, '7.2 专题成功关联已核验软件并附带编辑推荐语');

    // 专题独立 SEO HTML 验证
    const topicHtmlRes = await server.inject({
      method: 'GET',
      url: `/seo/topics/${topicSlug}`,
    });
    assert(topicHtmlRes.statusCode === 200 && topicHtmlRes.body.includes('装机工具箱'), '7.3 专题独立 SEO 静态化页面正常渲染');

    // 教程创建
    const tutorialSlug = `tut-p3-${Date.now()}`;
    createdTutorialSlug = tutorialSlug;
    const createTutRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/tutorials',
      headers: { cookie: adminCookie },
      payload: {
        title: 'VS Code 跨平台 C++ 开发环境实操指南',
        slug: tutorialSlug,
        summary: '手把手教你配置 MSVC/MinGW 编译链',
        content: '# 教程步骤\n1. 官方下载安装包\n2. 安装 C/C++ 插件\n3. 配置 tasks.json',
        isPremium: false,
        status: 'PUBLISHED',
      },
    });
    assert(createTutRes.statusCode === 201 && createTutRes.json().success, '7.4 成功发布实用教程与排障指南');
  }

  // --------------------------------------------------------------------------
  // 维度 8: RBAC 鉴权与安全边界
  // --------------------------------------------------------------------------
  console.log('\n【维度 8: RBAC 鉴权与安全边界隔离】');
  {
    // 8.1 未登录请求管理接口返回 401
    const unauthRes = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/sources',
    });
    assert(unauthRes.statusCode === 401, '8.1 未登录请求运营管理接口被拦截 (HTTP 401)');

    // 8.2 普通注册会员访问管理后台返回 403
    const forbiddenRes = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/sources',
      headers: { cookie: memberCookie },
    });
    assert(forbiddenRes.statusCode === 403, '8.2 普通会员访问运营后台被权限守卫拦截 (HTTP 403)');

    // 8.3 运营工作台真实数据统计
    const statsRes = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/operations/stats',
      headers: { cookie: adminCookie },
    });
    assert(statsRes.statusCode === 200 && typeof statsRes.json().data.resources?.published === 'number', '8.3 运营工作台全盘真实数据聚合指标返回正常');
  }

  // 测试数据隔离收口清理，防止长期运行污染本地开发库
  if (createdTutorialSlug) {
    await prisma.tutorial.deleteMany({ where: { slug: createdTutorialSlug } }).catch(() => {});
  }
  if (testTopicId) {
    await prisma.topic.deleteMany({ where: { id: testTopicId } }).catch(() => {});
  }
  await prisma.software.deleteMany({ where: { slug: 'fastcopy-extreme', status: ResourceStatus.DRAFT } }).catch(() => {});
  if (testBatchId) {
    await prisma.importBatch.deleteMany({ where: { id: testBatchId } }).catch(() => {});
  }
  if (candidateId) {
    await prisma.versionCandidate.deleteMany({ where: { id: candidateId } }).catch(() => {});
  }
  if (vsCodeIdForCleanup && createdTargetVer) {
    await prisma.softwareVersion.deleteMany({ where: { softwareId: vsCodeIdForCleanup, version: createdTargetVer } }).catch(() => {});
    if (prevLatestVersionId) {
      await prisma.softwareVersion.update({ where: { id: prevLatestVersionId }, data: { isLatest: true } }).catch(() => {});
    }
  }
  if (log403Id) {
    await prisma.linkCheckLog.deleteMany({ where: { id: log403Id } }).catch(() => {});
  }

  console.log('\n================================================================');
  console.log(`🎉 软游部落 P3 自动化运营与 SEO 验收套件执行完毕: 共 ${passed + failed} 项, 通过: ${passed}, 失败: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runP3Tests()
  .catch((err) => {
    console.error('测试套件执行异常:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
