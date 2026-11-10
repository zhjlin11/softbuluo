# 软游部落（SoftBuluo）P8.5 全站真实路由与页面检查清单 (Route Inventory)

> **生成时间**：2026-11-09T14:49:54.872Z  
> **检查工具**：Playwright 真实浏览器无头自动化探测  
> **路由总数**：48 个（前台公开路由 24 个，后台管理路由 24 个）  
> **实测覆盖率**：100%（全部 48 个页面均完成真实浏览器加载验证）  

## 汇总统计

- **全部通过 (PASS)**: 48 个
- **告警关注 (WARN)**: 0 个
- **致命故障 (FAIL)**: 0 个

## 详细路由清单

| 序号 | 路由路径 | 页面名称 | 页面组件文件 | 登录要求 | 管理员 | 对应 API 接口 | 实测状态 | 发现问题与审计结论 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/` | **首页** | `src/pages/HomePage.tsx` | 否 | 否 | `GET /api/v1/home, GET /api/v1/resources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 2 | `/software/vscode` | **软件详情 (VS Code)** | `src/pages/ResourceDetailPage.tsx` | 否 | 否 | `GET /api/v1/resources/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 3 | `/game/mindustry` | **游戏详情 (Mindustry)** | `src/pages/ResourceDetailPage.tsx` | 否 | 否 | `GET /api/v1/resources/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 4 | `/tool/cpu-z` | **系统工具兼容详情 (CPU-Z)** | `src/pages/ResourceDetailPage.tsx` | 否 | 否 | `GET /api/v1/resources/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 5 | `/category/dev` | **开发工具分类** | `src/pages/CategoryPage.tsx` | 否 | 否 | `GET /api/v1/categories/:slug/resources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 6 | `/category/games` | **游戏专区分类** | `src/pages/CategoryPage.tsx` | 否 | 否 | `GET /api/v1/categories/:slug/resources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 7 | `/category/sys-tools` | **系统工具分类** | `src/pages/CategoryPage.tsx` | 否 | 否 | `GET /api/v1/categories/:slug/resources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 8 | `/topics/win11-essential-tools` | **专题详情页 (Win11装机必备)** | `src/pages/TopicDetailPage.tsx` | 否 | 否 | `GET /api/v1/topics/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 9 | `/membership` | **会员权益与购买方案** | `src/pages/MembershipPage.tsx` | 否 | 否 | `GET /api/v1/products` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 10 | `/checkout/ORD202611081426566716` | **订单收银台** | `src/pages/CheckoutPage.tsx` | 是 | 否 | `GET /api/v1/orders/:orderNo` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 11 | `/account` | **个人中心与订单** | `src/pages/AccountPage.tsx` | 是 | 否 | `GET /api/v1/members/me, GET /api/v1/members/orders` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 12 | `/compare` | **软件横向对比选型** | `src/pages/ComparisonListPage.tsx` | 否 | 否 | `GET /api/v1/comparisons` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 13 | `/compare/vscode-vs-sublime` | **软件横向对比详情** | `src/pages/ComparisonDetailPage.tsx` | 否 | 否 | `GET /api/v1/comparisons/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 14 | `/developer` | **开发者门户首页** | `src/pages/DeveloperPortalPage.tsx` | 否 | 否 | `GET /api/v1/developers/featured` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 15 | `/developer/register` | **开发者入驻申请** | `src/pages/DeveloperRegisterPage.tsx` | 是 | 否 | `POST /api/v1/developers/register` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 16 | `/developer/dashboard` | **开发者控制台** | `src/pages/DeveloperDashboardPage.tsx` | 是 | 否 | `GET /api/v1/developers/me` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 17 | `/developer/api-keys` | **开发者 API Key 管理** | `src/pages/DeveloperApiKeysPage.tsx` | 是 | 否 | `GET /api/v1/developers/api-keys` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 18 | `/developers/dev-mw8zit6r` | **开发者公开认证主页** | `src/pages/DeveloperPublicPage.tsx` | 否 | 否 | `GET /api/v1/developers/:slug` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 19 | `/developers/api` | **开放 API 接口文档** | `src/pages/ApiDocsPage.tsx` | 否 | 否 | `GET /api/public/v1/openapi.json` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 20 | `/api/docs` | **开放 API 接口文档 (别名)** | `src/pages/ApiDocsPage.tsx` | 否 | 否 | `GET /api/public/v1/openapi.json` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 21 | `/community` | **社区交流大厅** | `src/pages/CommunityPage.tsx` | 否 | 否 | `GET /api/v1/community/threads` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 22 | `/community/software/vscode` | **特定软件社区专区** | `src/pages/CommunityPage.tsx` | 否 | 否 | `GET /api/v1/community/threads?software=vscode` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 23 | `/community/thread/cmw9bac6i000dvkgcwm21resk` | **社区讨论主题详情** | `src/pages/CommunityDetailPage.tsx` | 否 | 否 | `GET /api/v1/community/threads/:id` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 24 | `/non-existent-404-test` | **404 资源不存在兜底** | `src/App.tsx (Fallback)` | 否 | 否 | `无` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 25 | `/admin/login` | **管理后台登录** | `src/pages/admin/AdminLoginPage.tsx` | 否 | 否 | `POST /api/v1/admin/login` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 26 | `/admin` | **数据大盘** | `src/pages/admin/AdminDashboardPage.tsx` | 是 | 是 | `GET /api/v1/admin/dashboard` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 27 | `/admin/operations` | **运营工作台** | `src/pages/admin/AdminOperationsPage.tsx` | 是 | 是 | `GET /api/v1/admin/operations` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 28 | `/admin/import` | **批量收录与去重** | `src/pages/admin/AdminImportPage.tsx` | 是 | 是 | `POST /api/v1/admin/import/csv` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 29 | `/admin/sources` | **官方资源来源** | `src/pages/admin/AdminOfficialSourcesPage.tsx` | 是 | 是 | `GET /api/v1/admin/sources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 30 | `/admin/version-monitor` | **版本自动监测** | `src/pages/admin/AdminVersionMonitorPage.tsx` | 是 | 是 | `GET /api/v1/admin/versions` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 31 | `/admin/link-monitor` | **下载链接健康** | `src/pages/admin/AdminLinkMonitorPage.tsx` | 是 | 是 | `GET /api/v1/admin/link-health` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 32 | `/admin/topics` | **专题合集管理** | `src/pages/admin/AdminTopicsPage.tsx` | 是 | 是 | `GET /api/v1/admin/topics` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 33 | `/admin/tutorials` | **实用教程管理** | `src/pages/admin/AdminTutorialsPage.tsx` | 是 | 是 | `GET /api/v1/admin/tutorials` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 34 | `/admin/jobs` | **自动任务中心** | `src/pages/admin/AdminJobsPage.tsx` | 是 | 是 | `GET /api/v1/admin/jobs` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 35 | `/admin/resources` | **资源与版本库** | `src/pages/admin/AdminResourcesPage.tsx` | 是 | 是 | `GET /api/v1/admin/resources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 36 | `/admin/download-sources` | **下载来源核验** | `src/pages/admin/AdminSourcesPage.tsx` | 是 | 是 | `GET /api/v1/admin/download-sources` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 37 | `/admin/orders` | **商业订单流水** | `src/pages/admin/AdminOrdersPage.tsx` | 是 | 是 | `GET /api/v1/admin/orders` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 38 | `/admin/refunds` | **退款审核与争议** | `src/pages/admin/AdminRefundsPage.tsx` | 是 | 是 | `GET /api/v1/admin/refunds` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 39 | `/admin/comparisons` | **页面对比评测** | `src/pages/admin/AdminComparisonsPage.tsx` | 是 | 是 | `GET /api/v1/admin/comparisons` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 40 | `/admin/seo/keywords` | **SEO 关键词库** | `src/pages/admin/AdminKeywordsPage.tsx` | 是 | 是 | `GET /api/v1/admin/seo/keywords` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 41 | `/admin/seo/audit` | **SEO 质量审计** | `src/pages/admin/AdminSeoAuditPage.tsx` | 是 | 是 | `GET /api/v1/admin/seo/audit` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 42 | `/admin/reviews` | **评价与纠错反馈** | `src/pages/admin/AdminReviewsPage.tsx` | 是 | 是 | `GET /api/v1/admin/reviews` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 43 | `/admin/ai-assistant` | **AI 辅助运营** | `src/pages/admin/AdminAiAssistantPage.tsx` | 是 | 是 | `GET /api/v1/admin/ai/tasks` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 44 | `/admin/analytics` | **增长与流量分析** | `src/pages/admin/AdminAnalyticsPage.tsx` | 是 | 是 | `GET /api/v1/admin/analytics` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 45 | `/admin/developers` | **开发者入驻审核** | `src/pages/admin/AdminDevelopersPage.tsx` | 是 | 是 | `GET /api/v1/admin/developers` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 46 | `/admin/claims` | **软件所有权认领** | `src/pages/admin/AdminClaimsPage.tsx` | 是 | 是 | `GET /api/v1/admin/claims` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 47 | `/admin/community` | **社区交流与举报** | `src/pages/admin/AdminCommunityPage.tsx` | 是 | 是 | `GET /api/v1/admin/community` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
| 48 | `/admin/api-keys` | **开放 API 与限流** | `src/pages/admin/AdminApiKeysPage.tsx` | 是 | 是 | `GET /api/v1/admin/api-keys` | **PASS** (HTTP 200) | 加载正常，DOM 与样式渲染完好 |
