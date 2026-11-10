# 软游部落 P8.7.5 装机必备频道 UI 3.0 生产环境部署方案

> 文档版本：P8.7.5-PROD-PLAN-1.0  
> 责任团队：软游部落高级全栈工程师、Nginx 运维工程师、数据库工程师、安全审计组  
> 当前状态：本地已全量验证，**严格等待用户单独授权后方可执行生产部署**（严禁擅自连接生产服务器或修改线上配置）

---

## 一、部署背景与目标

本方案针对软游部落顶部主导航第四个独立频道——**装机必备（`/essentials`）**的 UI 3.0 门户化升级，提供无缝、低风险、零停机上线的标准化部署指南。

### 核心变更清单
1. **前端门户页面与交互组件**：
   - `src/pages/EssentialsPage.tsx`
   - `src/components/essentials/EssentialsPortalHero.tsx`
   - `src/components/essentials/EssentialsSetupPlansAndChecklist.tsx`
   - `src/components/essentials/EssentialsWorkflowAndToolbox.tsx`
   - `src/components/essentials/EssentialsCategoriesAndDiscovery.tsx`
   - `src/components/essentials/EssentialsCatalogSection.tsx`
   - `src/services/channelService.ts`（装机必备聚合接口 DTO 与请求方法）
   - `src/pages/admin/AdminChannelConfigPage.tsx`（新增 `ESSENTIALS` 频道的运营推荐配置后台）
2. **原创高保真技术矢量资产**：
   - `public/images/essentials/hero-essentials-win11.svg`
   - `public/images/essentials/hero-essentials-office.svg`
   - `public/images/essentials/hero-essentials-boot.svg`
   - `public/images/essentials/hero-essentials-repair.svg`
3. **后端聚合接口与管理能力**：
   - `server/src/modules/channels/softwareChannelService.ts`（`ALLOWED_CHANNELS` 扩充 `'ESSENTIALS'`）
   - `server/src/modules/channels/essentialsChannelService.ts`（新增装机必备频道聚合服务，28款公开非游戏软件池，4张大图轮播，8款装机常用工具，6套场景装机方案，8步正版系统部署指南，6组维修工具箱，7个去重分类展架）
   - `server/src/modules/channels/channelRoutes.ts`（注册 `GET /api/v1/channels/essentials` 路由）
4. **SEO、Sitemap 与 Robots**：
   - `server/src/modules/seo/seoService.ts`（新增 `renderEssentialsChannelHtml()` SSR 渲染，含独立 H1、Canonical 与 `CollectionPage` + `ItemList` + `BreadcrumbList` 结构化数据）
   - `server/src/modules/seo/seoRoutes.ts`（注册 `GET /essentials`、`GET /seo/essentials`、`GET /sitemap-essentials.xml`，更新 `sitemap.xml` 索引）
   - `public/robots.txt`（声明 `Allow: /essentials` 与 `Sitemap: https://softtribe.top/sitemap-essentials.xml`）
5. **自动化质量保障套件**：
   - `server/tests/p875EssentialsPortalTest.ts`（10 项全自动闭环接口、权限边界与 SSR 校验）
   - `scripts/runAllQualityTests.ts`（集成 P8.7.5 入 19 套全站回归套件）

---

## 二、数据库结构与数据迁移评估

1. **数据库表结构（Schema）**：
   - **零 Schema 变更**。现有 `Software`、`Category`、`DownloadSource`、`Topic`、`Tutorial`、`Comparison`、`ChannelRecommendation` 表完全满足装机必备频道聚合需求。
   - 不需要执行 `prisma migrate deploy` 或任何 DDL 语句。
2. **生产数据写入评估**：
   - 不需要向生产数据库强制插入假数据或测试数据。
   - 装机必备频道默认从生产现有 `PUBLISHED` 且 `isTestData: false` 的桌面软件与系统工具池中动态聚合，自动剔除 `GAME` 资源。
   - `ChannelRecommendation` 支持管理后台按需运营精选（可选），未配置时自动降级采用安全默认映射。

---

## 三、生产 Nginx 与反向代理适配性核查

现有生产 Nginx 配置（`nginx.conf`）已经针对 `sitemap-*.xml` 及动态 SSR 路由建立了正则反代策略：
- **静态资源路由**：`/images/essentials/` 随前端 Vite `dist/` 产物由 Nginx 静态托管（设置 `expires 30d; add_header Cache-Control "public, no-transform";`）。
- **Sitemap 路由**：`location ~ ^/sitemap(-[a-z0-9-]+)?\.xml$ { proxy_pass http://127.0.0.1:3001; }`，自动覆盖 `sitemap-essentials.xml`，无需重启或修改 Nginx 规则。
- **SSR 爬虫路由**：`location = /essentials` 与 `location = /seo/essentials` 均按已有爬虫 UA 检测规则透明反代至后端 Fastify `3001` 端口，普通浏览器直接返回 SPA `index.html`。

