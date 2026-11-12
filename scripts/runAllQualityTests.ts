import { execSync } from 'child_process';
import path from 'path';

interface TestSuite {
  name: string;
  file: string;
  description: string;
}

const SUITES: TestSuite[] = [
  { name: 'P1 基础能力与接口', file: 'server/tests/apiTest.ts', description: '基础分类、资源检索、统计与元数据' },
  { name: 'P2 商业化与会员', file: 'server/tests/p2CommerceTest.ts', description: '商品方案、订单状态机、下载令牌' },
  { name: 'P2.1 支付与安全加固', file: 'server/tests/p21SecurityTest.ts', description: '微信Native模拟、退款审批、幂等性' },
  { name: 'P3 自动化运营与监控', file: 'server/tests/p3OperationsTest.ts', description: '版本监控、死链检测、批量导入与去重' },
  { name: 'P3.1 生产运维与安全整改', file: 'server/tests/p31ProductionReadinessTest.ts', description: '任务调度、备份恢复、敏感信息防护' },
  { name: 'P4 增长与评测', file: 'server/tests/p4GrowthTest.ts', description: '横向对比、软件替代推荐、真实评价' },
  { name: 'P5 规模化与数据治理', file: 'server/tests/p5OperationalGrowthTest.ts', description: '多源下载核验、数据一致性、SEO元数据' },
  { name: 'P6 开发者与开放生态', file: 'server/tests/p6EcosystemTest.ts', description: '开发者入驻、软件认领、开放 API' },
  { name: 'P7 正式上线验收', file: 'server/tests/p7LaunchReadinessTest.ts', description: '公网安全防护、搜索引擎接入、冷启动' },
  { name: 'P8 生产隔离与阻断整改', file: 'server/tests/p8ProductionLaunchTest.ts', description: '生产演练隔离库、死链修复、真实闭环' },
  { name: 'P8.5 全站体检与内测准备', file: 'server/tests/p85QualityAssuranceTest.ts', description: '48路由可达性、业务闭环、无污染回归' },
  { name: 'P8.7 全站独立栏目与专题中心', file: 'server/tests/p87NavigationPagesTest.ts', description: '电脑软件/系统工具/游戏/装机必备/教程/更新/专题中心全面验证' },
  { name: 'P8.7.1 电脑软件频道 UI 3.0', file: 'server/tests/p871SoftwarePortalTest.ts', description: '聚合接口/真实榜单/测试隔离/后台推荐安全边界/SSR SEO验证' },
  { name: 'P8.7.2 电脑软件频道质量精修', file: 'server/tests/p872SoftwarePolishTest.ts', description: '来源真伪核查/模块去重/低流量排行榜/官方图标/401零刷屏' },
  { name: 'P8.7.3 系统工具频道 UI 3.0', file: 'server/tests/p873SystemToolsPortalTest.ts', description: '专题大图/故障场景导航/专业分类/低样本榜单/多维检索/SSR SEO验证' },
  { name: 'P8.7.4 游戏中心 UI 3.0', file: 'server/tests/p874GamesPortalTest.ts', description: '游戏视觉Banner/实机鉴赏/辅助工具隔离/诚实榜单/多维筛选/SSR SEO验证' },
  { name: 'P8.7.4.1 游戏专项质量修复', file: 'server/tests/p8741GamesQualityFixTest.ts', description: 'Sitemap XML防回退/CLS防布局跳动/P5真实完整率与测试隔离收口' },
  { name: 'P8.7.5 装机必备频道 UI 3.0', file: 'server/tests/p875EssentialsPortalTest.ts', description: '装机专题大图/6大场景方案/分组清单与TXT-JSON安全导出/8步系统配置/维修工具箱/ESSENTIALS后台推荐/SSR SEO' },
  { name: 'P8.7.5.1 装机必备质量专项修复', file: 'server/tests/p8751EssentialsQualityTest.ts', description: '真实非测试榜单/低样本自适应/无localhost安全导出/MemTest86草稿隔离/八步教程安全提示词' },
  { name: 'P8.7.6 对比评测频道 UI 3.0', file: 'server/tests/p876ComparePortalTest.ts', description: '交互式双软件对比/参数差异高亮/场景化选型建议/认证替代推荐/品类探索/SSR SEO/防回退' },
  { name: 'P8.7.7 社区交流频道 UI 3.0', file: 'server/tests/p877CommunityPortalTest.ts', description: '真实统计看板/70-30主从架构/采纳最佳解答闭环/安全防刷限流/合规治理/SSR QAPage' },
  { name: 'P8.7.8 软件教程频道 UI 3.0', file: 'server/tests/p878TutorialsFinalPortalTest.ts', description: '教程门户/沉浸式阅读器/TOC滚动监听/代码复制/风险提示/准备清单/关联软件/SSR SEO' },
  { name: 'P8.7.9 顶部导航精简治理', file: 'server/tests/p879NavigationSimplificationTest.ts', description: '保留7大核心栏目/移除对比与社区导航/多端一致性/底层数据与SEO防死链' },
  { name: 'P8.7.10 最新更新频道 UI 3.0', file: 'server/tests/p8710UpdatesPortalTest.ts', description: '版本更新中心/真实发版时间线/更新日志展开/新收录隔离/多维筛选/SSR SEO/七大导航收官' },
  { name: 'P8.8 软件一键直链下载系统', file: 'server/tests/p88DirectDownloadTest.ts', description: '统一直链入口/授权镜像/Range断点/SSRF拦截/文件SHA256校验' },
  { name: 'P8.9 全站生产级深度体检与专项审计', file: 'server/tests/p89ProductionAuditTest.ts', description: '七大导航收官/草稿与测试数据物理隔离/1-6级下载来源真伪/SEO Canonical与Sitemap修复/权限与合规审计' }
];

