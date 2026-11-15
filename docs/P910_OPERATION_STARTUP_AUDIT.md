# 软游部落 P9.1.0 —— 运营启动健康检查与全站体检审计报告

- **报告编号**：`SOFTTRIBE-P910-AUDIT-01`
- **执行角色**：首席全栈架构师 / 生产 SRE 工程师 / 运营审计负责人
- **审计基线**：软游部落（SoftTribe）P9.0.2 正式上线后生产系统基线
- **网站生产域名**：`https://softtribe.top/`
- **生产服务器**：`134.175.230.107`
- **本地工程路径**：`E:\Code\新建文件夹`
- **审计日期**：2026-11-15
- **审计原则**：基于实际运行环境与只读数据穿透核查，严禁虚构收录状态、严禁捏造虚假指标。

---

## 一、审计概述与核心结论

本次健康检查为软游部落进入正式运营阶段（P9.1.0）前的全站穿透式审计。审计范围覆盖：
1. 网站前台 7 大核心导航频道与 2 个保留二级路由；
2. 50 款正式发布非测试软件与 27 篇正式发布教程的真实状态；
3. 42 款非测试草稿储备与 30 款物理隔离测试数据；
4. 160 条下载来源与反向代理/直链健康状态；
5. 搜索引擎抓取规范（robots.txt）、11 份动态 Sitemap、Canonical 与 JSON-LD 微数据；
6. 服务器底层硬件、磁盘容量、内存利用率、PM2 进程状态及 PostgreSQL 容器备份可靠性；
7. 统计埋点现状与盲区排查。

### 核心审计结论
- **正式运营就绪度评估**：**具备基础运营条件，但需立即补齐客户端访问路由打点，并由站长亲自向百度/谷歌/必应站长平台提交所有权令牌**。
- **全站路由可用性**：23 个关键生产 HTTPS 路由 100% 返回 `HTTP 200 OK`，页面首屏加载正常。
- **数据真实性与隔离状态**：50 款已发布软件与 27 篇正式教程要素完整；30 款测试数据 100% 隔离，无泄露至前台与 Sitemap；42 款草稿处于安全只读待审队列。

---

## 二、全站频道与核心路由健康状态

