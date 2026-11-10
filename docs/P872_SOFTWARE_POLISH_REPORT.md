# 软游部落 P8.7.2 —— 电脑软件频道质量精修与真实性整改交付报告

- **当前交付状态**：**`P872_PRODUCTION_SYNCED_AND_VERIFIED`**（已完成本地全量验收并获用户授权部署上线至 `https://softtribe.top/`，前置生产库与源码全备、数据治理与公网真浏览器验收全部通过）
- **生产部署隔离与备份凭证**：
  - **目标环境**：`134.175.230.107` (`/var/www/softtribe.top`)，PM2 进程 `softtribe-backend` (`cluster`, port `3008`)
  - **前置数据库全备**：`/home/ubuntu/backups/softbuluo_pre_p872_20261110_143514.dump` (`249K`, PostgreSQL 15 Docker `vasto-postgres`)
  - **前置源码/产物全备**：`/home/ubuntu/backups/softtribe_code_pre_p872_20261110_143514.tar.gz` (`15M`)

---

## 一、整改边界与生产安全核查

1. **严格守住重构边界**：未重做电脑软件频道整体结构，保留全部既有模块（紧凑头部、分类快捷键、焦点轮播、本周热推、热门领域导航、编辑精选、双榜排行、分类软件专区与筛选器、软件专题、教程与评测、最近更新双栏）。
2. **跨模块零污染**：未修改全站首页（`/`）、首页 Hero、`SiteHeader` 外观样式与 Logo、游戏中心、系统工具、装机必备、社区交流、软件教程、最新更新及软件详情页核心布局，未改动会员价格体系与微信支付核心流程。
3. **不删库直接审计留痕**：所有未验证第三方文件托管来源均采用停用标记（`isActive: false`, `verificationStatus: PENDING`），历史记录与操作日志（`AuditLog` action: `P872_CONTENT_AND_SOURCE_GOVERNANCE`）完整保留可追溯。

---

## 二、P1 来源与认证真实性整改

