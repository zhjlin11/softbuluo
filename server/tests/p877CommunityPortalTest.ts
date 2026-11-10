import { prisma } from '../src/db';
import {
  DiscussionCategory,
  DiscussionStatus,
  ReportStatus,
  ResourceStatus,
  Role,
} from '@prisma/client';
import { CommunityService } from '../src/modules/community/communityService';
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
  console.log('🧪 P8.7.7 社区交流频道 UI 3.0 门户化升级全量验收测试');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. 数据模型与枚举完整性验证
    // -------------------------------------------------------------------------
    console.log('▶ [1/11] 验证社区交流数据模型与枚举完整性...');
    const categories = Object.values(DiscussionCategory);
    assert(categories.includes('QUESTION' as any), '枚举包含 QUESTION (技术问答)');
    assert(categories.includes('INSTALL_ISSUE' as any), '枚举包含 INSTALL_ISSUE (安装排障)');
    assert(categories.includes('EXPERIENCE' as any), '枚举包含 EXPERIENCE (使用心得)');
    assert(categories.includes('FEEDBACK' as any), '枚举包含 FEEDBACK (功能建议)');
    assert(categories.includes('WINDOWS' as any), '枚举包含 WINDOWS (Windows系统)');
    assert(categories.includes('REPAIR' as any), '枚举包含 REPAIR (电脑维修与装机)');
    assert(categories.includes('NETWORK' as any), '枚举包含 NETWORK (网络与安全)');
    assert(categories.includes('GAMES' as any), '枚举包含 GAMES (游戏讨论)');

    // -------------------------------------------------------------------------
    // 2. 真实社区统计指标 (零造假准则)
    // -------------------------------------------------------------------------
    console.log('\n▶ [2/11] 验证真实社区统计指标 (杜绝虚假机器人刷量)...');
    const stats = await CommunityService.getCommunityStats();
    assert(stats.totalThreads >= 2, `真实讨论数 >= 2 (实际: ${stats.totalThreads})`);
    assert(stats.totalPosts >= 1, `真实回复数 >= 1 (实际: ${stats.totalPosts})`);
    assert(typeof stats.resolvedThreads === 'number', '已解决主题数为数字');
    assert(stats.resolutionRate >= 0 && stats.resolutionRate <= 100, `解决率计算在 0~100% 之间 (实际: ${stats.resolutionRate}%)`);
    assert(typeof stats.categoryCounts === 'object', '包含各分类真实统计字典');

    // 交叉校验数据库真实统计
    const dbActiveThreadCount = await prisma.discussionThread.count({
      where: { status: DiscussionStatus.ACTIVE }
    });
    assert(stats.totalThreads === dbActiveThreadCount, `统计服务数据与数据库 ACTIVE 主题数完全一致 (${stats.totalThreads})`);

    // -------------------------------------------------------------------------
    // 3. 待协助解决求助问题接口 (Pending Questions)
    // -------------------------------------------------------------------------
    console.log('\n▶ [3/11] 验证待解决求助列表 (Pending Questions)...');
    const pendingQuestions = await CommunityService.getPendingQuestions(5);
    assert(Array.isArray(pendingQuestions), '待解决求助列表返回数组');
    const allUnresolved = pendingQuestions.every((q) => typeof q.title === 'string' && q.id);
    assert(allUnresolved, '待解决求助条目包含合法的 id 与 title');

    // -------------------------------------------------------------------------
    // 4. 多维分类、状态过滤与排序
    // -------------------------------------------------------------------------
    console.log('\n▶ [4/11] 验证讨论列表多维筛选与排序...');
    const allThreads = await CommunityService.listThreads({ page: 1, pageSize: 10 });
    assert(allThreads.items.length > 0, `默认列表可成功检索数据 (总数: ${allThreads.pagination.total})`);

    // 按分类筛选
    const expThreads = await CommunityService.listThreads({ category: DiscussionCategory.EXPERIENCE });
    const allMatchExp = expThreads.items.every((t) => t.category === DiscussionCategory.EXPERIENCE);
    assert(allMatchExp, '分类筛选 EXPERIENCE 结果完全匹配');

    // 按解决状态筛选
    const unresolvedThreads = await CommunityService.listThreads({ isResolved: false });
    const allMatchUnresolved = unresolvedThreads.items.every((t) => !t.isResolved);
    assert(allMatchUnresolved, '筛选待解决讨论结果完全匹配 isResolved=false');

    // 热门排序
    const hotThreads = await CommunityService.listThreads({ sort: 'hottest' });
    assert(Array.isArray(hotThreads.items), '热门排序成功返回列表');

    // 搜索
    const searchRes = await CommunityService.listThreads({ search: 'Blender' });
    assert(searchRes.items.some((t) => t.title.includes('Blender')), '关键字 "Blender" 精准检索到关联主题');

    // -------------------------------------------------------------------------
    // 5. 主题详情与浏览量递增
    // -------------------------------------------------------------------------
    console.log('\n▶ [5/11] 验证主题详情与浏览量自增逻辑...');
    const firstThread = allThreads.items[0];
    const initialViews = firstThread.viewCount;
    const detail = await CommunityService.getThread(firstThread.id);
    assert(!!detail, `成功加载指定主题详情 (${firstThread.id})`);
    assert(detail!.viewCount === initialViews + 1, `浏览量成功原子递增 (+1): ${detail!.viewCount}`);
    assert(!!detail!.user, '详情包含发帖作者用户信息');

    const notFound = await CommunityService.getThread('non-existent-thread-id-999');
    assert(notFound === null, '不存在的主题安全返回 null');

    // -------------------------------------------------------------------------
    // 6. 安全防线：Anti-XSS 过滤与防刷限流
    // -------------------------------------------------------------------------
    console.log('\n▶ [6/11] 验证安全防线：Anti-XSS 过滤与限流...');
    // 获取测试用户
    const memberUser = await prisma.memberUser.findFirst({
      where: { status: 'ACTIVE' }
    });
    assert(!!memberUser, '找到有效会员用户用于安全测试');

    // 测试创建带有恶意 XSS 脚本的帖子
    const xssPayload = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
    const testThread = await CommunityService.createThread(memberUser!.id, {
      title: 'UI 3.0 测试排障提问 ' + Date.now(),
      content: '详细描述内容排障说明 ' + xssPayload,
      category: DiscussionCategory.QUESTION,
      tags: 'Win11, 测试, <script>'
    });

    assert(!testThread.content.includes('<script>'), '正文 XSS <script> 标签被成功实体转义');
    assert(testThread.content.includes('&lt;script&gt;'), '正文包含安全转义后的 &lt;script&gt;');
    assert(testThread.tags?.includes('&lt;script&gt;'), '标签中 XSS 亦被成功转义');

    // 标题长度限制拦截
    let shortTitleBlocked = false;
    try {
      await CommunityService.createThread(memberUser!.id, {
        title: '短',
        content: '详细内容描述测试测试测试测试',
        category: DiscussionCategory.QUESTION
      });
    } catch {
      shortTitleBlocked = true;
    }
    assert(shortTitleBlocked, '标题短于 5 字符被安全拦截');

    // 正文长度限制拦截
    let shortContentBlocked = false;
    try {
      await CommunityService.createThread(memberUser!.id, {
        title: '有效标题长于五个字符',
        content: '太短',
        category: DiscussionCategory.QUESTION
      });
    } catch {
      shortContentBlocked = true;
    }
    assert(shortContentBlocked, '正文短于 10 字符被安全拦截');

    // -------------------------------------------------------------------------
    // 7. 回复创建与开发者认证标记
    // -------------------------------------------------------------------------
    console.log('\n▶ [7/11] 验证回复交流与开发者认证标记...');
    const replyPost = await CommunityService.createPost(testThread.id, memberUser!.id, {
      content: '这是一条有效的技术排障解答：建议检查声卡驱动并更新为微软通用驱动。'
    });
    assert(!!replyPost.id, '成功创建回复交流记录');
    assert(replyPost.threadId === testThread.id, '回复与主题关联 ID 正确');

    // 检查主题回复数递增
    const updatedThreadAfterReply = await prisma.discussionThread.findUnique({
      where: { id: testThread.id }
    });
    assert(updatedThreadAfterReply!.replyCount >= 1, `主题回复数更新为 >= 1 (实际: ${updatedThreadAfterReply!.replyCount})`);

    // -------------------------------------------------------------------------
    // 8. 采纳最佳解答闭环工作流 (Accepted Answer Workflow)
    // -------------------------------------------------------------------------
    console.log('\n▶ [8/11] 验证最佳解答采纳与问答闭环 (Accepted Answer Workflow)...');
    // 非发帖者尝试采纳应被拦截 (权限控制)
    let unauthorizedBlocked = false;
    try {
      await CommunityService.resolveThread(testThread.id, 'other-unauthorized-user-id', replyPost.id, false);
    } catch {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, '非发起者尝试采纳答案被 403 权限拦截');

    // 发起者采纳最佳解答
    const resolvedThread = await CommunityService.resolveThread(testThread.id, memberUser!.id, replyPost.id, false);
    assert(resolvedThread.isResolved === true, '主题状态变更为已解决 (isResolved=true)');
    assert(resolvedThread.acceptedPostId === replyPost.id, '主题记录被采纳的回复 ID');

    // 验证帖子自身的 isAccepted 标志
    const updatedPost = await prisma.discussionPost.findUnique({ where: { id: replyPost.id } });
    assert(updatedPost!.isAccepted === true, '被采纳回复记录 isAccepted=true');

    // 取消解决状态
    const unresolved = await CommunityService.unresolveThread(testThread.id, memberUser!.id, false);
    assert(unresolved.isResolved === false, '成功取消解决状态 (isResolved=false)');
    assert(unresolved.acceptedPostId === null, 'acceptedPostId 清空为 null');
    const resetPost = await prisma.discussionPost.findUnique({ where: { id: replyPost.id } });
    assert(resetPost!.isAccepted === false, '回复 isAccepted 恢复为 false');

    // -------------------------------------------------------------------------
    // 9. 举报与合规审核队列
    // -------------------------------------------------------------------------
    console.log('\n▶ [9/11] 验证违规内容举报与合规审核队列...');
    const report = await CommunityService.reportContent(memberUser!.id, {
      threadId: testThread.id,
      reason: '测试举报：广告引流违规排查'
    });
    assert(!!report.id, '成功提交举报记录');
    assert(report.status === ReportStatus.PENDING, '举报初始状态为 PENDING');

    // 管理员处理举报
    const resolvedReport = await CommunityService.adminResolveReport(
      report.id,
      ReportStatus.RESOLVED,
      '确认属实并处理完毕',
      'super_admin'
    );
    assert(resolvedReport.status === ReportStatus.RESOLVED, '管理员成功更新举报为 RESOLVED');

    // 清理测试主题
    await prisma.discussionReport.deleteMany({ where: { threadId: testThread.id } });
    await prisma.discussionPost.deleteMany({ where: { threadId: testThread.id } });
    await prisma.discussionThread.delete({ where: { id: testThread.id } });

    // -------------------------------------------------------------------------
    // 10. 服务端渲染 (SSR) 与 SEO 规范
    // -------------------------------------------------------------------------
    console.log('\n▶ [10/11] 验证服务端渲染 (SSR) 与 SEO 结构化数据...');
    const channelHtmlRes = await SeoService.renderCommunityChannelHtml();
    assert(channelHtmlRes.status === 200, 'renderCommunityChannelHtml 返回 200');
    assert(channelHtmlRes.html.includes('电脑装机维护与正版软件技术问答社区'), '包含规范主标题');
    assert(channelHtmlRes.html.includes('https://schema.org'), '包含 Schema.org 结构化数据');
    assert(channelHtmlRes.html.includes('CollectionPage'), '包含 CollectionPage 类型标注');
    assert(channelHtmlRes.html.includes('rel="canonical"'), '包含 Canonical 规范链接');

    // 单篇讨论详情 SSR
    const threadHtmlRes = await SeoService.renderCommunityThreadHtml(firstThread.id);
    assert(threadHtmlRes.status === 200, 'renderCommunityThreadHtml 返回 200');
    assert(threadHtmlRes.html.includes('QAPage'), '讨论详情页包含 QAPage 结构化数据');
    assert(threadHtmlRes.html.includes(firstThread.title), '详情页 HTML 包含讨论标题');

    // -------------------------------------------------------------------------
    // 11. 全站核心频道防回退与无污染回归
    // -------------------------------------------------------------------------
    console.log('\n▶ [11/11] 验证既有核心频道无污染防回退回归...');
    const homeHtml = await SeoService.renderHomeHtml();
    assert(homeHtml.status === 200 && homeHtml.html.length > 1000, '首页公开 HTML 稳定正常 (无污染)');

    const softwareHtml = await SeoService.renderSoftwareChannelHtml();
    assert(softwareHtml.status === 200 && softwareHtml.html.length > 1000, '电脑软件频道 HTML 稳定正常 (无污染)');

    const sysToolsHtml = await SeoService.renderSystemToolsChannelHtml();
    assert(sysToolsHtml.status === 200 && sysToolsHtml.html.length > 1000, '系统工具频道 HTML 稳定正常 (无污染)');

    const gamesHtml = await SeoService.renderGamesChannelHtml();
    assert(gamesHtml.status === 200 && gamesHtml.html.length > 1000, '游戏中心频道 HTML 稳定正常 (无污染)');

    const essentialsHtml = await SeoService.renderEssentialsChannelHtml();
    assert(essentialsHtml.status === 200 && essentialsHtml.html.length > 1000, '装机必备频道 HTML 稳定正常 (无污染)');

    const compareHtml = await SeoService.renderCompareChannelHtml();
    assert(compareHtml.status === 200 && compareHtml.html.length > 1000, '对比评测频道 HTML 稳定正常 (无污染)');

  } catch (err: any) {
    console.error('测试执行过程中捕获异常:', err);
    failCount++;
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.7.7 测试汇总: 通过 ${passCount} 项 | 失败 ${failCount} 项`);
  console.log('========================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
