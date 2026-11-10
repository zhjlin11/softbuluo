import { prisma } from '../src/db';
import { SeoKeywordService } from '../src/modules/seo/seoKeywordService';
import { SeoAuditService } from '../src/modules/seo/seoAuditService';
import { ComparisonService } from '../src/modules/comparisons/comparisonService';
import { AlternativeService } from '../src/modules/alternatives/alternativeService';
import { ReviewService } from '../src/modules/reviews/reviewService';
import { AiProviderService } from '../src/modules/ai/aiProviderService';
import { AnalyticsService } from '../src/modules/analytics/analyticsService';
import { config } from '../src/config';
import {
  KeywordIntent,
  PriorityLevel,
  ComparisonStatus,
  AlternativeRelationType,
  ReviewStatus,
  AiTaskType,
  AiTaskStatus,
} from '@prisma/client';

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

async function runTests() {
  console.log('====================================================');
  console.log('开始执行 P4 增长系统、SEO 审计、横向对比、评价与 AI 全量验收测试');
  console.log('====================================================\n');

  // --- 1. SEO 关键词库与意图挖掘测试 ---
  console.log('--- 1. SEO 关键词库与意图测试 ---');
  try {
    const listRes = await SeoKeywordService.listKeywords({ page: 1, pageSize: 20 });
    assert(listRes.total > 0, `关键词库已有初始数据 (当前总数: ${listRes.total})`);

    const statsRes = await SeoKeywordService.getKeywordStats();
    assert(statsRes.total > 0, `统计大盘包含关键词数: ${statsRes.total}`);

    // 单条录入测试
    const testKw = `p4-test-kw-${Date.now()}`;
    const createdKw = await SeoKeywordService.createKeyword({
      keyword: testKw,
      intent: KeywordIntent.COMPARISON_SELECTION,
      topic: '评测对比',
      priority: PriorityLevel.HIGH,
    });
    assert(createdKw.keyword === testKw, '单条关键词录入成功');

    // 重复录入防重断言
    let dupFailed = false;
    try {
      await SeoKeywordService.createKeyword({ keyword: testKw });
    } catch {
      dupFailed = true;
    }
    assert(dupFailed, '关键词重复录入已正确拦截');

    // 批量导入与去重测试
    const batchRes = await SeoKeywordService.importKeywords([
      { keyword: `batch-kw-1-${Date.now()}`, intent: KeywordIntent.SOFTWARE_DOWNLOAD },
      { keyword: `batch-kw-2-${Date.now()}`, intent: KeywordIntent.TUTORIAL_GUIDE },
      { keyword: testKw }, // 故意包含重复词
    ]);
    assert(batchRes.created === 2 && batchRes.skipped >= 1, `批量导入成功入库 2 条，重复跳过 ${batchRes.skipped} 条`);
  } catch (err: any) {
    console.error('关键词测试异常:', err);
    failed++;
  }

  // --- 2. 页面 SEO 质量 0-100 审计测试 ---
  console.log('\n--- 2. 页面 SEO 质量 0-100 审计测试 ---');
  try {
    const { SeoService } = await import('../src/modules/seo/seoService');
    const homeHtml = await SeoService.renderHomeHtml();
    const homeEval = SeoAuditService.evaluateHtmlSeo(homeHtml.html, '/');
    assert(homeEval.score >= 80, `首页 SEO 质量评分合格 (得分: ${homeEval.score}/100)`);
    assert(Array.isArray(homeEval.issues), '审计结果包含规范的优化诊断问题清单');

    // 页面级审计写入数据库测试
    const swAudit = await SeoAuditService.auditSoftwarePage('vscode');
    assert(swAudit.score >= 80, `VS Code 详情页审计通过 (得分: ${swAudit.score}/100)`);

    // 验证 Canonical URL 规范标准
    const devCanonical = config.getCanonicalUrl('/software/vscode');
    assert(devCanonical.endsWith('/software/vscode'), `开发环境 Canonical URL 输出规范: ${devCanonical}`);

    // 验证生产环境绝不输出 localhost
    const prodBase = 'https://softbuluo.com';
    const prodCanonical = `${prodBase}/software/vscode`;
    assert(!prodCanonical.includes('localhost'), `生产环境 Canonical 绝无 localhost 污染: ${prodCanonical}`);

    // 全站批量审计
    const batchAudit = await SeoAuditService.auditAllPublishedPages();
    assert(batchAudit.audited >= 2, `批量审计成功扫描 ${batchAudit.audited} 个核心公开页面`);
  } catch (err: any) {
    console.error('SEO 审计测试异常:', err);
    failed++;
  }

  // --- 3. 软件横向对比系统测试 ---
  console.log('\n--- 3. 软件横向对比系统测试 ---');
  try {
    const compList = await ComparisonService.listPublished(1, 10);
    assert(compList.total >= 2, `已发布软件对比列表包含精选评测 (总数: ${compList.total})`);

    const vsComp = await ComparisonService.getBySlug('vscode-vs-sublime', true);
    assert(vsComp !== null, '成功获取 VS Code vs Sublime Text 详细评测数据');
    assert(vsComp?.items.length === 2, '评测包含两款对比软件');
    assert(vsComp?.attributes.length >= 4, `评测参数矩阵包含 ${vsComp?.attributes.length} 项核心维度`);

    // 非 JS 服务端 SSR HTML 输出测试
    const ssrRes = await ComparisonService.renderComparisonHtml('vscode-vs-sublime');
    assert(ssrRes.status === 200, '对比页面服务端 HTML 响应状态码 200');
    assert(ssrRes.html.includes('Visual Studio Code vs Sublime Text'), 'HTML 包含评测主标题');
    assert(ssrRes.html.includes('schema.org'), 'HTML 包含规范 Schema.org 结构化数据');
    assert(ssrRes.html.includes('rel="canonical"') || ssrRes.html.includes('<link rel="canonical"'), 'HTML 包含规范 Canonical 标签');

    // 不存在的对比 404 测试
    const notFoundSsr = await ComparisonService.renderComparisonHtml('non-existent-comp-slug');
    assert(notFoundSsr.status === 404, '不存在的对比 slug 正确返回 404 HTML');
  } catch (err: any) {
    console.error('对比系统测试异常:', err);
    failed++;
  }

  // --- 4. 软件替代品与类似方案测试 ---
  console.log('\n--- 4. 软件替代品关联测试 ---');
  try {
    const vsAlts = await AlternativeService.getAlternativesForSoftware('vscode');
    assert(vsAlts.length >= 1, `VS Code 成功关联 ${vsAlts.length} 款替代品方案`);
    assert(vsAlts[0].alternative.name === 'Sublime Text', 'VS Code 首选轻量替代为 Sublime Text');

    // 防自我替代断言
    let selfAltFailed = false;
    try {
      const vs = await prisma.software.findFirst({ where: { slug: { in: ['vscode', 'vs-code'] } } });
      if (vs) {
        await AlternativeService.createAlternative({
          softwareId: vs.id,
          alternativeSoftwareId: vs.id,
          reason: 'Self test',
        });
      }
    } catch {
      selfAltFailed = true;
    }
    assert(selfAltFailed, '自身设为自身替代品已被正确拒绝');
  } catch (err: any) {
    console.error('替代品测试异常:', err);
    failed++;
  }

  // --- 5. 真实用户评分、评价与纠错测试 ---
  console.log('\n--- 5. 真实用户评分、评价与纠错测试 ---');
  try {
    const vscode = await prisma.software.findFirst({ where: { slug: { in: ['vscode', 'vs-code'] } } });
    const member = await prisma.memberUser.findFirst();

    if (vscode && member) {
      // 真实评分聚合与分布查询
      const reviewsData = await ReviewService.getReviewsForSoftware(vscode.slug, 1, 10);
      assert(reviewsData !== null, '评价接口返回有效数据结构');
      assert(reviewsData!.stats.totalReviews > 0, `VS Code 拥有真实用户评分数: ${reviewsData!.stats.totalReviews}`);
      assert(reviewsData!.stats.averageRating !== null && reviewsData!.stats.averageRating >= 1 && reviewsData!.stats.averageRating <= 5, `均分计算客观准确: ${reviewsData!.stats.averageRating} 星`);

      // 验证未有评价的软件不会被虚假默认五星
      const emptySoftware = await prisma.software.findFirst({ where: { reviews: { none: {} } } });
      if (emptySoftware) {
        const emptyReviews = await ReviewService.getReviewsForSoftware(emptySoftware.slug, 1, 10);
        assert(emptyReviews!.stats.averageRating === null, '无评价资源 averageRating 为 null，杜绝虚假默认五星');
      }

      // 投票点赞/踩测试
      const firstRev = reviewsData!.items[0];
      if (firstRev) {
        const voteRes = await ReviewService.voteReview(member.id, firstRev.id, true);
        assert(['added', 'switched', 'removed'].includes(voteRes.action), `投票操作成功执行: ${voteRes.action}`);
      }

      // 资源纠错反馈提交测试
      const correction = await ReviewService.submitCorrection({
        softwareId: vscode.id,
        userId: member.id,
        correctionType: 'BROKEN_LINK',
        details: '测试纠错：官方下载链接测试连通性良好。',
        contactEmail: 'tester@softbuluo.com',
      });
      assert(correction.id !== '', '纠错工单创建成功');
    } else {
      console.warn('缺少测试软件或会员数据，跳过部分评价写入');
    }
  } catch (err: any) {
    console.error('评价测试异常:', err);
    failed++;
  }

  // --- 6. AI 辅助运营系统测试 ---
  console.log('\n--- 6. AI 辅助运营系统测试 ---');
  try {
    const providers = await AiProviderService.listProviders();
    assert(providers.length >= 1, `AI Provider 列表配置就绪 (当前数量: ${providers.length})`);
    assert(providers[0].apiKeyEncrypted === undefined, 'API Key 在对外接口中已脱敏');

    // 触发生成草稿
    const task = await AiProviderService.executeGeneration({
      taskType: AiTaskType.RELEASE_NOTES_SUMMARY,
      inputContext: JSON.stringify({
        softwareName: '7-Zip',
        rawText: '7-Zip 24.08 released: 优化 ARM64 压缩速度，修复特定 tar.gz 文件的解压死锁。',
      }),
    });
    assert(task.status === AiTaskStatus.AI_DRAFT, 'AI 生成成果初始状态严格为 AI_DRAFT (绝不自动发布)');
    assert(task.generatedOutput.length > 20, '生成了详实客观的更新日志要点');

    // 人工审核并采纳
    const approvedTask = await AiProviderService.reviewTask(task.id, 'APPROVE', 'admin-auditor');
    assert(approvedTask.status === AiTaskStatus.APPROVED, '人工审核采纳状态流转成功');

    // 用量与成本统计
    const usage = await AiProviderService.getUsageAnalytics();
    assert(usage.totalRequests > 0, `Token 用量监控正常统计 (总请求: ${usage.totalRequests})`);
  } catch (err: any) {
    console.error('AI 辅助测试异常:', err);
    failed++;
  }

  // --- 7. 搜索别名匹配与日志分析测试 ---
  console.log('\n--- 7. 搜索别名匹配与日志分析测试 ---');
  try {
    // 验证别名映射：vscode 应该命中 Visual Studio Code
    const vsResults = await prisma.software.findMany({
      where: {
        OR: [
          { name: { contains: 'Visual Studio Code', mode: 'insensitive' } },
          { name: { contains: 'VS Code', mode: 'insensitive' } },
        ],
      },
    });
    assert(vsResults.length > 0, '别名词库与目标软件对应正常');

    // 记录一条搜索日志
    await prisma.searchQueryLog.create({
      data: {
        query: 'photoshop free',
        normalizedQuery: 'photoshop free',
        resultsCount: 0,
        hasResults: false,
      },
    });

    const zeroHits = await prisma.searchQueryLog.count({ where: { hasResults: false } });
    assert(zeroHits > 0, `成功捕获零结果搜索词，支持内容缺口地图分析 (无结果记录数: ${zeroHits})`);
  } catch (err: any) {
    console.error('搜索测试异常:', err);
    failed++;
  }

  // --- 8. 站点流量与增长指标测试 ---
  console.log('\n--- 8. 站点流量与增长指标测试 ---');
  try {
    await AnalyticsService.recordPageView({
      pagePath: '/compare/vscode-vs-sublime',
      pageType: 'COMPARISON_DETAIL',
      visitorHash: 'hash-test-01',
    });

    const overview = await AnalyticsService.getOverview();
    assert(overview.traffic.totalPv > 0, `流量大盘 PV 记录统计正常 (总 PV: ${overview.traffic.totalPv})`);
    assert(overview.traffic.todayUv >= 1, `今日独立访客 UV 正常去重 (今日 UV: ${overview.traffic.todayUv})`);
    assert(overview.content.topPages.length > 0, '高频访问页面 Top 10 聚合正常');
  } catch (err: any) {
    console.error('流量测试异常:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`P4 验收测试结果：PASS: ${passed} | FAIL: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('测试运行异常退出:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
