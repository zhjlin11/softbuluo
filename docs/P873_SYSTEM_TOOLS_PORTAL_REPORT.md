# 软游部落 P8.7.3 —— 系统工具频道 (`/system-tools`) UI 3.0 门户化升级交付报告

- **最终验收结论**：**`P873_LOCAL_PASSED`**（且已获用户授权正式同步部署上线，公网 `https://softtribe.top/system-tools` 验收通过，线态标记：`P873_PRODUCTION_SYNCED_AND_VERIFIED`）
- **生产部署与双备份凭证**：
  - **正式环境**：`134.175.230.107` (`/var/www/softtribe.top`)，PM2 集群 `softtribe-backend` (`port 3008`)
  - **前置数据库全备**：`/home/ubuntu/backups/softbuluo_pre_p873_20261110_151154.dump` (`250K`, Docker `vasto-postgres`)
  - **前置源码/构建全备**：`/home/ubuntu/backups/softtribe_code_pre_p873_20261110_151154.tar.gz` (`16M`)
  - **代码与库分离回滚方案**：详见 [P873_DEPLOYMENT_PLAN.md](file:///E:/Code/新建文件夹/docs/P873_DEPLOYMENT_PLAN.md)。

---

## 一、改造前后对比与信息架构升级

### 1.1 改造前结构缺陷
详见基线审计 [P873_SYSTEM_TOOLS_BASELINE.md](file:///E:/Code/新建文件夹/docs/P873_SYSTEM_TOOLS_BASELINE.md)：
- 旧版仅提供单栏卡片列表，无专题大图、无右侧高频维修工具推荐、无独立榜单/专题/教程/更新区块；
- 回退查询硬编码了不存在的分类 Slug `system-tools`（实际为 `sys-tools`），导致回退始终 0 结果；
- 所有卡片盲目渲染绿色「人工校验」与硬编码 fallback `v1.0.0`，且 `<link rel="canonical">` 错误指向 `https://softbuluo.com/`、无后端 SSR 与 Sitemap 收录。

### 1.2 改造后 UI 3.0 门户信息架构（`max-w-[1280px]`）
1. **紧凑频道头与面包屑**（`首页 / 系统工具`，`<h1>专业电脑维护与系统工具中心</h1>`）+ 真实数量/审核直连双指标徽章 + 快速跳转按钮；
2. **高频工具域快捷入口栏**（6 个真实维保分类领域快捷键，实时展示各域工具数）；
3. **首屏专题大图轮播 (~65%) + 右侧「维修常用工具」2×4 矩阵 (~35%)**（支持左右切换、指示器、暂停/继续、键盘方向键、移动端触控滑动与 `prefers-reduced-motion` 自动停轮）；
4. **高风险维护操作安全告知条**（分区/格式化/引导/卸载/恢复操作前需独立备份，声明不含魔改镜像与激活脚本）；
5. **重点特色：「电脑遇到问题？按场景找工具」**（6 大故障场景矩阵 + 点击即展开的「排查步骤 → 对口真工具 → 配套教程 → 专题与安全提醒」排障工作流面板）；
6. **专业系统工具分类分区**（6 大领域按各自功能归口；`磁盘分区与数据恢复` 仅 1 款时自动使用紧凑横向专卡展示）；
7. **编辑精选工具**（6 款典型排障工具，与顶部常用栏优先错位减重）；
8. **实用工具排行榜**（复用 `SoftwareLeaderboards`，仅统计 `viewCount > 0` 与 `isTestEvent=false` 下载触发记录，`< 5` 条自适应显示真实条数而非虚标 TOP 10）；
9. **维修与维护专题合集**（6 个已发布专题 + 本地 16:9 原创矢量封面）；
10. **系统维护教程、工具横向对比（`7-Zip vs PeaZip`）与安全核验提示卡**（涉及数据/注册表操作教程均标「需先备份 / 管理员权限」）；
11. **近期版本更新与最新收录双栏**（严格分离 `SoftwareVersion.releaseDate` 与 `Software.publishedAt`）；
12. **完整系统工具库与多维筛选**（真实调用 `/api/v1/resources?type=TOOL`，支持分类、平台、大小写不敏感授权协议、浏览/点击/版本更新/收录/名称排序、关键字检索与分页）。

---

## 二、真实数据统计、图片版权来源与各模块关联明细

### 2.1 真实数据库工具与渠道统计（查询自本地 `/api/v1/channels/system-tools`）
- **公开非测试 `TOOL` 工具总量**：**15 款**（其中 **10 款**维保实操与诊断工具：`everything`, `diskgenius`, `hwinfo`, `cpu-z`, `wireshark`, `rufus`, `geek-uninstaller`, `7zip`, `git`, `ab-download-manager`；**5 款**微软官方系统发行版安装参考指南：`windows-11`, `windows-10`, `windows-ltsc`, `windows-server`, `windows-7`）。绝未编造任何假工具，亦未将办公软件充数列入。
- **高风险工具标识**：`2` 款直接标注 `HIGH` + `requireBackup: true`（`diskgenius`, `rufus`），另有卸载/系统指引标示管理员与备份说明。
- **真实来源核验口径**：已登记有效下载来源 **22 条**，其中同时满足 `VERIFIED && APPROVED && HEALTHY` 的直连来源 **8 条**，待复审 **14 条**，当前关联文件实体 `sha256` 数 **0 条**（页面如实显示 `8/22 条审核直连`，不在未核验工具上虚标绿色「人工校验」）。

### 2.2 Banner 与专题封面图片来源（100% 原创版权可控）
全部图片均为本地自研绘制的矢量科技横幅（位于 `public/images/system-tools/`，尺寸声明 `960×540` / 16:9 比例，体积仅 `~2KB/枚`，零外链图床盗用与断链风险）：
- `hero-maintenance.svg`（系统诊断与 Win11 装机必备）
- `hero-disk-health.svg`（GPT 分区与 S.M.A.R.T. 健康度）
- `hero-network-diag.svg`（TCP 拓扑与网络排障波纹）
- `hero-sysinternals.svg`（进程与自启项树形排查）
- `hero-clean.svg`（软件深度卸载与注册表扫描）
- `hero-boot-media.svg`（UEFI/GPT 启动介质与 SHA-256 核验）

### 2.3 六大故障场景与真实资源关联关系
| 场景 ID | 场景标题 | 绑定已发布工具（数量） | 配套教程 / 专题关联说明 |
| :--- | :--- | :--- | :--- |
| `slow_pc` | 电脑运行缓慢 / 占用过高 | `everything`, `geek-uninstaller`, `hwinfo` (3) | 教程 `everything-advanced-search-syntax` + 专题 `win11-essential-tools` |
| `disk_health` | 硬盘健康检测与数据恢复 | `diskgenius`, `hwinfo` (2) | 含「严禁向故障磁盘写入」红色前置警示 + 专题 `disk-health-diagnosis`（注：关联草稿硬件工具的 SSD S.M.A.R.T. 教程已被安全过滤不外泄） |
| `network_diag` | 网络连接异常 / DNS 排查 | `wireshark`, `ab-download-manager` (2) | 教程 `wireshark-http-tcp-handshake-capture` + 专题 `lan-troubleshooting-tools` |
| `bsod_hardware` | 电脑蓝屏、死机与温度监测 | `hwinfo`, `cpu-z` (2) | 3 步 Minidump/温度/内存排查指南 + 专题 `windows-sysinternals-guide` |
| `boot_install` | 装机与原版启动盘制作 | `rufus`, `windows-11`, `windows-10` (3) | 3 篇发布教程 (`rufus-win11-bypass-tpm-guide`, `how-to-verify-genuine-iso-checksums`, `clean-install-win11-guide`) + 专题 `genuine-microsoft-installation-media` |
| `uninstall_clean` | 软件卸载与顽固残留清理 | `geek-uninstaller`, `everything`, `7zip` (3) | 教程 `geek-uninstaller-clean-remnants` + 专题 `software-clean-uninstallation` |

### 2.4 专业工具分类归口（无跨分类克隆）
- `文件检索与解压管理 (2)`：`7zip`, `everything`
- `磁盘分区与数据恢复 (1)`：`diskgenius`（采用紧凑单栏横向高风险提醒专卡）
- `硬件体检与温度监测 (2)`：`cpu-z`, `hwinfo`
- `网络诊断与传输排查 (2)`：`wireshark`, `ab-download-manager`
- `卸载清理与环境维护 (2)`：`git`, `geek-uninstaller`
- `启动盘制作与原版指引 (6)`：`rufus`, `windows-11`, `windows-10`, `windows-ltsc`, `windows-server`, `windows-7`

### 2.5 排行榜口径
- **热门关注工具**（实有 10 款 `viewCount > 0`）：按细节页真实浏览降序，标注「非下载次数」。
- **近期下载点击**（本地实有 `6` 款非测试 `DownloadEvent > 0`）：标题动态显示为 `近期下载点击 TOP 6`，标注「非实际安装包完成传输数」；若 `< 5` 条（如当前生产库）则自动降级显示 `近期下载点击动态` 与 `实有 N 条记录`。

---

## 三、文件变更与接口调整清单

### 3.1 新增文件
- 原创矢量横幅：`public/images/system-tools/{hero-maintenance.svg,hero-disk-health.svg,hero-network-diag.svg,hero-sysinternals.svg,hero-clean.svg,hero-boot-media.svg}`
- 后端聚合服务与测试：
  - [systemToolsChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/systemToolsChannelService.ts)
  - [p873SystemToolsPortalTest.ts](file:///E:/Code/新建文件夹/server/tests/p873SystemToolsPortalTest.ts)
- 前端系统工具频道专属组件：
  - [SystemToolsPortalHero.tsx](file:///E:/Code/新建文件夹/src/components/systemTools/SystemToolsPortalHero.tsx)
  - [SystemToolsScenarioNavigator.tsx](file:///E:/Code/新建文件夹/src/components/systemTools/SystemToolsScenarioNavigator.tsx)
  - [SystemToolsDomainShowcase.tsx](file:///E:/Code/新建文件夹/src/components/systemTools/SystemToolsDomainShowcase.tsx)
  - [SystemToolsEditorialAndUpdates.tsx](file:///E:/Code/新建文件夹/src/components/systemTools/SystemToolsEditorialAndUpdates.tsx)
  - [SystemToolsCatalogSection.tsx](file:///E:/Code/新建文件夹/src/components/systemTools/SystemToolsCatalogSection.tsx)
- 文档：`docs/P873_SYSTEM_TOOLS_BASELINE.md`、`docs/P873_SYSTEM_TOOLS_PORTAL_REPORT.md`、`docs/P873_DEPLOYMENT_PLAN.md`

### 3.2 修改文件（零破坏性 DB Schema 变更）
- [softwareChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts)：扩展 `ALLOWED_CHANNELS` 为 `['SOFTWARE', 'SYSTEM_TOOLS']`，导出复用辅助函数并在 `validateChannelTarget` 中约束 `SYSTEM_TOOLS` 仅可推荐维护类合法工具（禁止混入无关办公软件/游戏）。
- [channelRoutes.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/channelRoutes.ts)：新增公开聚合路由 `GET /api/v1/channels/system-tools`，并为 `SYSTEM_TOOLS` 后台候选列表限定维护工具范围。
- [resourceRoutes.ts](file:///E:/Code/新建文件夹/server/src/modules/resources/resourceRoutes.ts)：修复 `/api/v1/resources` `license` 筛选大小写与子串匹配（支持 `GPL-2.0`/`Freeware/Shareware`/`COMMERCIAL`）、新增 `sort=version|updated` 按版本发布日排序，并令列表项 `sourceVerified` 严格对齐 `VERIFIED && APPROVED && HEALTHY`。
- [seoService.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoService.ts) & [seoRoutes.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts) & [robots.txt](file:///E:/Code/新建文件夹/public/robots.txt)：新增 `GET /system-tools` / `GET /seo/system-tools` SSR HTML5 渲染与 `/sitemap-software.xml` / `/robots.txt` 收录。
- [channelService.ts](file:///E:/Code/新建文件夹/src/services/channelService.ts)：提取共享 `fetchResourcesByChannelType`，新增 `getSystemToolsChannelPortal` 与 `getSystemToolsResourcesList`。
- [SoftwareLeaderboards.tsx](file:///E:/Code/新建文件夹/src/components/software/SoftwareLeaderboards.tsx)：补充可选标题 props 供系统工具频道无重复逻辑复用。
- [SystemToolsPage.tsx](file:///E:/Code/新建文件夹/src/pages/SystemToolsPage.tsx)：升级为 P8.7.3 门户，修复 `VITE_PUBLIC_SITE_URL` / 动态 Canonical，清理失实「沙盒/全绿校验」措辞。
- [AdminChannelConfigPage.tsx](file:///E:/Code/新建文件夹/src/pages/admin/AdminChannelConfigPage.tsx) & [AdminLayout.tsx](file:///E:/Code/新建文件夹/src/components/admin/AdminLayout.tsx)：后台频道运营台支持切换 `SOFTWARE` 与 `SYSTEM_TOOLS` 各自独立配置。
- [runAllQualityTests.ts](file:///E:/Code/新建文件夹/scripts/runAllQualityTests.ts)：接入 `P8.7.3` 套件。
- **数据库 Schema 变更**：**无结构改动**（直接复用已有 `ChannelRecommendation` 模型与 `channel='SYSTEM_TOOLS'` 字段值）。

---

## 四、实测验收与隔离保护证据

### 4.1 构建、类型检查与全阶段自动化测试
- `npm run lint` (`tsc --noEmit`)：**0 错误通过**
- `npm run build` (`vite build`)：**862ms 构建通过**（生成 `SystemToolsPage`、`AdminChannelConfigPage` 等全部分片产物）
- `npx tsx scripts/runAllQualityTests.ts`（实际完整重跑全部 **16 个测试套件**）：
  - **总计通过：489 项 | 总计失败：0 项**
  - 其中新增 **`P8.7.3 系统工具频道 UI 3.0`：11 / 11 ✅**
  - 既有 `P8.7` (15/15)、`P8.7.1` (15/15)、`P8.7.2` (12/12)、`P8.8` (32/32) 等全部保持绿色通过。

### 4.2 Playwright 真实浏览器验收与性能实测（Chrome Headless）
- **交互与真实过滤闭环**：从首页顶部导航点击「系统工具」跳转 `/system-tools`，`<h1>专业电脑维护与系统工具中心</h1>`、面包屑与独立 `<link rel="canonical">` 完整生效；轮播切换 (`heroSlideSwitched: true`)、点击「硬盘健康检测与数据恢复」弹出高危写入禁令提醒、点击「硬件体检监测」与「开源」及搜索 `Wireshark` 均准确过滤出对应工具并支持一键重置。
- **多视口响应式与暗黑模式**：
  - `1440px` 浅色/深色、`1280px`、`1024px`、`768px`、`430px`、`390px` 实测全部 **0 横向溢出**；
  - `30` 张页面图片与 SVG 横幅 `brokenImgs: []`（全数正常加载），**0 JS `pageerror`**、**0 非预期 Console 错误**。
- **真实性能测量**（本地 Chromium `PerformanceObserver` 直测，未经任何估算修饰）：
  - `FCP`: **`284ms`** | `LCP`: **`840ms`** | `CLS`: **`0.084`** | `domInteractive`: **`13ms`** | `loadEventEnd`: **`176ms`**
  - 频道页单次聚合接口请求 `/api/v1/channels/system-tools` + `/api/v1/resources?type=TOOL` 无 N+1 瀑布请求。
- **首页与电脑软件频道保护**：
  - 首页 `/` 标题 `找软件 · 找游戏 · 找工具` 保持原样且 0 溢出（`p873_homepage_preserved.png`）；
  - `/software` 频道 8+8 去重结构、焦点 Banner 与图标资产毫发无损（`p873_software_preserved.png`）。
- **视觉截图归档（Artifact 目录）**：
  - 改版前：`p873_before_system_tools_1440.png`、`p873_before_system_tools_390.png`
  - 改版后全尺寸：`p873_after_1440.png`、`p873_after_dark_1440.png`、`p873_after_1024.png`、`p873_after_768.png`、`p873_after_430.png`、`p873_after_390.png`
  - 模块专项：`p873_section_hero_1440.png`、`p873_section_scenarios_1440.png`、`p873_section_domains_1440.png`、`p873_section_leaderboards_1440.png`
  - 保护回归：`p873_homepage_preserved.png`、`p873_software_preserved.png`

---

## 五、已授权生产部署实录与待持续运营事项

1. **生产环境上线核验已完成**：`https://softtribe.top/system-tools` 实测返回 HTTP `200`，展示 **15 款工具（10 款维保实操）**、`8/22 条审核直连`、4 帧本地 SVG 焦点专题、6 大故障场景交互（含硬盘禁写提示）与 **「近期下载点击动态 / 实有 1 条记录」**（`7-Zip: 3 次触发`，无 `待累积` 凑数空行）；`1440px` 浅色/深色、`390px` 手机端均 **0 横向溢出**、**30 张图片 0 破损**、**0 报错**；首页 `/` 与 `/software` 均完整无回归；公网验收截图已归档至 `prod_p873_system_tools_{hero_1440,1440,dark_1440,390}.png`、`prod_p873_homepage_preserved.png`、`prod_p873_software_preserved.png`。
2. **线上实工具与关联资源扩展建议（不编造数据）**：`crystaldiskinfo`、`crystaldiskmark`、`bleachbit`、`ventoy` 等目前仍处于非发布态或待补齐状态，已按真实发布边界严格屏蔽；如后续运营在后台审核发布对应资源，场景与专题会自动增长显示。
3. **文件 SHA-256 实体覆盖率**：当前数据库 `sha256VerifiedCount` 为 `0`，页面已诚实呈现此状态；后续需在资源后台补齐实测下载安装包与官方哈希值。
4. **部署影响与安全回滚建议**：详见 [P873_DEPLOYMENT_PLAN.md](file:///E:/Code/新建文件夹/docs/P873_DEPLOYMENT_PLAN.md)，已制定**“代码仅回滚源码与 dist + 独立停用/清理运营配置”**的双轨分离预案，严禁拿恢复整库替代代码回滚而误删上线后新增用户、订单与评论数据。