### 2.1 移除第三方镜像“官方认证”等虚假声明
经审计发现，本地与线上历史数据中存在将第三方聚合站表述为“Massgrave 官方认证 / 校验”及宣称“全站原厂哈希已校验”的失实文案。通过执行 [applyP872Remediation.ts](file:///E:/Code/新建文件夹/scripts/applyP872Remediation.ts) 与服务端代码修正，已完成以下本地数据整改：
- **专题整改**：修正专题 [genuine-microsoft-installation-media](file:///E:/Code/新建文件夹/scripts/applyP872Remediation.ts#L34-L70) 标题为 **《Windows 与 Office 安装资源及原版镜像校验指南》**，同步更新专题简介、SEO 元数据及其 **10 条**关联软件备注（`TopicResource.customNote`），去除“Massgrave官方认证/校验”字样并补充“商业软件需自备合法使用许可”。
- **软件条目整改**：更新 `windows-11`、`windows-10`、`windows-ltsc`、`windows-server`、`windows-7`、`office-2024`、`office-2021`、`office-mac`、`microsoft-365` 与 `ab-download-manager` 共 **10 款**软件的 `summary` 与 `description`，明确区分官方下载渠道指引与商业使用授权。
- **教程整改**：更新 `how-to-verify-genuine-iso-checksums`，移除虚假认证表述，保留微软官方页面、PowerShell `Get-FileHash` 与 `CertUtil` 实用 SHA-256 校验方法。

### 2.2 安全停用未验证第三方网盘来源
- 将 `DownloadSource` 中指向 `zerofs.link` 与 `buzzheavier.com` 的 **14 条**未获原厂授权证明且缺少实测 SHA-256 的第三方网盘记录统一置为 `isActive: false`、`verificationStatus: 'PENDING'`，并在 `sourceName` / `reviewNotes` 中如实写明停用原因；未删除任何历史行，保证历史下载审计可查。

---

## 三、P2 来源统计口径精准化与卡片诚信标示

1. **后台多维度口径拆分**（[softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts)）：
   - `meta.registeredSourcesCount`（本轮实测本地值 `80`，含基础 `79` 条及回归套件 P3 测试写入 `vscode` 的 `1` 条待审提案）：已登记且生效的桌面软件可用来源总数；
   - `meta.approvedHealthySourcesCount` / `meta.verifiedSourcesCount`（实测 `16`）：同时满足 `verificationStatus === 'VERIFIED'`、`reviewStatus === 'APPROVED'` 且 `lastCheckStatus === 'HEALTHY'` 的高可信直连渠道数；
   - `meta.pendingSourcesCount`（实测 `64`）：已登记但仍待人工终审/最近巡检的来源数；
   - `meta.sha256VerifiedCount`（实测 `0`）：当前数据库内关联已落库文件实体 SHA-256 的直连源数，如实暴露为 `0` 不做虚假宣传。
2. **频道头与卡片诚信 UI**（[SoftwarePortalHero.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwarePortalHero.tsx)、[SoftwareCompactCard.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareCompactCard.tsx)、[SoftwareCategoryShowcase.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareCategoryShowcase.tsx)）：
   - 顶部徽章展示：`收录 28 款 · 80 条已登记源（16 条已审核直连）`；
   - `SoftwareCompactCard` 仅当 `item.hasVerifiedSource === true` 时展示绿色 `ShieldCheck`（「含人工审核且近期巡检健康的直连/官网下载源」），否则显示中性灰阶 **「登记渠道」** 标签；同时修正 `SoftwareCategoryShowcase` 此前在筛选模式下硬编码 `hasVerifiedSource: true` 的隐患，改为读取 `Boolean(item.sourceVerified)`。

---

## 四、P2 模块去重与同系列限流

1. **本周热推 vs 编辑精选零重叠**：
   - 在 [softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts) 中引入 `pickChannelSoftwares` 槽位去重与家族计数 `getProductFamilyKey`；
   - **本周热推（8 款，4×2 网格）**：`vscode, chrome, windows-11, 7zip, office-2024, everything, sublime-text, diskgenius`；
   - **编辑精选（8 款，排除上述 8 款）**：`windows-10, microsoft-365, vlc, wireshark, git, ab-download-manager, cpu-z, libreoffice`；
   - 两模块间实测 **0 交集**，且每槽位内 `windows-*` 与 `office-*/microsoft-365` 同系列各自严格上限 **1 款**。
2. **分类区块预览收口**：每个分类默认展示最多 **4 款**不重复代表软件，操作文案升级为 `查看本类全部 X 款 >` 引导全量筛选。

---

## 五、P2 排行榜真实性与低流量自适应（`< 5` 条不凑数）

1. **后端零填充策略**（[softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts)）：`mostViewed` 与 `mostDownloaded` 分别严格过滤 `viewCount > 0` 与 `downloadCount > 0`（基于 `isTestEvent: false` 真实事件统计），严禁把 0 点击软件塞入榜单凑足 10 项。
2. **前端动态标题与口径透明化**（[SoftwareLeaderboards.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareLeaderboards.tsx)）：
   - 彻底删除旧版 **「待累积」** 占位文案；
   - 当真实记录数 `< 5` 时（如线上生产当前仅 2 条非零下载点击），标题与右侧徽章自动切换为 **「近期下载点击动态」 / 「实有 N 条记录」**，不硬标 `TOP 10`；`>= 5` 时显示实际数量 `TOP N`（本地目前有 >= 10 款非零浏览与非零触发记录）；
   - 明确标注副标题区别：**「站内详情页真实浏览次数（非下载数）」** 与 **「站内非测试下载触发事件数（非实际安装包传输完成数）」**。

---

## 六、P2 官方软件图标落盘与暗黑模式对比度修正

1. **开源软件真实图标落盘**（[public/logo/software/](file:///E:/Code/新建文件夹/public/logo/software)）：已从上游官网/GitHub/GitLab 仓库下载并视觉逐个校验 9 枚高清图标：`7zip.png`、`filezilla.ico`、`rufus.png`、`blender.svg`、`vlc.png`、`git.png`、`obs-studio.png`、`libreoffice.ico`、`wireshark.png`；淘汰并删除了先前误收的宽幅横幅或模糊 `.ico`（`peazip.ico`、`ab-download-manager.ico`）。
2. **非开源专有套件合规徽章**（[officialLogos.tsx](file:///E:/Code/新建文件夹/src/components/common/officialLogos.tsx)、[softwareName.ts](file:///E:/Code/新建文件夹/src/utils/softwareName.ts)）：为 `Office 2024 / 2021 / Microsoft 365 / Office for Mac` 与 `CPU-Z` 升级辨识度良好的规范英文与型号分级徽章（未伪造微软等原厂注册商标），并完善 `Windows LTSC` 简称正则匹配。
3. **暗黑模式深色图标可读性修复**（[SoftwareIcon.tsx](file:///E:/Code/新建文件夹/src/components/common/SoftwareIcon.tsx)）：在图标容器 `<img>` 外框补充 `bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-700`，并移除微小图标上的 `loading="lazy"` 避免首屏漏加载；Playwright 暗黑模式实测图标底框背景 `oklch(0.968 0.007 247.896)`，无破损图（`brokenImgs: 0`）。

---

## 七、P3 焦点 Hero 排版与 768px 响应式修复

- 优化 [conciseHeroText](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts#L175-L189)，取消英文空格粗暴切分与半词截断（彻底解决 `SHA-2…`、`Windows 与 Office…` 问题），首张焦点卡片完整显示 **《Windows 与 Office 安装资源及原版镜像校验指南》**。
- 修复真浏览器验收过程中新发现的 `768px` 平板断点问题：[SoftwarePortalHero.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwarePortalHero.tsx#L84-L106) 头部由 `md:flex-row` 调整为 `xl:flex-row` 并为 `<h1>` 增加 `whitespace-nowrap`，防止统计胶囊在 `768px` 下把「电脑软件频道」标题竖向挤折。

---

## 八、P3 未登录 `/api/v1/members/me` 401 防护与零刷屏优化

- 保留后端 `GET /api/v1/members/me` 未授权返回 `401 Unauthorized` 安全基线。
- 改造 [commerceService.ts](file:///E:/Code/新建文件夹/src/services/commerceService.ts)（在登录/注册/退出成功时派发 `softtribe-auth-updated` 自定义事件）与 [SiteHeader.tsx](file:///E:/Code/新建文件夹/src/components/layout/SiteHeader.tsx)（将 `useEffect` 依赖从 `[location.pathname]` 改为首屏单次挂载 `[]` + 事件监听）。
- **Playwright 实测验证**：游客状态在站内进行 SPA 路由跳转（`/software` -> `/software/7zip` -> `/compare` -> `/software`）期间，`/api/v1/members/me` 额外触发次数实测为 **`0`**，无控制台页面报错、无错误提示框闪烁。

---

## 九、CSR 与 SSR SEO 元数据同步

- 同步前端 [SoftwarePage.tsx](file:///E:/Code/新建文件夹/src/pages/SoftwarePage.tsx) `applyChannelSeoMeta` 与后端 [seoService.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoService.ts#L678-L770) `renderSoftwareChannelHtml()`：
  - 统一标题：`电脑软件频道 - 开源与常用桌面软件发布渠道汇总 - 软游部落`
  - 统一描述与 `<link rel="canonical" href="https://softtribe.top/software">`，完整反映已登记来源、审核直连数及商业软件正版授权提示。

---

## 十、本轮 P8.7.2 本地文件变更清单

### 新增资产、测试与脚本
- `public/logo/software/{7zip.png,filezilla.ico,rufus.png,blender.svg,vlc.png,git.png,obs-studio.png,libreoffice.ico,wireshark.png}`
- [scripts/applyP872Remediation.ts](file:///E:/Code/新建文件夹/scripts/applyP872Remediation.ts)
- [server/tests/p872SoftwarePolishTest.ts](file:///E:/Code/新建文件夹/server/tests/p872SoftwarePolishTest.ts)
- [docs/P872_SOFTWARE_POLISH_REPORT.md](file:///E:/Code/新建文件夹/docs/P872_SOFTWARE_POLISH_REPORT.md)

### 修改文件
- 后端与测试集：
  - [server/src/modules/channels/softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts)
  - [server/src/modules/seo/seoService.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoService.ts)
  - [scripts/runAllQualityTests.ts](file:///E:/Code/新建文件夹/scripts/runAllQualityTests.ts)
- 前端频道、组件与服务：
  - [src/services/channelService.ts](file:///E:/Code/新建文件夹/src/services/channelService.ts)
  - [src/services/commerceService.ts](file:///E:/Code/新建文件夹/src/services/commerceService.ts)
  - [src/utils/softwareName.ts](file:///E:/Code/新建文件夹/src/utils/softwareName.ts)
  - [src/components/common/SoftwareIcon.tsx](file:///E:/Code/新建文件夹/src/components/common/SoftwareIcon.tsx)
  - [src/components/common/officialLogos.tsx](file:///E:/Code/新建文件夹/src/components/common/officialLogos.tsx)
  - [src/components/layout/SiteHeader.tsx](file:///E:/Code/新建文件夹/src/components/layout/SiteHeader.tsx)
  - [src/components/software/SoftwarePortalHero.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwarePortalHero.tsx)
  - [src/components/software/SoftwareCompactCard.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareCompactCard.tsx)
  - [src/components/software/SoftwareCategoryShowcase.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareCategoryShowcase.tsx)
  - [src/components/software/SoftwareLeaderboards.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareLeaderboards.tsx)
  - [src/components/software/SoftwareEditorialExtras.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareEditorialExtras.tsx)
  - [src/pages/SoftwarePage.tsx](file:///E:/Code/新建文件夹/src/pages/SoftwarePage.tsx)

---

## 十一、本地实测验证结果

### 11.1 编译与构建
- `npm run lint` (`tsc --noEmit`)：**0 错误通过**
- `npm run build` (`vite build`)：**865ms 成功构建全部生产 Chunk**

### 11.2 全阶段自动化回归测试 (`npx tsx scripts/runAllQualityTests.ts`)
- **总计 15 个套件全部通过：478 项通过 | 0 项失败**：
  - `P1 基础能力与接口`：20 / 20
  - `P2 商业化与会员`：25 / 25
  - `P2.1 支付与安全加固`：31 / 31
  - `P3 自动化运营与监控`：45 / 45
  - `P3.1 生产运维与安全整改`：21 / 21
  - `P4 增长与评测`：40 / 40
  - `P5 规模化与数据治理`：45 / 45
  - `P6 开发者与开放生态`：65 / 65
  - `P7 正式上线验收`：62 / 62
  - `P8 生产隔离与阻断整改`：34 / 34
  - `P8.5 全站体检与内测准备`：16 / 16
  - `P8.7 全站独立栏目与专题中心`：15 / 15
  - `P8.7.1 电脑软件频道 UI 3.0`：15 / 15
  - **`P8.7.2 电脑软件频道质量精修`：12 / 12**
  - `P8.8 软件一键直链下载系统`：32 / 32

### 11.3 Playwright 真实 Chromium 多视口验收
- **桌面 1440×900（浅色/深色）**：HTTP 200、33 张图片全部正常加载（`brokenImgs: []`）、暗黑模式图标衬底对比度正常（`oklch(0.968 0.007 247.896)`）、零误导词、零重叠（本周热推 8 款与编辑精选 8 款 0 交集）、Hero 轮播切换及「开源软件」筛选重置交互正常、`pageerror: []`。
- **低样本榜单（`< 5` 条模拟测试）**：模拟生产仅 2 条非零下载记录响应时，正确渲染 **「近期下载点击动态」** 与 **「实有 2 条记录」**，`待累积` 与 `近期下载点击 TOP` 均不出现（`false`）。
- **SPA 路由与详情闭环**：点击进入 `/software/7zip` 详情页正常显示「立即下载」入口（安全停留在链接核验，未触发下载执行），跨 `/software/7zip` -> `/compare` -> `/software` 跳转期间 `/api/v1/members/me` 新增 401 请求数 = `0`。
- **全尺寸无横向溢出**：`1440px` (`1440/1440`)、`1024px` (`1024/1024`)、`768px` (`768/768`)、`430px` (`430/430`)、`390px` (`390/390`) 均无横向滚动条；首页 `/` 保留完整且无溢出。

### 11.4 验收截图清单（Artifact 目录）
- `p872_after_hero_1440.png`（1440px 首屏与精简 Hero、4×2 热推）
- `p872_after_1440.png`（1440px 全页截图）
- `p872_after_dark_1440.png`（1440px 暗黑模式全页与图标衬底对比度）
- `p872_after_768.png`（768px 平板响应式修复后全页）
- `p872_after_390.png`（390px 手机端响应式全页）
- `p872_homepage_preserved.png`（首页毫发无损回归证明）

---

## 十二、已获授权生产上线部署与公网实测验证记录（`https://softtribe.top/`）

> [!NOTE]
> 在收到明确部署指令后，已按 **前置全量备份 → 原子替换构建产物与服务端源码 → 执行合规治理脚本 → PM2 零中断重载 → 公网 HTTPS Playwright 验收** 完成上线。

### 12.1 线上执行过程实录
1. **原子替换静态产物与服务端修改文件**：将本地通过验证的 `dist/`（含 `dist/logo/software/` 9 枚开源图标）、[softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts)、[seoService.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoService.ts)、[applyP872Remediation.ts](file:///E:/Code/新建文件夹/scripts/applyP872Remediation.ts) 与对应前端改动源码同步至 `/var/www/softtribe.top`。
2. **线上合规数据治理（`npx tsx scripts/applyP872Remediation.ts`）**：
   - 安全暂停线上 **14 条**未审核第三方网盘直链（`zerofs.link` / `buzzheavier.com`，保留历史记录）；
   - 修正线上专题 `genuine-microsoft-installation-media` 及其 **10 条**关联备注、**10 款**软件商业授权声明、校验教程文案与 **9 款**开源软件真实本地图标路径。
3. **进程重载与本地环回自检**：`pm2 reload softtribe-backend --update-env` 重载成功；`http://127.0.0.1:3008/api/v1/health` 返回 `HEALTHY` (`CONNECTED`)，`/software` SSR 返回 `HTTP 200`，`/logo/software/7zip.png` 返回 `HTTP 200`。

### 12.2 公网域名 `https://softtribe.top` 真实指标与浏览器验收结果
- **实时线上频道数据口径**：
  - `totalSoftwareCount`: `28` 款
  - `registeredSourcesCount`: `81` 条已登记来源（其中 `approvedHealthySourcesCount`: `19` 条已审核直连、`pendingSourcesCount`: `62` 条待复审、`sha256VerifiedCount`: `0`）
  - `totalDownloadEvents`: `4`（`mostDownloaded`: `7zip:3`, `vscode:1`）
- **Playwright 公网真实 Chromium 检查结果**：
  - **1440×900 桌面**：HTTP `200`，`title` 与 `canonical` 精准指向 `https://softtribe.top/software`；顶部胶囊显示 `收录 28 款 · 81 条已登记源（19 条已审核直连）`；Hero 完整显示 `Windows 与 Office 安装资源及原版镜像校验指南`；本周热推 8 款与编辑精选 8 款 **0 交集**；**27 张图片 0 破损**（`brokenImgs: []`）；`0` 横向溢出、`0` JS `pageerror`。
  - **线上低样本榜单实景验证**：近期下载榜如实切换为 **「近期下载点击动态」** / **「实有 2 条记录」**，彻底消灭旧版 `待累积` 凑数空行。
  - **SPA 鉴权零重复验证**：由 `/software` 点击跳转 `/software/7zip` -> `/compare` -> `/software` 期间新增 `/api/v1/members/me` 请求次数 **`0`**，全周期仅首屏加载执行 `1` 次 `401` 探测。
  - **移动端 390×844 与首页回归**：`390px` 零横向溢出（`390/390`）；`https://softtribe.top/` 首页 `<h1>找软件 · 找游戏 · 找工具</h1>` 完整无损、零溢出。
- **公网验收截图归档（Artifact 目录）**：
  - `prod_p872_software_hero_1440.png`（公网首屏 1440px）
  - `prod_p872_software_1440.png`（公网全页 1440px，含 `近期下载点击动态`）
  - `prod_p872_software_390.png`（公网手机端 390px）
  - `prod_p872_homepage_preserved.png`（公网首页完整保留证明）

### 12.3 应急回滚指引
若需回退至 P8.7.2 上线前状态，可在 `/var/www/softtribe.top` 通过已留存全备一键恢复：
```bash
tar -xzf /home/ubuntu/backups/softtribe_code_pre_p872_20261110_143514.tar.gz -C /var/www/softtribe.top
docker exec -i vasto-postgres pg_restore -U vasto_admin -d softbuluo --clean --if-exists < /home/ubuntu/backups/softbuluo_pre_p872_20261110_143514.dump
pm2 reload softtribe-backend --update-env
```