async function main() {
  console.log('========================================================================');
  console.log('🌟 软游部落（SoftBuluo）全阶段自动化质量与全量回归测试套件');
  console.log('========================================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;
  const suiteResults: { name: string; passed: number; failed: number; status: string }[] = [];

  for (const suite of SUITES) {
    console.log(`\n▶ 正在执行套件: ${suite.name} (${suite.description})`);
    try {
      const output = execSync(`npx tsx ${suite.file}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 解析输出中的 PASS 和 FAIL
      const passMatches = output.match(/PASS:\s*(\d+)/) || output.match(/通过[:\s]+(\d+)/) || output.match(/共通过\s*(\d+)/);
      const failMatches = output.match(/FAIL:\s*(\d+)/) || output.match(/失败[:\s]+(\d+)/);

      let passedCount = 0;
      let failedCount = 0;

      if (passMatches) {
        passedCount = parseInt(passMatches[1], 10);
      } else {
        // 计算 [PASS] 出现次数
        const occurrences = (output.match(/\[PASS\]/g) || []).length;
        passedCount = occurrences;
      }

      if (failMatches) {
        failedCount = parseInt(failMatches[1], 10);
      } else {
        const occurrences = (output.match(/\[FAIL\]/g) || []).length;
        failedCount = occurrences;
      }

      totalPassed += passedCount;
      totalFailed += failedCount;

      const status = failedCount === 0 ? '✅ PASS' : '❌ FAIL';
      suiteResults.push({ name: suite.name, passed: passedCount, failed: failedCount, status });
      console.log(`  结果: ${status} | 通过: ${passedCount} | 失败: ${failedCount}`);
    } catch (err: any) {
      const stderr = err.stderr || err.message || '';
      console.error(`  ❌ 套件执行报错: ${err.message}`);
      suiteResults.push({ name: suite.name, passed: 0, failed: 1, status: '❌ ERROR' });
      totalFailed += 1;
    }
  }

  console.log('\n========================================================================');
  console.log('📊 全阶段全量回归测试执行汇总报告');
  console.log('========================================================================');
  console.table(suiteResults);
  console.log(`\n总计通过: ${totalPassed} 项 | 总计失败: ${totalFailed} 项`);
  console.log('========================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
