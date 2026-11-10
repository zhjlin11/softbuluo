# 软游部落 P8.7.4.1 —— 生产环境部署与公网验收报告

> **发布时间**：2026-11-10 17:04 (UTC+8)
> **发布环境**：`https://softtribe.top/`（`ubuntu@134.175.230.107`，`/var/www/softtribe.top`）
> **部署结论**：**生产发布与公网全链路验收通过**（零数据库结构变更、零业务数据写入/删除、全站 9 条 Sitemap XML 与 Robots 生效、游戏中心公网 CLS `0.0000–0.0006`）

---

## 一、发布前安全备份凭证

在任何文件覆盖或服务重载之前，已在生产服务器 `/home/ubuntu/backups/` 生成三项独立备份：

| 备份类型 | 远程备份路径 | 文件大小 | 说明 |
| :--- | :--- | :--- | :--- |
| PostgreSQL 逻辑快照 | `/home/ubuntu/backups/softbuluo_pre_p8741_20261110_165917.dump` | `250K` | `pg_dump -F c` 完整发布前数据库底线 |
| 代码与构建快照 | `/home/ubuntu/backups/softtribe_code_pre_p8741_20261110_165917.tar.gz` | `21M` | 发布前 `/var/www/softtribe.top/` 完整代码与 `dist/` 归档 |
| Nginx 配置快照 | `/home/ubuntu/backups/softtribe.top.conf.pre_p8741_20261110_165917` | `5.4K` | 修改前 `/etc/nginx/sites-available/softtribe.top.conf` 原件 |

---

## 二、生产发布执行摘要

1. **洁净打包与原子目录替换**：
   - 本地执行 `npx tsc --noEmit` 与 `npm run build`（1,771 模块，`8.35s`），确认 `public/sitemap.xml` 与 `dist/sitemap.xml` 均不存在、无违规可执行文件后打包 `p8741_deploy_payload.tar.gz`（`14,441,007` 字节）并上传至生产主机。
   - 原子移走旧 `dist/` 目录并解压新产物，彻底清除远程遗留 `dist/sitemap.xml`（`957` 字节 `soft.example.com` 旧文件）与 `public/sitemap.xml`。
2. **Nginx 语法安全更新与平滑重载**：
   - 将 CRLF 转 LF 清洗后的 [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf) 合入 `/etc/nginx/sites-available/softtribe.top.conf`（仅在 `443` 与 `8080` 两个 `server` 块新增 `location ~* ^/(sitemap(-[a-z0-9-]+)?\.xml|robots\.txt)$` 反代至 `http://127.0.0.1:3008`）。
   - 执行 `sudo nginx -t`（输出 `syntax is ok` / `test is successful`）后执行 `sudo nginx -s reload`。
3. **后端服务平滑重载与零库改约束**：
   - 执行 `pm2 reload softtribe-backend --update-env`，进程 `online`，`http://127.0.0.1:3008/api/v1/health` 返回 `HEALTHY` / `database: CONNECTED`。
   - **生产数据库零写入验证**：发布前后只读查询均严格为 `total_sw: 123`（`isTestData=true: 30`、`pub_nontest: 30`、`draft_nontest: 63`、`pub_games: 2`、`draft_games: 8`），未在生产库执行任何 `DELETE`/`UPDATE`。

---

## 三、公网全链路验收实测

### 3.1 公网 Sitemap XML 与 Robots 响应检查（`https://softtribe.top` 与 `http://134.175.230.107:8080`）

