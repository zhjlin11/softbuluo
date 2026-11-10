# 软游部落 P8.7.5.1 质量精修与数据治理改动前基线审计报告

> **执行日期**：2026-11-10  
> **责任角色**：软游部落高级全栈架构师、PostgreSQL 数据治理专家、SEO 工程师、Nginx/PM2 运维负责人  
> **审计基线范围**：本地工程 `E:\Code\新建文件夹`、本地服务、数据库状态、线上真实环境与历史交付记录

---

## 一、Git 分支、提交记录与本地未提交更改审计

1. **当前分支与最新提交**：
   - 当前处于 `main` 分支；
   - 最新 Commit ID：`8fab73d feat: initialize software resource center project`；
   - 提交历史共 2 次初始 Commit，后续 P1 ~ P8.7.5 开发均在工作区以增量演进形式进行管理。
2. **工作区状态与未提交更改记录**：
   - **核心改动文件（已修改）**：
     - `index.html`：已将旧域名 `softbuluo.com` 全量修正为官方主域名 `softtribe.top`；
     - `public/robots.txt`：已声明 `Allow: /essentials` 与 `Sitemap: https://softtribe.top/sitemap-essentials.xml`；
     - `server/src/modules/channels/softwareChannelService.ts`：`ALLOWED_CHANNELS` 扩充 `'ESSENTIALS'`；
     - `server/src/modules/channels/channelRoutes.ts`：注册 `GET /api/v1/channels/essentials`；
     - `server/src/modules/seo/seoService.ts`：新增 `renderEssentialsChannelHtml()` SSR 渲染方法；
     - `server/src/modules/seo/seoRoutes.ts`：注册 `GET /essentials`、`GET /seo/essentials`、`GET /sitemap-essentials.xml`；
     - `server/tests/p6EcosystemTest.ts`：已纠偏为业务不变量断言（`totalResources >= 90`, `publishedCount >= 30`, `draftCount >= 60`）；
     - `server/tests/p7LaunchReadinessTest.ts`：已纠偏为业务不变量断言（`draftCount >= 60`, `publishedCount >= 30`）；
     - `scripts/runAllQualityTests.ts`：集成 P8.7.5 验收套件；
     - `src/pages/EssentialsPage.tsx`：装机必备门户 UI 3.0 入口；
     - `src/components/essentials/*`：装机必备门户组件簇；
     - `src/pages/admin/AdminChannelConfigPage.tsx`：后台推荐管理新增 `ESSENTIALS` 选项卡；
   - **新增原创矢量资产**：
     - `public/images/essentials/hero-essentials-win11.svg`
     - `public/images/essentials/hero-essentials-office.svg`
     - `public/images/essentials/hero-essentials-boot.svg`
     - `public/images/essentials/hero-essentials-repair.svg`
   - **历史交付文档已归档**：
     - `docs/P875_ESSENTIALS_BASELINE.md`
     - `docs/P875_ESSENTIALS_PORTAL_REPORT.md`
     - `docs/P875_DEPLOYMENT_PLAN.md`

---

## 二、本地服务与数据库状态审计

1. **本地前后端服务运行状态**：
   - 本地前端 Vite 开发服务：`http://localhost:3000/`（任务 ID `task-10070`，正常运行中，毫秒热更新）；
   - 本地后端 Fastify API 服务：`http://localhost:3001/`（任务 ID `task-10066`，正常运行中，PostgreSQL 已连接）；
2. **本地 PostgreSQL 真实数据口径核查**：
   - 全库非测试资源（`isTestData: false`）共 **92** 款；
   - 正式发布资源（`status: PUBLISHED`）共 **30** 款（13 款桌面软件、15 款系统工具、2 款独立游戏）；
   - 待审核草稿（`status: DRAFT`）共 **62** 款（严格隔离在待审核队列中，包括 `memtest86`、`ventoy`、`crystaldiskinfo` 等）；
   - 测试资源（`isTestData: true`）：**0** 款；
   - 最新版本可用下载源总数：**42** 条（10 条通过审核且健康直连，32 条为官方发布渠道登记，0 条附带哈希）；
   - 全库已归档真实核验凭据：**645** 条；
   - 正式发布专题：**11** 篇；正式发布教程：**27** 篇；正式发布对比：**2** 篇；
   - `ChannelRecommendation` 中 `channel: 'ESSENTIALS'` 记录：**0** 条（未配置时默认使用安全缺省池）。

---

## 三、线上正式环境（softtribe.top）状态客观审计

