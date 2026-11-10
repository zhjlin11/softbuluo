# 软游部落 P8.7.3 —— 系统工具频道 UI 3.0 生产上线部署与独立回滚方案

- **当前状态**：**✅ 已获用户授权并同步上线验收通过（`P873_PRODUCTION_SYNCED_AND_VERIFIED`）**
- **目标正式地址**：`https://softtribe.top/system-tools`（生产服务器 `134.175.230.107` / `/var/www/softtribe.top`）
- **实存前置备份**：
  - 生产库全备：`/home/ubuntu/backups/softbuluo_pre_p873_20261110_151154.dump` (`250K`)
  - 源码产物全备：`/home/ubuntu/backups/softtribe_code_pre_p873_20261110_151154.tar.gz` (`16M`)

---

## 一、涉及变更与新增资产清单

### 1.1 新增静态视觉资产
- `public/images/system-tools/{hero-maintenance.svg,hero-disk-health.svg,hero-network-diag.svg,hero-sysinternals.svg,hero-clean.svg,hero-boot-media.svg}`
- 同步产出至 `dist/images/system-tools/`（静态 SVG 文件，无可执行二进制包）。

### 1.2 服务端代码修改与新增
- 新增：`server/src/modules/channels/systemToolsChannelService.ts`
- 修改：
  - `server/src/modules/channels/softwareChannelService.ts`（扩展 `ALLOWED_CHANNELS` 为 `['SOFTWARE', 'SYSTEM_TOOLS']`，导出公共纯函数并强化 `validateChannelTarget`）
  - `server/src/modules/channels/channelRoutes.ts`（新增 `GET /api/v1/channels/system-tools` 与 `SYSTEM_TOOLS` 后台候选过滤）
  - `server/src/modules/resources/resourceRoutes.ts`（修复 `license` 大小写过滤与 `sort=version`，使列表 `sourceVerified` 对齐 `VERIFIED && APPROVED && HEALTHY`）
  - `server/src/modules/seo/seoService.ts` & `seoRoutes.ts`（新增 `GET /system-tools`、`GET /seo/system-tools`、`/sitemap-software.xml` 与 `/robots.txt` 收录）

### 1.3 前端代码修改与新增
- 新增：`src/components/systemTools/{SystemToolsPortalHero,SystemToolsScenarioNavigator,SystemToolsDomainShowcase,SystemToolsEditorialAndUpdates,SystemToolsCatalogSection}.tsx`
- 修改：`src/services/channelService.ts`、`src/components/software/SoftwareLeaderboards.tsx`、`src/pages/SystemToolsPage.tsx`、`src/pages/admin/AdminChannelConfigPage.tsx`、`src/components/admin/AdminLayout.tsx`、`public/robots.txt`

### 1.4 数据库 Schema 与环境变量兼容性
- **数据库 Schema 变更**：**无 Schema 变更**。`ChannelRecommendation` 表在 P8.7.1 上线阶段已建好，本轮直接使用 `channel = 'SYSTEM_TOOLS'` 存储运营配置，零表结构迁移风险。
- **环境变量检查**：确认生产 `.env` 中 `CLIENT_URL="https://softtribe.top"` 及 `.env.production` 中的 `VITE_PUBLIC_SITE_URL="https://softtribe.top"` 配置一致即可，无需新增密钥或修改支付配置。

---

## 二、SEO 影响评估

1. 新增服务端 SSR 路由 `GET /system-tools`（返回完整语义 HTML5、JSON-LD `CollectionPage` 及面包屑结构化数据）。
2. `/system-tools` CSR 与 SSR 均输出独立 `<link rel="canonical" href="https://softtribe.top/system-tools">`，修复旧版误指向根路径问题。
3. `/sitemap-software.xml` 新增 `<loc>https://softtribe.top/system-tools</loc>`，`/robots.txt` 增加 `Allow: /system-tools`。对已有 `/software`、`/software/:slug` 与首页 SEO URL 零改动。

---

## 三、正式上线操作步骤（获单独授权后按序执行）

### 3.1 预发布本地检查
1. 再次确认本地构建干净：`npm run lint && npm run build`（确保 `dist/images/system-tools/*.svg` 完整产出且无 `.exe`/`.zip` 等文件误入 `dist/`）。
2. 打包待上传制品（包含 `dist/`、`public/images/system-tools/`、新增及变更的 `server/src/` 与 `src/` 文件）。