| 端点路径 | HTTP 状态 | Content-Type | 响应字节 | 是否 HTML 回退 | 是否含测试/假域名泄漏 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/sitemap.xml` | `200` | `application/xml; charset=utf-8` | `1061` | 否 | 否（`<sitemapindex>` 8 张子表） |
| `/sitemap-games.xml` | `200` | `application/xml; charset=utf-8` | `609` | 否 | 否（仅 `/games`、`/game/supertuxkart`、`/game/mindustry`） |
| `/sitemap-software.xml` | `200` | `application/xml; charset=utf-8` | `9967` | 否 | 否 |
| `/sitemap-categories.xml` | `200` | `application/xml; charset=utf-8` | `1804` | 否 | 否 |
| `/sitemap-topics.xml` | `200` | `application/xml; charset=utf-8` | `2176` | 否 | 否（已排除 `topic-p3-`） |
| `/sitemap-tutorials.xml` | `200` | `application/xml; charset=utf-8` | `5464` | 否 | 否（已排除 `tut-p3-`） |
| `/sitemap-comparisons.xml` | `200` | `application/xml; charset=utf-8` | `625` | 否 | 否 |
| `/sitemap-developers.xml` | `200` | `application/xml; charset=utf-8` | `109` | 否 | 否 |
| `/sitemap-community.xml` | `200` | `application/xml; charset=utf-8` | `109` | 否 | 否 |
| `/robots.txt` | `200` | `text/plain; charset=utf-8` | `967` | 否 | 否（含完整 Allow/Disallow 与 9 条 Sitemap） |

> 备用 `http://134.175.230.107:8080` 端口从外部客户端实测上述全部 10 个 SEO 端点与 `/api/v1/health` 均同样返回 `200` 及正确 MIME 类型。

### 3.2 公网游戏中心 CLS 与真实浏览器验收（`https://softtribe.top/games`）

- **服务端 Chrome + Playwright 多视口实测**：
  - `1440x900` 亮色：CLS **`0.0006`**（重载 `0.0000`，`overflowX: false`，`pageErrors: []`）
  - `1440x900` 深色：CLS **`0.0000`**（`overflowX: false`）
  - `1280x800`：CLS **`0.0000`**
  - `1024x768`：CLS **`0.0002`**
  - `768x1024`：CLS **`0.0000`**
  - `430x932`：CLS **`0.0003`**
  - `390x844` 手机端：CLS **`0.0000`**（重载 `0.0000`）
  - 站内导航 `/` → `/games`：CLS **`0.0000`**
- **外部客户端 Chrome 对 `https://softtribe.top/games`（1440x900）实测**：
  - `canonical`: `https://softtribe.top/games`
  - `h1`: `精品独立与开源 PC 游戏中心`
  - `cls`: **`0.0006`**，`imgs`: `18`，`brokenImgs`: **`0`**，`overflowX: false`
- **公网 9 大公开路由零报错验证**：`/`、`/software`、`/system-tools`、`/games`、`/essentials`、`/compare`、`/community`、`/tutorials`、`/updates` 全部 HTTP `200`、`overflowX: false`、`errs: []`；其中除 `/`（首屏未滚动触发懒加载图）外其余 8 条路由均为 `brokenImgs: 0`。
- **生产截图留档**：`prod_p8741_games_1440.png`、`prod_p8741_games_390.png`、`prod_p8741_sitemap_games.png` 已下载归档并经视觉核验确认。

### 3.3 生产数据治理（P5）与频道保护验证

- 直接调用生产运行时 `governanceService.getGovernanceMetrics()` 返回：
  - `totalResources`: `93`（`publishedCount: 30`、`draftCount: 63` — 自动隔离 30 条 `isTestData: true`）
  - `verifiedCompleteCount`: `84` → **`completenessRate: 90%`**（高于 `65%` 达标线）
  - `linkHealthRate`: `100%`、`sourceVerificationRate`: `100%`
- 频道与数据保护边界实测：
  - `/api/v1/channels/games`：`totalGamesCount: 2`（`supertuxkart`、`mindustry`），`draftQueueCount: 8`，`companionTools: ["vlc", "obs-studio"]`；
  - `/api/v1/channels/software`（`totalSoftwareCount: 28`）与 `/api/v1/channels/system-tools`（`totalToolsCount: 15`）完好保真。

---

## 四、快速独立回滚指令

- **仅回滚 Nginx 配置**：
  ```bash
  sudo cp /home/ubuntu/backups/softtribe.top.conf.pre_p8741_20261110_165917 /etc/nginx/sites-available/softtribe.top.conf
  sudo nginx -t && sudo nginx -s reload
  ```
- **仅回滚前后端代码产物**：
  ```bash
  tar -xzf /home/ubuntu/backups/softtribe_code_pre_p8741_20261110_165917.tar.gz -C /var/www/softtribe.top
  pm2 reload softtribe-backend --update-env
  ```
- 因本次未修改任何数据库表结构与数据行，回滚时**无需恢复数据库**。