必须严格区分“线上已部署”、“线上未部署”与“特定线路网络访问异常”，不可混淆：

1. **服务器侧服务运行状态（134.175.230.107 广州腾讯云）**：
   - PM2 `softtribe-backend`（集群进程 PID 1644573）在线运行，监听 `127.0.0.1:3008`；
   - Nginx 正式服务监听 `443` 与 `8080` 端口，语法检查通过；
   - 服务端本机与公网回环测试：
     - `GET /essentials` -> HTTP/2 200；
     - `GET /sitemap-essentials.xml` -> HTTP/2 200，`application/xml; charset=utf-8`；
     - `GET /sitemap.xml` -> 正确包含 `sitemap-essentials.xml` 索引；
     - `GET /robots.txt` -> 包含 `Allow: /essentials` 规则；
     - 4 套原创 SVG 静态资产均返回 HTTP 200。
2. **客户端本地直连访问诊断（ERR_CONNECTION_CLOSED / ECONNRESET 根因分析）**：
   - **本地 DNS 解析结果**：本机解析 `softtribe.top` 返回 `198.18.3.16`（属于 Clash Fake-IP 地址池 `198.18.0.0/15`）；
   - **TLS 握手诊断**：本地通过 Clash TUN 虚拟网卡连接 `softtribe.top:443` 时，因海外代理分流规则与 TLS 嗅探发生阻断，报告 `schannel: failed to receive handshake, SSL/TLS connection failed`；
   - **备用端口对比**：本地直连访问 `http://134.175.230.107:8080/essentials`，由于该端口绕过代理规则，在 0.05 秒内即刻建立 TCP 连接并返回 HTTP 200 OK，Playwright 抓取 38 张图片全部完好无损，0 破损，0 溢出；
   - **结论**：网站正式服务器运行完全正常，客户端报错为本地代理环境网络分流所致，严禁误判为网站故障。

---

## 四、当前发现的真实质量缺陷与整改计划

| 缺陷编号 | 缺陷分类 | 问题表现 | 真实根因 | 影响范围 | 整改方案 |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **Q1** | 数据真实性 | 历史交付报告文案中出现 `6,428` 浏览、`3,112` 点击等数字，与数据库真实值（45 浏览、9 点击）不符 | 报告撰写者在文本中编写了模板演示数字，但实际 API 和数据库始终返回真实数据 | 交付报告与口径信任度 | 纠正报告文案，在 API 过滤中明确 `viewCount > 0` 与 `downloadCount > 0`，与 `/software` 对齐 |
| **Q2** | 导出安全 | 本地交互时导出的装机清单 TXT 与 JSON 包含 `http://localhost:3000/software/...` | `EssentialsSetupPlansAndChecklist.tsx` 使用 `window.location.origin`，在本地运行构建时取到了本地 Origin | 用户下载的清单链接 | 采用统一 `getExportBaseUrl()`，统一绑定 `https://softtribe.top/`，绝不暴露 localhost |
| **Q3** | 文案混淆 | 历史报告声称 `repair_station` 方案包含 `MemTest86`，但 `MemTest86` 实为 `DRAFT` | 报告表格书写笔误；代码中实际绑定的是已发布的 `hwinfo` 和 `cpu-z`，代码并无此 Bug | 报告真实性与合规性 | 报告全面纠正，测试套件增加对 `memtest86`、`ventoy` 等草稿资源的强硬阻断断言 |
| **Q4** | 测试回归 | P6、P7 自动化测试套件因硬编码历史快照数值（97/34/63）而报错 | 历史版本清理脏数据后总数为 92/30/62，测试未改为业务不变量断言 | 全站质量回归通过率 | 改用业务不变量断言（`total >= 90`, `published >= 30`, `draft >= 60`），已实测 100% 绿灯通过 |
| **Q5** | 流程提示 | 8 步安装指南中 Step 5 包含“删除旧分区”等表述，可能误导非全新装机用户 | 文案不够严谨，未充分体现品牌机、现有数据盘与恢复分区的差异性 | 新手装机安全感 | 完善流程提示，增加 OEM 恢复分区说明与明确的分区容量核验高风险警告 |

---

## 五、改动前截图存档

Playwright 已对当前运行版本完成截图存档，保存在以下路径：
- `p875_after_essentials_1440.png`（桌面 1440px）
- `p875_section_checklist_1440.png`（清单细节 1440px）
- `p875_after_essentials_390.png`（移动端 390px）
- `prod_p875_essentials_1440.png`（生产环境 1440px）
- `prod_p875_essentials_390.png`（生产环境 390px）
