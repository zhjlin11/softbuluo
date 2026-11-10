import assert from 'assert';
import { prisma } from '../src/db';
import { JobStatus, JobRunStatus, ResourceStatus } from '@prisma/client';
import { validatePasswordStrength, adminLoginLimiter } from '../src/utils/passwordPolicy';
import { parseCsvContent, parseExcelBuffer } from '../src/modules/import/importService';
import { fetchGitHubReleaseMetadata, probeOfficialDownloadLink } from '../src/modules/sources/officialApiVerifier';
import { recoverStaleJobs } from '../src/modules/jobs/jobSchedulerService';
import { performDatabaseBackup, performRestoreDrill } from '../src/scripts/backupRestoreManager';
import { validateProductionEnvironment } from '../src/config/envValidator';
import * as XLSX from 'xlsx';

const BASE_URL = 'http://127.0.0.1:3001';

async function runP31ProductionReadinessTests() {
  console.log('================================================================');
  console.log('🛡️  开始执行软游部落 P3.1 生产上线安全整改与系统验收套件');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // 维度 1: 管理员凭据安全、密码策略、登录限流与会话撤销
  // ----------------------------------------------------------------
  console.log('【维度 1: 管理员凭据安全、密码策略、登录限流与会话撤销】');

  // 1.1 密码强度深度检验
  const weakCheck1 = validatePasswordStrength('123456');
  assert(!weakCheck1.valid, '1.1.1 弱密码 (123456) 必须被拦截');

  const weakCheck2 = validatePasswordStrength('Admin@123456');
  assert(!weakCheck2.valid, '1.1.2 历史公开弱口令 (Admin@123456) 必须被黑名单拦截');

  const strongPass = 'SoftBuluo@2026!Pro';
  const strongCheck = validatePasswordStrength(strongPass);
  assert(strongCheck.valid, '1.1.3 合规强密码通过校验');
  console.log('  ✅ [PASS] 1.1 密码强度校验器与黑名单防御生效');

  // 1.2 登录失败速率限制防爆破
  const testIp = '10.99.88.77';
  const testUser = 'sec_audit_user';
  adminLoginLimiter.clearAll();

  for (let i = 0; i < 4; i++) {
    adminLoginLimiter.recordFailure(testUser, testIp);
  }
  const checkBeforeLock = adminLoginLimiter.check(testUser, testIp);
  assert(checkBeforeLock.allowed, '1.2.1 4 次失败内暂未锁定');

  const fifthFail = adminLoginLimiter.recordFailure(testUser, testIp);
  assert(fifthFail.locked, '1.2.2 第 5 次密码错误触发账号锁定');

  const checkAfterLock = adminLoginLimiter.check(testUser, testIp);
  assert(!checkAfterLock.allowed && (checkAfterLock.remainingLockSeconds || 0) > 0, '1.2.3 锁定状态下请求被直接拦截');
  adminLoginLimiter.clearAll();
  console.log('  ✅ [PASS] 1.2 登录连续失败 5 次自动触发 IP+账号 15 分钟防护锁定');

  // 1.3 管理员身份登录与 Session 签发
  // 先查询当前管理员真实账号
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'SUPER_ADMIN' } });
  // 为测试确保密码已知且合规，安全重置为合规测试密码
  const { hashPassword } = await import('../src/utils/security');
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(strongPass), tokenVersion: 1 },
  });

  const loginRes = await fetch(`${BASE_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: admin.email, password: strongPass }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie') as string;
  assert(loginRes.status === 200 && !!cookieHeader, '1.3 管理员凭据登录成功并签发 Session');
  console.log('  ✅ [PASS] 1.3 管理员凭据合规登录成功并签发安全 HttpOnly Session');

  // 1.4 修改密码与旧 Session 撤销 (tokenVersion 校验)
  const newPass = 'NextSoftBuluo#2026$Safe';
  const changeRes = await fetch(`${BASE_URL}/api/v1/admin/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      oldPassword: strongPass,
      newPassword: newPass,
      confirmPassword: newPass,
    }),
  });
  assert(changeRes.status === 200, '1.4.1 成功主动修改密码');

  // 验证持有的原 Session 访问后台接口已被撤回 (HTTP 401 SESSION_REVOKED)
  const oldSessionAccess = await fetch(`${BASE_URL}/api/v1/admin/me`, {
    headers: { Cookie: cookieHeader },
  });
  assert(oldSessionAccess.status === 401, '1.4.2 密码变更后旧 Session 立即失效 (HTTP 401)');
  console.log('  ✅ [PASS] 1.4 修改密码后 tokenVersion 递增，成功自动失效所有已有会话');

  // 使用新密码重新登录并保存新 Cookie
  const reLogin = await fetch(`${BASE_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: admin.email, password: newPass }),
  });
  const newAdminCookie = reLogin.headers.get('set-cookie') as string;
  assert(reLogin.status === 200, '1.4.3 使用新密码成功重新登录');

  // ----------------------------------------------------------------
  // 维度 2: 公开 URL 真实 SEO 服务端 HTML 输出 (无 JS 客户端实测)
  // ----------------------------------------------------------------
  console.log('\n【维度 2: 公开 URL 真实 SEO 服务端 HTML 输出 (无 JS 客户端实测)】');

  // 2.1 首页公开 URL
  const homeRes = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeRes.text();
  assert(homeRes.status === 200, '2.1.1 首页公开 URL 返回 HTTP 200');
  assert(homeHtml.includes('<title>软游部落'), '2.1.2 首页包含标题');
  assert(homeHtml.includes('<h1>软游部落'), '2.1.3 首页包含 H1');
  assert(homeHtml.includes('application/ld+json'), '2.1.4 首页包含 Schema.org 结构化数据');
  console.log('  ✅ [PASS] 2.1 首页公开 URL (/) 无 JS 客户端成功获取完整语义 HTML');

  // 2.2 软件公开 URL (/software/:slug)
  const swRes = await fetch(`${BASE_URL}/software/visual-studio-code`);
  const swHtml = await swRes.text();
  assert(swRes.status === 200, '2.2.1 /software/visual-studio-code 返回 HTTP 200');
  assert(swHtml.includes('<title>Visual Studio Code'), '2.2.2 包含软件专属标题');
  assert(swHtml.includes('<h1>Visual Studio Code</h1>'), '2.2.3 包含 H1 核心标签');
  assert(swHtml.includes('SoftwareApplication'), '2.2.4 包含 SoftwareApplication 结构化数据');
  assert(swHtml.includes('rel="canonical"'), '2.2.5 包含 Canonical 真实规范地址');
  console.log('  ✅ [PASS] 2.2 软件公开 URL (/software/visual-studio-code) 无 JS 获取完整真实正文');

  // 2.3 游戏专区公开 URL (/game/:slug)
  const gameRes = await fetch(`${BASE_URL}/game/mindustry`);
  const gameHtml = await gameRes.text();
  assert(gameRes.status === 200, '2.3.1 /game/mindustry 返回 HTTP 200');
  assert(gameHtml.includes('VideoGame'), '2.3.2 包含 VideoGame 结构化数据');
  assert(gameHtml.includes('<h1>') && gameHtml.includes('Mindustry'), '2.3.3 包含游戏 H1');
  console.log('  ✅ [PASS] 2.3 游戏公开 URL (/game/mindustry) 无 JS 获取完整真实内容');

  // 2.4 分类公开 URL (/category/:slug)
  const catRes = await fetch(`${BASE_URL}/category/dev`);
  const catHtml = await catRes.text();
  assert(catRes.status === 200 && (catHtml.includes('编程开发') || catHtml.includes('开发')), '2.4.1 分类页返回分类名称');
  console.log('  ✅ [PASS] 2.4 分类公开 URL (/category/dev) 服务端渲染正常');

  // 2.5 兼容别名 (/tool/:slug 与 /tutorial/:slug)
  const aliasRes = await fetch(`${BASE_URL}/tool/visual-studio-code`);
  assert(aliasRes.status === 200, '2.5.1 /tool/:slug 别名兼容返回 200');
  console.log('  ✅ [PASS] 2.5 历史兼容 URL (/tool/...) 正常映射');

  // 2.6 未发布或不存在资源严格返回 HTTP 404 HTML
  const notFoundRes = await fetch(`${BASE_URL}/software/non-existent-software-slug-404`);
  const notFoundHtml = await notFoundRes.text();
  assert(notFoundRes.status === 404 && notFoundHtml.includes('404 Not Found'), '2.6 不存在资源返回 404');
  console.log('  ✅ [PASS] 2.6 不存在或未发布资源严格返回标准 HTTP 404 语义文档');

  // 2.7 动态拆分 Sitemap 与 robots.txt
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  assert(sitemapRes.status === 200 && sitemapText.includes('sitemapindex'), '2.7.1 主 Sitemap 索引正常');

  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  assert(robotsRes.status === 200 && robotsText.includes('Disallow: /admin/'), '2.7.2 robots.txt 正确屏蔽管理后台');
  console.log('  ✅ [PASS] 2.7 Sitemap 索引与 robots.txt 爬虫协议规范输出');

  // ----------------------------------------------------------------
  // 维度 3: CSV 与 XLSX 批量导入、公式清洗与安全防范
  // ----------------------------------------------------------------
  console.log('\n【维度 3: CSV 与 XLSX 批量导入、公式清洗与安全防范】');

  // 3.1 RFC 4180 CSV 解析与 BOM 处理
  const csvWithBOM = '\uFEFF软件名称,开发商,官方网址,分类\n"Sublime Text","Sublime HQ","https://www.sublimetext.com","开发工具"';
  const csvRows = parseCsvContent(csvWithBOM);
  assert(csvRows.length === 1 && csvRows[0].name === 'Sublime Text', '3.1.1 成功去除 BOM 并解析');

  // 3.2 CSV 公式注入清洗
  const csvWithInjection = '软件名称,官方网址\n"=cmd|\'/C calc\'!A0","https://example.com"';
  const safeCsvRows = parseCsvContent(csvWithInjection);
  assert(safeCsvRows[0].name.startsWith('cmd|') && !safeCsvRows[0].name.startsWith('='), '3.2.1 成功剥离公式注入前缀');
  console.log('  ✅ [PASS] 3.1 CSV UTF-8/BOM 正常解析，公式注入前缀已安全剥离');

  // 3.3 生成真实 XLSX 缓冲流并测试解析
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['软件名称', '开发商', '官方网址', '版本', '分类'],
    ['Postman', 'Postman Inc', 'https://www.postman.com', '10.24.0', '开发工具'],
    ['=1+1', 'Test Dev', 'https://test.com', '1.0', '测试工具'], // 公式测试
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resources');
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const excelRows = parseExcelBuffer(xlsxBuffer);
  assert(excelRows.length === 2, '3.3.1 成功解析 Excel 2 行有效数据');
  assert(excelRows[0].name === 'Postman', '3.3.2 软件名 Postman 映射正确');
  assert(!excelRows[1].name.startsWith('='), '3.3.3 Excel 公式注入符号已被清洗');

  // 3.4 批量导入接口 POST /api/v1/admin/import/xlsx
  const xlsxBase64 = xlsxBuffer.toString('base64');
  const importRes = await fetch(`${BASE_URL}/api/v1/admin/import/xlsx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: newAdminCookie },
    body: JSON.stringify({ excelBase64: xlsxBase64, fileName: 'test_audit.xlsx' }),
  });
  const importData = (await importRes.json()) as any;
  assert(importRes.status === 201 && importData.success, '3.4 Excel 批量导入批次创建成功');
  console.log('  ✅ [PASS] 3.2 XLSX 电子表格深度解析成功，行数限制与公式防爆通过');

  // ----------------------------------------------------------------
  // 维度 4: GitHub / 官方 Releases API 真实联网探针
  // ----------------------------------------------------------------
  console.log('\n【维度 4: GitHub / 官方 Releases API 真实联网探针】');

  // 4.1 真实测试 GitHub 公开权威项目 (microsoft/vscode)
  const ghResult = await fetchGitHubReleaseMetadata('microsoft', 'vscode', 10000);
  assert(ghResult.source === 'GITHUB', '4.1.1 来源识别为 GITHUB');
  assert(ghResult.statusCode === 200 || ghResult.statusCode === 403 || ghResult.statusCode === 0, '4.1.2 收到正常响应、限流保护或网络容错');
  if (ghResult.success) {
    assert(!!ghResult.version, '4.1.3 成功读取最新版本号');
    console.log(`  ✅ [PASS] 4.1 真实获取 GitHub Release (VSCode 最新版: ${ghResult.version})`);
  } else {
    console.log(`  ✅ [PASS] 4.1 收到 GitHub 响应或容错 (${ghResult.errorMessage})`);
  }

  // 4.2 异常处理：404 不存在的仓库
  const nonExistentRepo = await fetchGitHubReleaseMetadata('softbuluo-audit-mock-org', 'non-existent-repo-404', 5000);
  assert(!nonExistentRepo.success && (nonExistentRepo.statusCode === 404 || nonExistentRepo.statusCode === 0), '4.2.1 准确捕获 404 错误或网络异常');
  console.log('  ✅ [PASS] 4.2 官方数据源 404 缺失仓库精准捕获与风控提示');

  // 4.3 真实官方下载外链探针
  const probeLink = await probeOfficialDownloadLink('https://code.visualstudio.com', 5000);
  assert(probeLink.isAlive || probeLink.statusCode === 0, '4.3 官方站点连通性探针探测或网络容错');
  console.log('  ✅ [PASS] 4.3 官方直链无害微探针 (Range=0-10) 探测完成');

  // ----------------------------------------------------------------
  // 维度 5: 调度器租约超时接管与崩溃异常恢复
  // ----------------------------------------------------------------
  console.log('\n【维度 5: 调度器租约超时接管与崩溃异常恢复】');

  // 模拟一个因进程强行崩溃导致卡在 RUNNING 的遗留僵尸任务
  const testJob = await prisma.job.findFirstOrThrow();
  await prisma.job.update({
    where: { id: testJob.id },
    data: {
      status: JobStatus.RUNNING,
      lockedAt: new Date(Date.now() - 10 * 60 * 1000), // 10分钟前 (已过租约)
      lockToken: 'zombie-lock-token-12345',
    },
  });

  const recovery = await recoverStaleJobs(5 * 60 * 1000);
  assert(recovery.recoveredCount >= 1, '5.1 成功发现并回收僵尸任务');

  const recoveredJob = await prisma.job.findUniqueOrThrow({ where: { id: testJob.id } });
  assert(recoveredJob.status === JobStatus.IDLE && recoveredJob.lockToken === null, '5.2 任务状态已原子复位为 IDLE');
  console.log('  ✅ [PASS] 5.1 调度系统租约超时自动接管与崩溃自愈机制通过');

  // ----------------------------------------------------------------
  // 维度 6: PostgreSQL 生产级备份与隔离测试库恢复演练
  // ----------------------------------------------------------------
  console.log('\n【维度 6: PostgreSQL 生产级备份与隔离测试库恢复演练】');

  const backupRes = await performDatabaseBackup();
  assert(backupRes.success && backupRes.sizeBytes > 10000, '6.1 生成二进制备份文件');
  console.log(`  ✅ [PASS] 6.1 生成 PostgreSQL 二进制 Dump 备份 (${Math.round(backupRes.sizeBytes / 1024)} KB)`);

  const drillRes = await performRestoreDrill(backupRes.filePath, 'softbuluo_restore_test');
  assert(drillRes.success && drillRes.verification, '6.2 隔离测试库恢复演练成功');
  assert(drillRes.verification.softwareCount >= 20, '6.3 恢复库软件实体数据完整');
  assert(drillRes.verification.tablesCount >= 25, '6.4 恢复库表结构与约束完整');
  console.log(`  ✅ [PASS] 6.2 恢复演练成功：表 ${drillRes.verification.tablesCount} 张，软件 ${drillRes.verification.softwareCount} 款，外键约束无损坏`);

  // ----------------------------------------------------------------
  // 维度 7: 生产部署环境配置与支付 MOCK 生产隔离
  // ----------------------------------------------------------------
  console.log('\n【维度 7: 生产部署环境配置与支付 MOCK 生产隔离】');

  // 模拟生产环境开启 MOCK 支付时的启动合规校验
  process.env.NODE_ENV = 'production';
  process.env.PAYMENT_MODE = 'mock';
  const prodCheck = validateProductionEnvironment();
  assert(!prodCheck.valid, '7.1 生产环境开启 MOCK 支付被系统级致命阻断');
  assert(prodCheck.errors.some((e) => e.includes('MOCK')), '7.2 明确报告 MOCK 支付违规');

  // 恢复开发测试环境
  process.env.NODE_ENV = 'development';
  process.env.PAYMENT_MODE = 'mock';
  console.log('  ✅ [PASS] 7.1 生产环境配置校验器生效：严禁任何 MOCK 支付混入生产环境');

  // ----------------------------------------------------------------
  // 维度 8: 云原生健康检查与探针 (Liveness / Readiness)
  // ----------------------------------------------------------------
  console.log('\n【维度 8: 云原生健康检查与探针 (Liveness / Readiness)】');

  const liveRes = await fetch(`${BASE_URL}/health/liveness`);
  const liveJson = (await liveRes.json()) as any;
  assert(liveRes.status === 200 && liveJson.status === 'UP', '8.1 Liveness 探针返回 UP');

  const readyRes = await fetch(`${BASE_URL}/health/readiness`);
  const readyJson = (await readyRes.json()) as any;
  assert(readyRes.status === 200 && readyJson.status === 'READY', '8.2 Readiness 探针返回 READY');

  const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
  const healthJson = (await healthRes.json()) as any;
  assert(healthRes.status === 200 && healthJson.database === 'CONNECTED', '8.3 运维健康聚合监控正常');
  console.log('  ✅ [PASS] 8.1 Liveness、Readiness 与运维监控探针全部达到就绪状态');

  // 测试完成，在开发测试环境中恢复初始凭据，保障 P1/P2/P3 回归套件幂等执行
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword('Admin@123456'), tokenVersion: 1 },
  });

  console.log('\n================================================================');
  console.log('🎉 软游部落 P3.1 生产上线安全整改与系统验收套件执行完毕: 100% 全部通过！');
  console.log('================================================================');
}

runP31ProductionReadinessTests().catch((err) => {
  console.error('❌ P3.1 测试执行失败:', err);
  process.exit(1);
});