---

## 四、生产发布标准操作流程（SOP）

> **前置条件**：必须先获取用户明确的书面发布授权。

### 阶段 1：生产环境当前快照备份
```bash
# 1. 登录生产服务器 (134.175.230.107)
ssh root@134.175.230.107

# 2. 创建本次发布备份工作区
BACKUP_DIR="/data/backup/softtribe_pre_p875_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 3. 生产 PostgreSQL 数据库快照备份
pg_dump -U postgres -d softbuluo -Fc -f "$BACKUP_DIR/softbuluo_db.dump"

# 4. 当前代码与前端静态产物备份
cp -r /data/softtribe/dist "$BACKUP_DIR/dist_backup"
cp -r /data/softtribe/server "$BACKUP_DIR/server_backup"
```

### 阶段 2：代码同步与静态构建
```bash
# 1. 本地打包最新前端静态产物
npm run build

# 2. 将前端构建产物与后端更新文件同步至生产服务器
rsync -avz --delete dist/ root@134.175.230.107:/data/softtribe/dist/
rsync -avz public/images/essentials/ root@134.175.230.107:/data/softtribe/public/images/essentials/
rsync -avz server/src/ root@134.175.230.107:/data/softtribe/server/src/
rsync -avz server/tests/ root@134.175.230.107:/data/softtribe/server/tests/
rsync -avz public/robots.txt root@134.175.230.107:/data/softtribe/dist/robots.txt
```

### 阶段 3：后端服务无缝热重载
```bash
# 在生产服务器执行：
cd /data/softtribe
npm run build:server || true # 若采用 tsx 则直接热重启 pm2

# 平滑重载 Fastify 进程
pm2 reload softtribe-server --update-env

# 检查 PM2 日志确认启动成功
pm2 status
pm2 logs softtribe-server --lines 30 --nostream
```

### 阶段 4：生产发布后在线验收清单（Smoke Test）
1. `curl -I https://softtribe.top/essentials` -> HTTP 200。
2. `curl -A "Baiduspider" https://softtribe.top/essentials | grep -q "新电脑装机与必备软件中心"` -> 命中 SSR H1。
3. `curl -I https://softtribe.top/sitemap-essentials.xml` -> HTTP 200，`Content-Type: application/xml`。
4. `curl https://softtribe.top/sitemap.xml | grep -q "sitemap-essentials.xml"` -> 命中主索引。
5. `curl https://softtribe.top/robots.txt | grep -q "/sitemap-essentials.xml"` -> 规则存在。
6. 检查 4 个原创 Banner SVG 可达性：
   - `curl -I https://softtribe.top/images/essentials/hero-essentials-win11.svg` -> HTTP 200。
   - `curl -I https://softtribe.top/images/essentials/hero-essentials-office.svg` -> HTTP 200。
   - `curl -I https://softtribe.top/images/essentials/hero-essentials-boot.svg` -> HTTP 200。
   - `curl -I https://softtribe.top/images/essentials/hero-essentials-repair.svg` -> HTTP 200。
7. 既有核心频道回访问责：
   - `curl -I https://softtribe.top/` -> HTTP 200。
   - `curl -I https://softtribe.top/software` -> HTTP 200。
   - `curl -I https://softtribe.top/system-tools` -> HTTP 200。
   - `curl -I https://softtribe.top/games` -> HTTP 200。

---

## 五、严格回滚方案（代码回滚与数据库回滚严格分离）

### 1. 代码回滚方案（不触碰生产数据库）
若生产出现前端白屏、样式异常或接口异常，执行代码即刻回滚：
```bash
# 1. 还原前端静态目录与后端源码
cp -r "$BACKUP_DIR/dist_backup"/* /data/softtribe/dist/
cp -r "$BACKUP_DIR/server_backup"/* /data/softtribe/server/

# 2. 重载后端进程
pm2 reload softtribe-server --update-env

# 3. 验证回滚状态
curl -I https://softtribe.top/essentials
```
> **注意**：由于本次上线未做任何 DB 结构修改，代码回滚期间数据库保持在线，会员购买与用户操作数据完全不受影响。

### 2. 数据库灾难恢复方案（仅限数据污染时执行）
若且仅当生产数据库发生不可逆数据篡改或误操作时，方可启动：
```bash
# 停止后端服务写入
pm2 stop softtribe-server

# 执行恢复
pg_restore -U postgres -d softbuluo --clean --if-exists "$BACKUP_DIR/softbuluo_db.dump"

# 重新启动后端服务
pm2 start softtribe-server
```
