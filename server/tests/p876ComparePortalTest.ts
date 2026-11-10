import { prisma } from '../src/db';
import { ResourceStatus, ResourceType, ComparisonStatus } from '@prisma/client';
import { CompareChannelService } from '../src/modules/channels/compareChannelService';
import { SeoService } from '../src/modules/seo/seoService';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 P8.7.6 对比评测频道 UI 3.0 门户化升级全量验收测试');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. 频道基础数据与结构完整性
    // -------------------------------------------------------------------------
    console.log('▶ [1/9] 验证对比评测频道数据聚合服务 (getCompareChannelData)...');
    const channelData = await CompareChannelService.getCompareChannelData();

    assert(!!channelData.meta, '元数据 meta 存在');
    assert(channelData.meta.totalPublishedComparisons === 2, `已发布长文评测数为 2 (实际: ${channelData.meta.totalPublishedComparisons})`);
    assert(channelData.meta.totalComparableSoftwares === 28, `可比软件数为 28 (实际: ${channelData.meta.totalComparableSoftwares})`);
    assert(channelData.meta.totalAlternatives === 5, `认证替代方案数为 5 (实际: ${channelData.meta.totalAlternatives})`);
    assert(channelData.meta.categoriesCount >= 6, `覆盖品类数 >= 6 (实际: ${channelData.meta.categoriesCount})`);

    // -------------------------------------------------------------------------
    // 2. 数据治理与测试隔离
    // -------------------------------------------------------------------------
    console.log('\n▶ [2/9] 验证数据治理：可比软件池严格隔离 GAME 与测试数据...');
    const selectable = channelData.selectableSoftwares;
    assert(selectable.length === 28, `可比软件池共有 28 款软件 (实际: ${selectable.length})`);

    const hasGame = selectable.some((s) => s.slug === 'mindustry' || s.slug === 'supertuxkart');
    assert(!hasGame, '可比软件池完全隔离游戏中心 GAME 资源 (无 mindustry / supertuxkart)');

    const hasTest = selectable.some((s) => s.name.includes('测试') || s.slug.startsWith('test-'));
    assert(!hasTest, '可比软件池无任何测试残留或包含测试字样的软件');

    // 验证所有软件都在数据库中为 PUBLISHED
    const dbSoftwareIds = selectable.map((s) => s.id);
    const dbSoftwares = await prisma.software.findMany({
      where: { id: { in: dbSoftwareIds } },
      select: { id: true, status: true, isTestData: true, type: true },
    });
    const allPublished = dbSoftwares.every((s) => s.status === ResourceStatus.PUBLISHED && !s.isTestData);
    assert(allPublished, '可比软件池中所有 28 款软件在数据库中均为 PUBLISHED 且 isTestData=false');

    // -------------------------------------------------------------------------
    // 3. 热门推荐对比对 (Quick Pairs)
    // -------------------------------------------------------------------------
    console.log('\n▶ [3/9] 验证热门对比推荐对 (Quick Pairs)...');
    const quickPairs = channelData.quickPairs;
    assert(quickPairs.length === 6, `推荐对比对数为 6 (实际: ${quickPairs.length})`);

    const pairSlugs = quickPairs.map((p) => `${p.leftSlug}-vs-${p.rightSlug}`);
    assert(pairSlugs.includes('7zip-vs-peazip'), '包含 7-Zip vs PeaZip');
    assert(pairSlugs.includes('vscode-vs-sublime-text'), '包含 VS Code vs Sublime Text');
    assert(pairSlugs.includes('cpu-z-vs-hwinfo'), '包含 CPU-Z vs HWiNFO64');
    assert(pairSlugs.includes('libreoffice-vs-office-2024'), '包含 LibreOffice vs Office 2024');
    assert(pairSlugs.includes('rufus-vs-diskgenius'), '包含 Rufus vs DiskGenius');
    assert(pairSlugs.includes('vlc-vs-obs-studio'), '包含 VLC vs OBS Studio');

    // -------------------------------------------------------------------------
    // 4. 精选横向评测长文 (Featured Articles)
    // -------------------------------------------------------------------------
    console.log('\n▶ [4/9] 验证已发布深度长文评测...');
    const articles = channelData.featuredArticles;
    assert(articles.length === 2, `已发布长文数为 2 (实际: ${articles.length})`);

    const p7zip = articles.find((a) => a.slug === '7zip-vs-peazip');
    assert(!!p7zip, '存在 7zip-vs-peazip 长文');
    assert(p7zip?.items.length === 2, '7zip-vs-peazip 包含 2 个对比产品项');
    assert(!!p7zip?.conclusion, '7zip-vs-peazip 包含选型结论');

    const pVscode = articles.find((a) => a.slug === 'vscode-vs-sublime');
    assert(!!pVscode, '存在 vscode-vs-sublime 长文');
    assert(pVscode?.items.length === 2, 'vscode-vs-sublime 包含 2 个对比产品项');
    assert(pVscode?.items[0].slug === 'vscode', 'vscode-vs-sublime 正确关联正式版 vscode');

    // -------------------------------------------------------------------------
    // 5. 动态对比矩阵计算引擎 (Comparison Matrix Engine)
    // -------------------------------------------------------------------------
    console.log('\n▶ [5/9] 验证对比矩阵生成引擎 (7-Zip vs PeaZip)...');
    const matrix7z = await CompareChannelService.getComparisonMatrix('7zip', 'peazip');
    assert(matrix7z.softwareA.slug === '7zip', '左侧软件为 7-Zip');
    assert(matrix7z.softwareB.slug === 'peazip', '右侧软件为 PeaZip');
    assert(!matrix7z.isSameCategory, '7-Zip (系统工具) 与 PeaZip (办公软件) 跨分类标记正确');
    assert(matrix7z.curatedArticle?.slug === '7zip-vs-peazip', '正确关联已发布精选长文 7zip-vs-peazip');
    assert(matrix7z.rows.length >= 25, `对比矩阵包含 >= 25 行参数 (实际: ${matrix7z.rows.length})`);
    assert(matrix7z.differenceCount > 0, `识别出差异行数 (实际: ${matrix7z.differenceCount} 项)`);
    assert(matrix7z.rows.some((r) => r.category === 'LICENSE'), '包含「开源与商业许可」维度');
    assert(matrix7z.rows.some((r) => r.category === 'EDITORIAL'), '包含「编辑部实测指标」维度');
    assert(matrix7z.scenarioAdvice.chooseSoftwareAIf.length > 0, '包含 7-Zip 适用场景建议');
    assert(matrix7z.scenarioAdvice.chooseSoftwareBIf.length > 0, '包含 PeaZip 适用场景建议');

    // -------------------------------------------------------------------------
    // 6. 异常边界防护与跨品类对比
    // -------------------------------------------------------------------------
    console.log('\n▶ [6/9] 验证对比矩阵异常防护、位置互换与跨品类...');

    // 自我对比防护
    let selfCompareThrew = false;
    try {
      await CompareChannelService.getComparisonMatrix('7zip', '7zip');
    } catch (e: any) {
      selfCompareThrew = true;
      assert(e.message.includes('无需进行横向对比') || e.message.includes('两款不同的软件'), '自我对比正确抛出异常拦截');
    }
    assert(selfCompareThrew, '自我对比被严格拦截');

    // 游戏资源比对拦截
    let gameCompareThrew = false;
    try {
      await CompareChannelService.getComparisonMatrix('7zip', 'mindustry');
    } catch (e: any) {
      gameCompareThrew = true;
      assert(e.message.includes('游戏'), '比对 GAME 游戏被正确拦截 (不支持将游戏资源混入参数对比)');
    }
    assert(gameCompareThrew, '比对游戏资源被正确拦截');

    // 位置互换验证 (PeaZip vs 7-Zip)
    const matrixSwap = await CompareChannelService.getComparisonMatrix('peazip', '7zip');
    assert(matrixSwap.softwareA.slug === 'peazip' && matrixSwap.softwareB.slug === '7zip', '左右软件位置互换正确生效');
    assert(matrixSwap.rows.length === matrix7z.rows.length, '互换后参数行总数一致');

    // 同品类对比 (VLC vs OBS Studio 均为影音播放分类)
    const matrixVlcObs = await CompareChannelService.getComparisonMatrix('vlc', 'obs-studio');
    assert(matrixVlcObs.isSameCategory, '同品类对比识别正确 (VLC 与 OBS Studio 同属影音分类)');
    assert(matrixVlcObs.rows.length >= 20, `同品类对比正常生成标准化矩阵 (行数: ${matrixVlcObs.rows.length})`);
    assert(matrixVlcObs.rows.every((r) => r.valueA.length > 0 && r.valueB.length > 0), '对比矩阵无空指针异常且每项均有值');

    // 跨品类对比 (LibreOffice 办公软件 vs Rufus 系统工具)
    const matrixCross = await CompareChannelService.getComparisonMatrix('libreoffice', 'rufus');
    assert(!matrixCross.isSameCategory, '跨品类对比识别正确 (LibreOffice 办公 vs Rufus 系统工具)');
    assert(!!matrixCross.crossCategoryNotice, '跨品类对比包含友好提示信息');

    // -------------------------------------------------------------------------
    // 7. 认证替代方案库与场景指南
    // -------------------------------------------------------------------------
    console.log('\n▶ [7/9] 验证认证替代方案库与场景化决策指南...');
    const alternatives = channelData.alternatives;
    assert(alternatives.length === 5, `认证替代方案共 5 组 (实际: ${alternatives.length})`);
    for (const alt of alternatives) {
      assert(!!alt.fromSlug && !!alt.toSlug, `替代方案包含源和目标: ${alt.fromName} -> ${alt.toName}`);
      assert(alt.reason.length > 5, `替代理由清晰客观 (${alt.reason.slice(0, 20)}...)`);
    }

    const guides = channelData.decisionGuides;
    assert(guides.length === 4, `场景化决策指南共 4 篇 (实际: ${guides.length})`);
    for (const g of guides) {
      assert(!!g.scenario && !!g.guidance, `指南包含场景与建议: ${g.scenario}`);
      assert(!!g.recommendedPair.leftSlug && !!g.recommendedPair.rightSlug, `指南推荐两款可比软件`);
    }

    // -------------------------------------------------------------------------
    // 8. 服务端渲染 HTML 与 SEO 元数据
    // -------------------------------------------------------------------------
    console.log('\n▶ [8/9] 验证服务端渲染 HTML (SeoService.renderCompareChannelHtml)...');
    const { html, status } = await SeoService.renderCompareChannelHtml();
    assert(status === 200, 'SSR 响应状态为 200 OK');
    assert(html.includes('<h1 style="margin:0;font-size:1.75rem;">软件对比评测与专业选型中心</h1>'), '包含正式 H1 标题');
    assert(html.includes('rel="canonical"'), '包含 canonical 规范标签');
    assert(html.includes('application/ld+json'), '包含 JSON-LD 结构化数据');
    assert(html.includes('CollectionPage'), 'JSON-LD 类型为 CollectionPage');
    assert(html.includes('7-Zip vs PeaZip'), 'HTML 包含 7-Zip vs PeaZip 横评');
    assert(html.includes('Visual Studio Code vs Sublime Text'), 'HTML 包含 VS Code vs Sublime Text 横评');
    assert(html.includes('28 款'), 'HTML 包含 28 款可比资源真实统计');

    // -------------------------------------------------------------------------
    // 9. 全站既有独立栏目无回退验证
    // -------------------------------------------------------------------------
    console.log('\n▶ [9/9] 全站既有独立栏目回归验证...');
    const homeRes = await SeoService.renderHomeHtml();
    assert(homeRes.status === 200, '首页公开 HTML 正常 (200 OK)');

    const softwareRes = await SeoService.renderSoftwareChannelHtml();
    assert(softwareRes.status === 200, '电脑软件频道 HTML 正常 (200 OK)');

    const toolsRes = await SeoService.renderSystemToolsChannelHtml();
    assert(toolsRes.status === 200, '系统工具频道 HTML 正常 (200 OK)');

    const gamesRes = await SeoService.renderGamesChannelHtml();
    assert(gamesRes.status === 200, '游戏中心频道 HTML 正常 (200 OK)');

    const essentialsRes = await SeoService.renderEssentialsChannelHtml();
    assert(essentialsRes.status === 200, '装机必备频道 HTML 正常 (200 OK)');

  } catch (err: any) {
    console.error('测试执行异常:', err);
    failCount++;
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.6 对比评测频道自动化测试完成: 通过 ${passCount} 项 | 失败 ${failCount} 项`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
