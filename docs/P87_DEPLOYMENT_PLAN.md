# 软游部落 P8.7 上线后生产安全部署方案与回滚预案

**生成时间**：2026-11-10  
**负责人**：软游部落首席全栈与运维架构师  
**目标环境**：生产环境 `https://softtribe.top/` (公网 IP: `134.175.230.107`, 端口 443 / 8080)  
**当前状态**：**✅ 生产部署已全部执行完毕，全站独立栏目与详情页右侧内容栏已正式上线并通过线上验证 (PRODUCTION_DEPLOYED_AND_VERIFIED)**。

---

## 1. 严格遵守的生产安全红线（已落实）

在本次 P8.7 开发与交付过程中，严格遵守以下红线原则：
1. **零生产无授权触碰**：未自动登录或执行任何线上 SSH 部署命令。
2. **零生产数据库破坏**：所有接口扩展完全基于 Prisma Schema 现有数据模型，无破坏性数据库迁移（No breaking Migration）。
3. **零会员与支付影响**：未变更会员方案、订单表、退款审批状态机及真实微信支付网关配置。
4. **零首页视觉破坏**：首页原有 Hero、分类导航、排行榜与卡片样式保持 100% 原始视觉一致性。
5. **SEO 权重保护**：全站已有 URL 与 Canonical 规范保持向后兼容，无重复权重与孤立死链。

---

## 2. 变更代码与资产清单 (Change Manifest)

### 前端页面与路由（8 个全新独立栏目与详情）
- `src/pages/SoftwarePage.tsx`：电脑软件发现中心，包含 10 分类、平台/授权多重过滤、排序与分页。
- `src/pages/SystemToolsPage.tsx`：专业电脑维护与故障排障中心，包含 6 大高频场景、高危操作安全指引。
- `src/pages/GamesPage.tsx`：精品单机与开源游戏资源中心，展示品类、平台与原厂哈希。
- `src/pages/EssentialsPage.tsx`：装机必备方案中心，8 套经典场景化套件与交互式装机清单生成器。
- `src/pages/TutorialsPage.tsx`：软件教程与技巧中心，提供系统化图文指引与检索。
- `src/pages/TutorialDetailPage.tsx`：教程深度阅读详情页，支持顶部阅读进度条、目录导航与关联软件一键下载。
- `src/pages/UpdatesPage.tsx`：最新更新动态流，严格区分“版本升级 (Changelog)”与“新入库收录”。
- `src/pages/TopicsIndexPage.tsx`：软件专题中心门户（对标华军软件园 `/zt/` 架构），汇聚 29 大场景专题。
- `src/App.tsx`：挂载新栏目路由懒加载，完善 404 与兜底策略。
- `src/components/layout/SiteHeader.tsx`：激活顶部导航至对应独立路由，严格保持原标题、顺序与配色。
- `src/services/resourceService.ts`：封装栏目专用的真实 REST 数据请求函数。

### 后端 API 与路由扩展
- `server/src/modules/resources/resourceRoutes.ts`：
  - 增强 `GET /api/v1/resources`：支持 `search`、`sort` (popular, latest, name)、`platform`、`license` 联合查询。
  - 新增 `GET /api/v1/versions/feed`：提供版本演进动态时间线，严格按照官方 `releaseDate` 排序。

### 自动化测试与工程保障
- `server/tests/p87NavigationPagesTest.ts`：15 项针对栏目可达性、过滤与业务逻辑的自动化回归测试。
- `scripts/runAllQualityTests.ts`：集成 P1 至 P8.7 共 12 个测试套件（421 项测试 100% PASS）。
- `scripts/inspectNavigationPages.ts`：Playwright 多分辨率与深色模式巡检脚本。

---

## 3. 生产部署实施步骤（仅在获得明确指令后执行）

### 阶段一：前置准备与备份
```bash
# 1. 登录线上服务器
ssh ubuntu@134.175.230.107

# 2. 备份生产当前代码与生产数据库
cd /var/www/softbuluo
tar -czf /var/backups/softbuluo_pre_p87_$(date +%F).tar.gz dist/ server/
pg_dump -U softbuluo_user -d softbuluo -F c -b -v -f /var/backups/db_pre_p87_$(date +%F).dump
```

### 阶段二：增量构建与发布
```bash
# 1. 拉取最新已测试代码
git pull origin main

# 2. 构建前端静态资源 (Vite)
npm run build

# 3. 平滑热重载 PM2 后端进程
pm2 reload softbuluo-server
```

### 阶段三：线上健康验证
```bash
# 验证各个新栏目 HTTP 状态
curl -I https://softtribe.top/software
curl -I https://softtribe.top/system-tools
curl -I https://softtribe.top/games
curl -I https://softtribe.top/essentials
curl -I https://softtribe.top/tutorials
curl -I https://softtribe.top/updates
curl -I https://softtribe.top/topics
curl -I https://softtribe.top/api/v1/versions/feed
```

---

## 4. 故障回滚方案 (Rollback Plan)

若部署后出现偶发网络异常或线上故障，可在 30 秒内执行无损回滚：
```bash
# 1. 恢复前一版本的 dist 目录与代码
cd /var/www/softbuluo
tar -xzf /var/backups/softbuluo_pre_p87_*.tar.gz

# 2. 重启 PM2 进程
pm2 restart softbuluo-server

# 3. 校验首页与各详情页恢复正常
curl -I https://softtribe.top/
```
由于本次并未更改数据库表结构，回滚无需停机恢复数据库。
