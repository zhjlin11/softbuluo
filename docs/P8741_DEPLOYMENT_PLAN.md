# 软游部落 P8.7.4.1（游戏中心 SEO、CLS 性能与测试数据治理）生产发布与回滚方案

> **重要状态声明**：本阶段严格在本地环境完成代码整改与测试验收，**尚未对生产环境（`https://softtribe.top/` / `134.175.230.107`）执行任何代码上传、Nginx 配置修改/重载、PM2 重启或生产数据库写入**。所有生产部署操作必须等待用户明确授权后，严格按本方案逐项执行。

---

## 一、变更边界清单

### 1. Nginx 与反向代理配置变更（需运维授权合入生产配置）
- [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf)（对应服务器 `/etc/nginx/sites-available/softtribe.top.conf`）与 [softtribe.top.conf](file:///e:/Code/新建文件夹/softtribe.top.conf)：
  - 在 `listen 443 ssl`（第 28–37 行）与 `listen 8080`（第 126–135 行）两个 `server` 块中新增动态 Sitemap 与 Robots 反向代理规则，拦截所有 Sitemap 与 `/robots.txt` 请求并转发至 Fastify（`127.0.0.1:3008`），防止请求落入 `location / { try_files $uri $uri/ /index.html; }` 回退 HTML：

```nginx
    # SEO 动态 Sitemap 与 Robots（反代至 Fastify 3008，防止 SPA try_files 回退为 index.html）
    location ~* ^/(sitemap(-[a-z0-9-]+)?\.xml|robots\.txt)$ {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 10m;
        add_header Cache-Control "public, max-age=600";
    }
```

### 2. 前端、构建配置与静态文件清理（零样式重设计）
- **删除过期静态演示文件**：移除 `public/sitemap.xml`（包含无效占位域名 `soft.example.com`），确保生产重新构建后的 `dist/` 不再包含静态 `sitemap.xml`（同步发布时必须清理远程 `/var/www/softtribe.top/dist/sitemap.xml`）。
- [vite.config.ts](file:///e:/Code/新建文件夹/vite.config.ts#L43-L50)：本地 Vite Dev 代理补充 `^/sitemap(-[a-z0-9-]+)?\\.xml$` 与 `/robots.txt` 至 `http://localhost:3001`。
- [src/App.tsx](file:///e:/Code/新建文件夹/src/App.tsx#L161-L166)：`PageLoadingFallback` 从 `min-h-[50vh]` 调整为 `min-h-[calc(100vh-64px)]`，避免路由懒加载期间 `SiteFooter` 进入视口并在挂载后瞬时被推离，彻底消除 `0.1531–0.3885` 的高 CLS。
- 游戏中心图片显式尺寸属性加固（不改变视觉样式）：
  - [GamesPortalHero.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesPortalHero.tsx#L190-L191)（主焦点图 `width={1280} height={720}`，右侧缩略图 第 296–297 行 `width={64} height={40}`）
  - [GamesSpotlightGallery.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesSpotlightGallery.tsx#L62-L63)（实机大图 `width={1280} height={720}`，缩略切换图 第 117–118 行 `width={56} height={32}`）
  - [GamesEditorialAndUpdates.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesEditorialAndUpdates.tsx#L60-L61)（游戏卡片封面 `width={640} height={360}`）
  - [GamesCatalogSection.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesCatalogSection.tsx#L242-L243)（目录封面图 `width={640} height={360}`）

### 3. 后端服务逻辑变更（零数据库 Schema 迁移）
- [seoRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts#L322-L350)：
  - `/sitemap-topics.xml` 限定 `status: TopicStatus.PUBLISHED` 且 `NOT: { slug: { startsWith: 'topic-p3-' } }`；
  - `/sitemap-tutorials.xml` 限定 `status: 'PUBLISHED'` 且 `NOT: { slug: { startsWith: 'tut-p3-' } }`。
- [governanceService.ts](file:///e:/Code/新建文件夹/server/src/modules/governance/governanceService.ts#L181-L205)：
  - `getGovernanceMetrics()` 对 `totalResources`、`publishedCount`、`draftCount` 及六类 `dataIntegrityStatus` 计数统一增加 `officialWhere = { isTestData: false }` 隔离条件，真实反映官方正式资源完整率。

### 4. 数据库与测试治理边界
- 本阶段**不执行任何 Prisma Schema 变更**（零字段、索引、枚举增删）。
- 已修复 [apiTest.ts](file:///e:/Code/新建文件夹/server/tests/apiTest.ts#L257-L263) 与 [p3OperationsTest.ts](file:///e:/Code/新建文件夹/server/tests/p3OperationsTest.ts#L480-L502) 的测试收尾清理，并新增 [p8741GamesQualityFixTest.ts](file:///e:/Code/新建文件夹/server/tests/p8741GamesQualityFixTest.ts) 注册至 [runAllQualityTests.ts](file:///e:/Code/新建文件夹/scripts/runAllQualityTests.ts)。上述测试脚本仅用于研发/本地/预发验证，不影响生产运行时请求路径。

---

## 二、生产发布前只读核查与备份规范（待授权后执行）

1. **Nginx 配置快照备份**：
   ```bash
   sudo cp /etc/nginx/sites-available/softtribe.top.conf /etc/nginx/sites-available/softtribe.top.conf.bak.p8741
   ```
2. **前端与后端产物归档备份**：
   - 备份当前 `/var/www/softtribe.top/dist/` 与 `/var/www/softtribe.top/server/`（保留回滚包）。
3. **生产 PostgreSQL 只读逻辑备份与测试残留核查**：
   - 执行 `pg_dump` 导出生产发布前逻辑备份；
   - **只读检查**生产库是否存在 `isTestData = true`、`slug LIKE 'test-tool-%'`、`slug LIKE 'topic-p3-%'` 或 `slug LIKE 'tut-p3-%'`。由于 `governanceService.ts` 与 `seoRoutes.ts` 已在代码层隔离上述测试数据，**若生产库无需清理或未另行批准 `DELETE`，严禁对生产数据库执行任何删除 SQL**。

---

## 三、标准生产发布步骤（待授权后执行）

1. **本地洁净构建校验**：
   - 确认本地 `public/sitemap.xml` 与 `dist/sitemap.xml` 均不存在；
   - 执行 `npx tsc --noEmit && npm run build`。
2. **代码与前端产物同步**：
   - 使用增量/镜像同步更新远程 `/var/www/softtribe.top/dist/`（务必加上过期文件清理或手动执行 `rm -f /var/www/softtribe.top/dist/sitemap.xml`）；
   - 同步更新 `server/src/modules/seo/seoRoutes.ts`、`server/src/modules/governance/governanceService.ts` 至生产后端目录；
   - 核实生产 `.env` 中 `PUBLIC_SITE_URL=https://softtribe.top` 与 `CLIENT_URL=https://softtribe.top` 正确配置（防止动态 Sitemap XML 内 URL 域名前缀偏移）。
3. **更新 Nginx 并语法验证**：
   - 将 [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf) 的 `location ~* ^/(sitemap(-[a-z0-9-]+)?\.xml|robots\.txt)$` 规则合入 `/etc/nginx/sites-available/softtribe.top.conf`（涵盖 `443` 与 `8080` 两个 `server` 块）；
   - 执行严格语法检查：
     ```bash
     sudo nginx -t
     ```
4. **平滑重载服务**：
   - `nginx -t` 返回 `syntax is ok` 且 `test is successful` 后执行：
     ```bash
     sudo nginx -s reload
     pm2 reload softbuluo-api   # 以生产实际 PM2 进程名为准
     ```

---

## 四、发布后公网验收清单

1. **全站 Sitemap 与 Robots 响应头/正文验证**：
   - 对以下端点逐一执行 `curl -sS -D -`：
     - `https://softtribe.top/sitemap.xml`（必须返回 `200 application/xml`，根节点 `<sitemapindex>`，彻底消除 `soft.example.com`）
     - `https://softtribe.top/sitemap-games.xml`（必须返回 `200 application/xml`，含 `https://softtribe.top/games`、`/game/mindustry`、`/game/supertuxkart`，无 `<!doctype html>`，无 8 款 `DRAFT` 游戏）
     - `https://softtribe.top/sitemap-software.xml`、`/sitemap-categories.xml`、`/sitemap-topics.xml`、`/sitemap-tutorials.xml`、`/sitemap-comparisons.xml`、`/sitemap-developers.xml`、`/sitemap-community.xml`（全部返回 XML）
     - `https://softtribe.top/robots.txt`（返回完整爬虫规则与 9 条 Sitemap 指引）
2. **公网浏览器 CLS 与全站零回归抽检**：
   - 检查 `https://softtribe.top/games` 在 1440px 与 390px 首屏冷加载 CLS `<= 0.05`（预期 `< 0.01`）；
   - 检查 `/`、`/software`、`/system-tools`、`/essentials` 界面外观与核心交互完好。

---

## 五、独立双轨回滚方案

| 回滚情形 | 触发条件 | 执行步骤 | 数据与服务影响 |
| :--- | :--- | :--- | :--- |
| **策略 A：Nginx 独立回滚** | Sitemap/Robots 反代规则意外冲突或缓存异常 | 1. `sudo cp /etc/nginx/sites-available/softtribe.top.conf.bak.p8741 /etc/nginx/sites-available/softtribe.top.conf`<br>2. `sudo nginx -t && sudo nginx -s reload` | 立即恢复原 Nginx 路由配置，不影响运行中 Node 进程与 PostgreSQL 数据 |
| **策略 B：应用代码回滚** | 前端渲染兼容性异常或后端指标接口报错 | 1. 恢复发布前备份的前端 `dist/` 与后端 `server/` 目录；<br>2. 执行 `pm2 reload` 重载后端。 | 零数据库回滚风险（本阶段无 Schema 变更、无业务表数据修改） |