软游部落严格维持 **七大核心主导航** 架构（遵循 [navigation.ts](file:///e:/Code/新建文件夹/src/config/navigation.ts) 规范）：

| 序号 | 导航名称 | 访问路径 | 生产 HTTPS 状态 | 页面类型 | 核心功能与呈现状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 首页 | `/` | HTTP 200 | Portal | 聚合搜索、装机推荐、分类入口、热门榜单正常 |
| 2 | 电脑软件 | `/software` | HTTP 200 | Portal 3.0 | 17 款软件分类卡片、官方图标、多维筛选正常 |
| 3 | 系统工具 | `/system-tools` | HTTP 200 | Portal 3.0 | 30 款系统维护工具、故障诊断入口正常 |
| 4 | 游戏中心 | `/games` | HTTP 200 | Portal 3.0 | 3 款精选游戏展示、安全无广告下载入口正常 |
| 5 | 装机必备 | `/essentials` | HTTP 200 | Portal 3.0 | 6 大场景方案、分组清单与 TXT/JSON 安全导出正常 |
| 6 | 软件教程 | `/tutorials` | HTTP 200 | Portal 3.0 | 27 篇正式教程列表、分类过滤与阅读入口正常 |
| 7 | 最新更新 | `/updates` | HTTP 200 | Portal 3.0 | 真实发版时间线、版本日志展开、新收录隔离正常 |

### 保留二级路由（平滑过渡，不作主导航）
- 对比评测：`https://softtribe.top/compare`（HTTP 200，正常访问）
- 社区交流：`https://softtribe.top/community`（HTTP 200，正常访问）

---

## 三、软件资源全景盘点与数据一致性审计

经过生产数据库与本地数据库穿透核验：

```
生产数据库软件记录总量：123 款
├─ 正式已发布非测试软件 (PUBLISHED, isTestData=false)：50 款
│  ├─ 电脑软件 (type=SOFTWARE)：17 款
│  ├─ 系统工具 (type=TOOL)：30 款
│  └─ 游戏中心 (type=GAME)：3 款
├─ 待审核非测试草稿储备 (DRAFT, isTestData=false)：42 款
│  ├─ 可用优质候选草稿：41 款
│  └─ 已安全归档重复草稿：1 款 (vs-code)
└─ 物理隔离历史测试资源 (isTestData=true)：30 款 (前台与 Sitemap 严格不可见)
```

### 生产已发布 50 款优质软件列表
1. **7-Zip** (7-zip)
2. **Bandizip** (bandizip)
3. **Everything** (everything)
4. **Geek Uninstaller** (geek-uninstaller)
5. **PotPlayer** (potplayer)
6. **Snipaste** (snipaste)
7. **ToDesk** (todesk)
8. **Visual Studio Code** (visual-studio-code)
9. **微信** (wechat)
10. **QQ** (qq)
11. **Google Chrome** (google-chrome)
12. **Edge 浏览器** (microsoft-edge)
13. **网易云音乐** (netease-cloud-music)
14. **WPS Office** (wps-office)
15. **Steam** (steam)
16. **腾讯会议** (tencent-meeting)
17. **钉钉** (dingtalk)
18. **Dism++** (dism-plus)
19. **Rufus** (rufus)
20. **CrystalDiskInfo** (crystaldiskinfo)
21. **CrystalDiskMark** (crystaldiskmark)
22. **CPU-Z** (cpu-z)
23. **GPU-Z** (gpu-z)
24. **AIDA64 Extreme** (aida64-extreme)
25. **HWiNFO** (hwinfo)
26. **ScreenToGif** (screentogif)
27. **SpaceSniffer** (spacesniffer)
28. **TrafficMonitor** (trafficmonitor)
29. **Captura** (captura)
30. **FastCopy** (fastcopy)
31. **ContextMenuManager** (contextmenumanager)
32. **Ventoy** (ventoy)
33. **原神** (genshin-impact)
34. **崩坏：星穹铁道** (honkai-star-rail)
35. **绝区零** (zenless-zone-zero)
36. **RustDesk** (rustdesk)
37. **Motrix** (motrix)
38. **BleachBit** (bleachbit)
39. **KeePass** (keepass)
40. **VLC Media Player** (vlc)
41. **Process Explorer** (process-explorer)
42. **Autoruns** (autoruns)
43. **MemTest86** (memtest86)
44. **ShareX** (sharex)
45. **Windows Terminal** (windows-terminal)
46. **Notepad++** (notepad-plus-plus)
47. **GIMP** (gimp)
48. **Sumatra PDF** (sumatra-pdf)
49. **HandBrake** (handbrake)
50. **Audacity** (audacity)

---

## 四、下载来源与健康状态审计

- **生产下载来源记录总数**：160 条
- **有效启用中来源**：114 条
  - 官方直链（`OFFICIAL_DIRECT`）：48 条
  - 官方下载页直达（`EXTERNAL_DOWNLOAD_PAGE`）：66 条
- **已停用/安全归档来源**：46 条
  - P9.0 巡检中发现的 35 条 404/失效来源已全部在 P9.0.1 和 P9.0.2 中完成安全停用或替换为官方有效下载落地页。
  - 50 款已发布软件全部具备至少 1 个经过核验的有效官方直接下载入口或官方授权发布页，零断链阻断。

---

## 五、搜索引擎优化（SEO）与抓取规范审计

1. **爬虫协议（robots.txt）**：
   - 生产访问地址：`https://softtribe.top/robots.txt`
   - 放行前台主要栏目：`/software`、`/system-tools`、`/games`、`/essentials`、`/tutorials`、`/updates` 等；
   - 封禁管理与敏感路径：`/admin`、`/api`、`/account`、`/checkout`、`/developer`；
   - 声明了全站 11 个动态 Sitemap 索引。
2. **动态 Sitemap 索引与分卷**：
   - `sitemap.xml`：聚合主索引；
   - `sitemap-software.xml`：包含 50 款已发布非测试软件，更新时间戳采用数据库实际 `updatedAt`；
   - `sitemap-tutorials.xml`：包含 27 篇正式非测试教程；
   - `sitemap-games.xml`、`sitemap-essentials.xml`、`sitemap-updates.xml` 等分卷均正常输出标准 XML。
3. **页面 Canonical 与 JSON-LD 微数据**：
   - 详情页规范化链接指向 `https://softtribe.top/software/:slug`；
   - 结构化数据采用 Schema.org 标准 `SoftwareApplication` 与 `CollectionPage`，有效辅助搜索引擎建立富媒体摘要。

---

## 六、服务器基础设施与运维监控审计

1. **主机与操作系统**：
   - 腾讯云 Ubuntu 22.04 LTS (x86_64)；
   - 公网 IP：`134.175.230.107`；
   - 域名解析与 SSL 证书由腾讯云 Edge / Nginx 反向代理统一承载，支持 HTTP/2 与 TLS 1.3。
2. **计算与内存**：
   - 物理内存：3719 MB，当前已用 1591 MB，可用 1782 MB（充裕）；
   - Swap 交换分区：4095 MB，已用 1108 MB，未发生频繁抖动。
3. **存储与磁盘空间**：
   - 根分区挂载点 `/dev/vda2`：总容量 69 GB，已用 57 GB，可用 9.3 GB（已用占比 **86%**）；
   - 评估：已达到警惕水位（> 85%），主因是历史部署备份包（`/home/ubuntu/backups/` 下保留了多份历史 tar 包与 dump 镜像），需建立保留近 7 天备份的定期归档与清理脚本。
4. **服务进程（PM2）**：
   - `softtribe-backend` (PID: 3879497)：Cluster 模式运行，在线运行稳定，CPU 0%，内存占用约 110 MB；
   - 其他辅助服务均正常在线。
5. **数据库容器（Docker PostgreSQL 15）**：
   - `vasto-postgres`：正常运行超 2 个月，端口绑定 127.0.0.1:5432；
   - 定时备份任务：每天凌晨通过 `/home/ubuntu/scripts/backup_db_daily.sh` 执行逻辑导出，并计算 SHA-256 校验和。

---

## 七、统计与运营指标系统发现的隐患

在对代码库与数据表进行穿透分析时，发现了两个核心运营断层：

1. **前台缺少自动路由页面打点（P2 级缺陷）**：
   - 后端已具备 `SitePageView` 数据表和 `/api/v1/analytics/collect` 接口；
   - 前端 SDK `growthService.ts` 中已有 `collectPageView` 方法；
   - **但前端客户端在用户切换路由时从未自动调用该方法！** 导致只有通过下载点击或手动 API 打点时才有记录，实际用户的页面浏览（PV）和独立访客（UV）长期处于盲区。
   - **整改措施**：已在本地开发环境创建 [RouteAnalyticsTracker.tsx](file:///e:/Code/新建文件夹/src/components/common/RouteAnalyticsTracker.tsx) 并集成至 [App.tsx](file:///e:/Code/新建文件夹/src/App.tsx)，自动防抖打点并排除 `/admin/*` 路径。
2. **搜索引擎站长平台未完成所有权令牌配置（P2 级缺陷）**：
   - 百度搜索资源平台、Google Search Console、Bing Webmaster Tools 尚未完成域名或 HTML 标签验证；
   - 目前站内无法直接拉取搜索引擎官方爬取频次与关键词展现数据；
   - **整改措施**：明确站长平台接入步骤，等待站长本人提供验证 Token 后通过环境变量或静态标签接入。

---

## 八、全站系统隐患与问题分级清单（P0 - P3）

依据系统安全性、数据一致性与运营阻断程度，对当前发现的问题进行严谨分级：

| 级别 | 问题定义 | 影响范围 | 当前状态 | 应对措施 |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | 致命阻断：网站宕机、数据损毁、安全失控 | 无 | **0 项**（无 P0 隐患） | 全站 HTTPS 正常，数据库自动每日备份。 |
| **P1** | 核心故障：下载彻底瘫痪、主导航 404、SEO 索引崩溃 | 无 | **0 项**（无 P1 隐患） | 50 款软件下载链接全通，Sitemap 动态就绪。 |
| **P2** | 运营盲区：前台页面未自动打点、搜索引擎站长未核验 | 运营数据与收录 | **2 项** | 1. 部署 `RouteAnalyticsTracker` 自动打点；<br>2. 站长注册并绑定百度/谷歌/必应站长平台。 |
| **P3** | 优化事项：服务器磁盘达 86%、42 款草稿积压 | 运维余量与扩充速度 | **2 项** | 1. 编写备份目录自动轮转脚本，清理历史冗余 tar；<br>2. 制定每周审 5-10 款草稿的常规扩增计划。 |

---

## 九、总结与验收签字

本次 P9.1.0 运营启动健康检查表明，软游部落在经历 P9.0、P9.0.1、P9.0.2 的深度治理后，已经从早期的开发测试型系统彻底转变为**数据真实、官方来源可信、架构清晰稳定的现代软件门户**。

在完成 Stage B 本地统计追踪集成与 Stage C 站长平台认证后，软游部落即可全面启动为期 30 天的精细化内容运营与流量增长验证。
