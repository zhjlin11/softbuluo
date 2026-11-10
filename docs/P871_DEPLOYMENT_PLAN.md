# 软游部落 P8.7.1 —— 电脑软件频道 UI 3.0 生产上线部署与回滚方案

> ⚠️ **生产安全声明**：本文件仅为经本地全面验收后的生产上线指导清单（**尚未执行任何线上部署**）。未经项目负责人明确授权，严禁擅自 SSH 修改生产服务器、执行线上数据库同步或重启线上进程。

---

## 一、涉及变更范围清单

### 1.1 数据库 Schema 变更 (`server/prisma/schema.prisma`)
- 新增模型 `ChannelRecommendation`（表名 `"ChannelRecommendation"`），用于存储电脑软件等频道焦点展位、本周热推、编辑精选、专题推荐与分类优选运营配置。
- **是否破坏存量数据**：否（纯新增独立表与索引，零删除/修改任何已有业务表与字段）。

### 1.2 后端源码变更
- 新增模块：
  - `server/src/modules/channels/softwareChannelService.ts`
  - `server/src/modules/channels/channelRoutes.ts`
- 修改文件：
  - `server/src/app.ts`（注册 `channelRoutes`）
  - `server/src/modules/categories/categoryRoutes.ts`（计数查询过滤 `isTestData: false` 并支持 `excludeType=GAME`）
  - `server/src/modules/resources/resourceRoutes.ts`（支持 `type=DESKTOP` 与 `sort=downloads`）
  - `server/src/modules/seo/seoService.ts`（新增 `renderSoftwareChannelHtml`）
  - `server/src/modules/seo/seoRoutes.ts`（新增 `GET /software`、`GET /seo/software`、更新 `/sitemap-software.xml` 与 `/robots.txt`）

### 1.3 前端源码变更
- 新增文件：
  - `src/services/channelService.ts`
  - `src/components/software/softwareHelpers.ts`
  - `src/components/software/SoftwareCompactCard.tsx`
  - `src/components/software/SoftwarePortalHero.tsx`
  - `src/components/software/SoftwareHotCategoryGrid.tsx`
  - `src/components/software/SoftwareLeaderboards.tsx`
  - `src/components/software/SoftwareEditorialExtras.tsx`
  - `src/components/software/SoftwareCategoryShowcase.tsx`
  - `src/pages/admin/AdminChannelConfigPage.tsx`
- 修改文件：
  - `src/pages/SoftwarePage.tsx`（重构为 UI 3.0 现代软件发现中心）
  - `src/components/admin/AdminLayout.tsx`（侧边栏增加「电脑软件频道运营」入口）
  - `src/App.tsx`（新增 `/admin/channel-software` 后台路由）

### 1.4 严格确认未修改的核心生产模块
- 首页 (`src/pages/HomePage.tsx`)、全站导航视觉样式 (`SiteHeader.tsx`)、Logo (`public/logo/Logo.png`)
- 其余频道 (`/system-tools`、`/games`、`/essentials`、`/compare`、`/community`、`/tutorials`、`/updates`)
- 软件详情页 (`/software/:slug` / `ResourceDetailPage.tsx`)、下载分发流程与文件防盗链 (`downloadRoutes.ts`)
- 会员与微信支付商业化逻辑 (`orders/`, `payments/`, `refunds/`)

---

## 二、授权上线操作步骤（获得批准后执行）

1. **生产数据库备份（前置必做）**：
   ```bash
   pg_dump -U postgres -d softbuluo -F c -f /var/backups/softbuluo_pre_p871_$(date +%F_%H%M).dump
   ```
2. **代码与构建产物同步至生产目录**（如 `/var/www/softtribe` 或对应部署根目录）：
   - 同步变更前后端代码与 `dist/` 前端编译构建产物（注意保留线上 `.env` 与 `uploads/` / `storage/` 目录）。
3. **执行线上 Prisma 结构同步（仅新增表）**：
   ```bash
   npx prisma db push --schema=server/prisma/schema.prisma
   npx prisma generate --schema=server/prisma/schema.prisma
   ```
4. **重启 Node/Fastify API 进程并重载 Nginx（如配置有改动）**：
   ```bash
   pm2 reload softtribe-api --update-env
   ```
5. **生产环境只读冒烟验收**：
   - 检查 `curl -fsS https://softtribe.top/api/v1/channels/software | jq '.success'` 返回 `true`；
   - 检查 `curl -I https://softtribe.top/software` 返回 HTTP `200`；
   - 浏览器无痕打开 `https://softtribe.top/software`，确认：
     - 标题、Canonical (`https://softtribe.top/software`)、分类数量真实无 41 等测试数字污染；
     - 无任何 Console 报错、无死图；
     - 首页 `https://softtribe.top/`、详情页 `/software/vscode` 及 `/admin/login` 全部正常。

---

## 三、应急回滚预案（2 分钟内恢复）

1. **代码与前端产物回滚**：
   - 将源码目录与 `dist/` 目录切回部署前快照（或 `git checkout <pre-p871-commit>` 并重编 `npm run build`），随后执行 `pm2 reload softtribe-api --update-env`。
2. **数据库表处理**：
   - 由于 `ChannelRecommendation` 为纯新增独立表且不修改任何旧表结构，回滚代码期间无需删表，旧版本应用可完全无感知运行；如确认彻底弃用再行 `DROP TABLE IF EXISTS "ChannelRecommendation";` 或从前置 `pg_dump` 备份恢复。