### 3.2 生产前置备份（只读库备份，上线前必做）
```bash
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p /home/ubuntu/backups
docker exec vasto-postgres pg_dump -U vasto_admin -d softbuluo -F c > /home/ubuntu/backups/softbuluo_pre_p873_${TS}.dump
tar --exclude=node_modules --exclude=.git -czf /home/ubuntu/backups/softtribe_code_pre_p873_${TS}.tar.gz -C /var/www/softtribe.top .
ls -lh /home/ubuntu/backups/softbuluo_pre_p873_${TS}.dump /home/ubuntu/backups/softtribe_code_pre_p873_${TS}.tar.gz
```

### 3.3 原子替换与后端平滑重载
1. 将旧 `dist/` 暂存重命名并解压 P8.7.3 部署包至 `/var/www/softtribe.top`（注意保留线上 `.env`、`uploads/` 与 `node_modules/`）。
2. 因为零 Schema 变动，无需执行 `prisma db push`；若需刷新 Prisma Client 缓存可按需运行 `npx prisma generate --schema=server/prisma/schema.prisma`。
3. 重载 PM2 集群进程：
   ```bash
   pm2 reload softtribe-backend --update-env
   ```
4. 本轮不改动 `/etc/nginx/sites-available/softtribe.top.conf`（现已支持 `/images/*.svg` 与 `/api/` 转发）。

---

## 四、代码回滚与数据库恢复分离预案（严格防止误覆盖线上新增数据）

> [!CAUTION]
> **严禁把整库 `pg_restore` 当作常规前端或后端代码回滚手段！** 线上上线期间随时可能产生真实新注册用户、会员订单、下载事件或运营修改，整库恢复会导致上述新增业务数据永久丢失。

### 4.1 常规故障代码回滚（2 分钟内完成，零数据丢失）
如发布后仅出现页面 UI 异常或 `/api/v1/channels/system-tools` 代码 Bug：
1. 从实存前置代码备份恢复应用目录与静态构建产物（保留 `.env` 与 `uploads/`）：
   ```bash
   cd /var/www/softtribe.top
   mv dist /tmp/dist_failed_p873
   tar -xzf /home/ubuntu/backups/softtribe_code_pre_p873_20261110_151154.tar.gz -C /var/www/softtribe.top
   rm -rf /tmp/dist_failed_p873
   ```
2. 重载后端服务：
   ```bash
   pm2 reload softtribe-backend --update-env
   ```
3. **数据库无需恢复**：若已在后台为 `SYSTEM_TOOLS` 录入过新推荐行，旧版本代码完全不读取 `channel = 'SYSTEM_TOOLS'` 记录，也不会破坏既有表结构。如确需清理测试性配置，仅限定向执行局部只删该频道记录：
   `DELETE FROM "ChannelRecommendation" WHERE channel = 'SYSTEM_TOOLS';`（绝对禁止整库回退）。

### 4.2 极端数据库灾备恢复（仅限不可逆数据损坏场景）
仅当确认数据库本身发生非代码引起的严重结构/数据污染且获得负责人书面确认时，先导出部署窗口后新增的真实业务表差异再评估执行：
```bash
docker exec -i vasto-postgres pg_restore -U vasto_admin -d softbuluo --clean --if-exists < /home/ubuntu/backups/softbuluo_pre_p873_${TS}.dump
```

---

## 五、线上上线后健康验收清单（只读验证）

1. **接口与数据库连通**：
   - `curl -fsS https://softtribe.top/api/v1/health` 返回 `HEALTHY` (`CONNECTED`)；
   - `curl -fsS https://softtribe.top/api/v1/channels/system-tools` 返回真实工具数、`scenarios` 与 `heroSlides`；
   - `curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3008/system-tools` 返回 `200`。
2. **SEO 与静态资源可达性**：
   - `curl -fsS https://softtribe.top/images/system-tools/hero-maintenance.svg | head -n 1` 包含 `width="960" height="540"`；
   - 核查 `https://softtribe.top/sitemap-software.xml` 与 `https://softtribe.top/robots.txt` 已含 `/system-tools`。
3. **真实无痕浏览器巡检**：
   - 打开 `https://softtribe.top/system-tools`（桌面 1440px 与手机 390px），核查 `<h1>`、6 大场景交互、真实低样本排行榜、0 破损图、0 横向溢出与 0 JS 报错；
   - 回查 `https://softtribe.top/` 首页与 `https://softtribe.top/software` 均完全正常无回归。
