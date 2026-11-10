# 软游部落 P8.7.4（游戏中心 UI 3.0）生产发布与分离回滚方案

> **重要状态声明**：本次交付仅完成**本地源码与本地测试验收**，尚未执行任何生产环境（`https://softtribe.top/` / `134.175.230.107`）发布、文件上传或数据库变更。任何生产操作均需在获得明确上线授权后按本方案执行。

---

## 一、变更边界清单

### 1. 纯代码变更（无破坏性数据库结构迁移）
P8.7.4 未对 PostgreSQL 生产表结构增加、删除或修改任何字段/约束/枚举：
- **后端新增 / 修改**：
  - `server/src/modules/channels/gamesChannelService.ts`（新增：`GET /api/v1/channels/games` 聚合逻辑）
  - `server/src/modules/channels/softwareChannelService.ts`（扩展 `ALLOWED_CHANNELS` 增加 `GAMES`，并隔离各频道推荐合法性校验）
  - `server/src/modules/channels/channelRoutes.ts`（新增 `/api/v1/channels/games`，后台候选集支持 `GAMES`）
  - `server/src/modules/resources/resourceRoutes.ts`（增加 `genre` 筛选、`supportedPlatforms` 兼容匹配，输出 `coverUrl / genre / distributionPlatform / priceType`）
  - `server/src/modules/seo/seoService.ts` 与 `server/src/modules/seo/seoRoutes.ts`（新增 `/games` SSR HTML、`/sitemap-games.xml` 纳入 `/games`、`/robots.txt` 增加 `Allow: /games`）
- **前端与静态资源新增 / 修改**：
  - `public/images/games/hero-indie-collection.svg`、`hero-game-safety.svg`
  - `public/robots.txt`（追加 `Allow: /games`）
  - `src/types/resource.ts`（`SoftwareItem` 新增可选游戏展示字段）
  - `src/services/channelService.ts`、`src/pages/admin/AdminChannelConfigPage.tsx`、`src/components/software/SoftwareLeaderboards.tsx`
  - `src/components/games/*`（`GamesPortalHero.tsx`、`GamesSpotlightGallery.tsx`、`GamesTaxonomyAndTools.tsx`、`GamesEditorialAndUpdates.tsx`、`GamesCatalogSection.tsx`）
  - `src/pages/GamesPage.tsx`

### 2. 数据与运营状态说明
- 本阶段**不执行任何数据库 Schema 变更**（零 `prisma db push` / `migrate` 需求）。
- 本阶段**不批量上线任何 `DRAFT` 游戏草稿**；线上发布后若管理员通过后台 `/admin/channels` 的「游戏中心频道 (`/games`)」配置了 `GAMES` 推荐位，将在数据库 `ChannelRecommendation` 表新增 `channel = 'GAMES'` 行记录，完全独立于 `SOFTWARE` 与 `SYSTEM_TOOLS`。

---

## 二、标准灰度上线步骤（待用户授权后执行）

1. **构建前备份**：
   - 在生产服务器建立版本归档目录与当前代码快照（保留上一版 `dist/`、`server/`、`public/`），同时导出 PostgreSQL 逻辑备份 `pg_dump`（作为独立数据安全底线）。
2. **代码同步与编译**：
   - 将本阶段前端构建产物 `dist/`、后端 `server/` 源码及 `public/` 资源同步至生产环境。
   - 校验生产 `.env` 中 `PUBLIC_SITE_URL=https://softtribe.top`、`VITE_PUBLIC_SITE_URL=https://softtribe.top`。
3. **服务平滑重启**：
   - 重载后端 Node/PM2 服务并验证 `/api/v1/health` 与 `GET /api/v1/channels/games`。
   - 验证静态资源 `/images/games/*.jpg`、`/images/games/hero-*.svg` 与 `/games` 页面 HTTP 200。
4. **线上冒烟验收**：
   - 验证 `https://softtribe.top/games`（1440px 与 390px 渲染、Canonical、实机大图切换、筛选与检索）。
   - 验证 `https://softtribe.top/sitemap-games.xml` 与 `https://softtribe.top/robots.txt`。
   - 验证回归保护面：`/`、`/software`、`/system-tools` 功能与外观完好。

---

## 三、明确分离的两类回滚策略

| 回滚情形 | 适用场景 | 执行步骤 | 对数据与其余频道的影响 |
| :--- | :--- | :--- | :--- |
| **策略 A：仅代码回滚（推荐首选）** | `/games` 页面渲染异常、接口兼容性问题或 SEO 文案/样式回退 | 1. 将 `dist/`、`server/src/`、`public/robots.txt` 还原至上一稳定发布包；<br>2. 重启 PM2 后端进程与静态服务。<br>**严禁回滚整库或还原表数据。** | **零数据丢失**：用户订单、下载统计、社区讨论、`SOFTWARE`/`SYSTEM_TOOLS` 配置全部完好保留；即使库内已有 `channel='GAMES'` 推荐记录也不会被旧代码读取破坏。 |
| **策略 B：仅数据库运营配置回滚 / 整库恢复** | 管理员在 `/admin/channels` 错误配置了大量 `GAMES` 推荐展位 | 1. 首选局部清理：仅删除或禁用 `ChannelRecommendation` 中 `channel='GAMES'` 的运营配置即可即时回退默认动态推荐；<br>2. 仅在发生极端数据误操作破坏时，方使用上线前 `pg_dump` 执行库级回滚。 | 局部清理仅作用于游戏中心运营推荐位；整库恢复仅作极端灾难兜底（会回退两次备份间产生的新业务数据）。 |
