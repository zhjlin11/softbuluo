# 软游部落 P9.1.0 —— 访问统计与数据采集实现方案与方案比选

- **文件编号**：`SOFTTRIBE-P910-ARCH-03`
- **编制角色**：首席技术架构师 / Fastify 后端工程师 / SRE 运维工程师
- **核心目标**：评估多类统计方案优缺点，确定当前运营阶段的最优实现路线，完成可落地的技术架构闭环。

---

## 一、业界主流统计与分析方案多维对比

为了在“数据真实性”、“用户隐私保护”、“系统性能”、“维护成本”与“商业独立性”之间取得最佳平衡，我们对四类主流方案进行了深度横向比选：

| 评估维度 | 方案 A：自研轻量打点（当前推荐） | 方案 B：Nginx 日志离线解析（如 GoAccess） | 方案 C：开源自建统计（如 Umami / Plausible） | 方案 D：商业云统计（如 百度统计 / GA / 51.la） |
| :--- | :--- | :--- | :--- | :--- |
| **接入成本** | **零成本**（工程内置代码，直接复用） | 低成本（需编写 Logrotate 与解析定时任务） | 中成本（需独立部署 Docker、Node/PG 服务） | 低成本（引入外部 JS SDK 即可） |
| **数据主权** | **100% 掌握在自己手中**，存放在自建 PG 库 | **100% 私有**，存放在服务器本地日志 | **100% 私有**，独立数据库保存 | **数据上传至第三方厂商**，存在泄露或合规风险 |
| **用户体验** | **极高**（无 Cookie 弹窗、无外链阻塞、体积 < 1KB） | **极高**（完全不影响前端渲染） | 良好（轻量 JS 脚本约 3KB） | 一般（加载 20-50KB 外部脚本，易被广告插件拦截） |
| **业务关联度** | **完美深度融合**（可直接关联软件ID、分类、搜索词、下载事件） | 极低（仅能分析 URL，无法感知用户登录或深度交互上下文） | 中等（支持自定义事件，但与本地业务库割裂） | 中等（与本地业务数据库天然隔离，无法直接联动运营后台） |
| **抗脚本拦截** | **极强**（走同域 `/api/v1/analytics/collect`，不被屏蔽） | **最强**（直接记录网络层请求） | 良好（自定义域名上报） | 极差（主流广告拦截插件如 AdGuard/uBlock 默认全面封杀） |
| **服务器开销** | 极低（PostgreSQL 写入吞吐量完全充裕） | 极低（离线按天计算，不占用实时资源） | 中等（需长期驻留 1 个独立 Docker 进程与内存） | **零开销**（云端计算） |

---

## 二、当前阶段决策结论与演进路线

### 1. 核心决策结论
- **P9.1.0 首选方案**：**方案 A（自研轻量打点体系）**。
- **决策依据**：
  1. 系统中已有成熟的 `SitePageView`、`SearchQueryLog`、`DownloadEvent` 数据表与 `/api/v1/analytics/collect` 后端实现；
  2. 与软游部落后台运营看板（`AdminAnalyticsPage.tsx`）天然直连，无需二次授权；
  3. 彻底避免第三方商业代码带来的隐私政策合规风险；
  4. 同域请求不会被浏览器隐私拦截插件屏蔽，数据更真实。

### 2. 三阶段演进路线图
```
[阶段一：正式运营启动期 (0 - 5,000 日PV)]
  └─ 采用自研轻量打点 (RouteAnalyticsTracker + PG 库)，实现 PV/UV/搜索/下载精准归集。
        │
        ▼ (当站点日 PV 超过 10,000，且爬虫流量显著增加)
[阶段二：流量快速爬升期 (5,000 - 50,000 日PV)]
  └─ 引入方案 B (Nginx + GoAccess 离线分析)：补充底层网络层、CDN 命中率、4xx/5xx 状态码及全网扫描器特征分析。
        │
        ▼ (当运营团队需要深度多维自定义漏斗与热力图)
[阶段三：成熟商业化期 (50,000+ 日PV)]
  └─ 评估部署自建独立 Umami 实例，与自研业务数据并行，提供更细粒度的留存率分析。
```

---

## 三、方案 A：自研轻量数据采集技术架构

### 1. 数据流向拓扑图
```
[ 用户端浏览器 ]
      │ (路由导航切换 / 搜索提交 / 点击下载)
      ├─ 1. 路由切换 ──▶ RouteAnalyticsTracker.tsx ──▶ GrowthService.collectPageView()
      ├─ 2. 关键词检索 ──▶ SearchService.search() ──▶ 后端触发 SearchQueryLog.create()
      └─ 3. 下载入口点击 ──▶ DirectDownloadModal ──▶ 后端触发 DownloadEvent.create()
                                  │
                                  ▼
[ Fastify 后端集群 (softtribe-backend) ]
      │
      ├─ 接收 /api/v1/analytics/collect
      ├─ 提取 clientIp + User-Agent + YYYY-MM-DD
      ├─ SHA-256 加盐计算 16 位 visitorHash
      └─ 校验数据长度，截断防溢出
                                  │
                                  ▼
[ PostgreSQL 数据库 (vasto-postgres) ]
      ├─ 表 1: SitePageView (路由路径、页面类型、来源 Referer、访客短哈希、时间戳)
      ├─ 表 2: SearchQueryLog (原始词、规范化词、命中数、是否无结果、时间戳)
      ├─ 表 3: DownloadEvent (软件ID、来源ID、事件类型 AUTHORIZE/REDIRECT_OUT、时间戳)
      └─ 表 4: AuditLog (管理员操作流水)
                                  │
                                  ▼
[ 运营大盘聚合接口 (GET /api/v1/admin/analytics/overview) ]
      └─ 聚合今日 UV/PV、7天趋势、高频搜索意图、零命中词、转化漏斗、合规指标
                                  │
                                  ▼
[ 管理后台前台展示 (AdminAnalyticsPage.tsx) ]
```

---

## 四、核心代码实现清单

### 1. 前端路由自动监听打点组件
文件位置：[RouteAnalyticsTracker.tsx](file:///e:/Code/新建文件夹/src/components/common/RouteAnalyticsTracker.tsx)
- 监听 `useLocation().pathname`；
- 过滤 `/admin/*` 路径；
- 1000ms 快速连续点击防抖；
- 自动识别页面语义（`HOME`、`SOFTWARE_INDEX`、`SOFTWARE_DETAIL`、`TOOL_INDEX`、`TOOL_DETAIL`、`TUTORIAL_INDEX`、`TUTORIAL_DETAIL`、`ESSENTIALS`、`UPDATES`、`COMPARE` 等）；
- 异步静默调用 `GrowthService.collectPageView()`。

### 2. 根应用挂载
文件位置：[App.tsx](file:///e:/Code/新建文件夹/src/App.tsx)
- 在主界面布局组件 `AppLayout` 的顶层挂载 `<RouteAnalyticsTracker />`，覆盖全站所有非管理员路由。

### 3. 后端收集与安全隐私哈希
文件位置：[analyticsRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/analytics/analyticsRoutes.ts)
- 提取客户端 IP 与 User-Agent；
- 生成隐私短哈希：`crypto.createHash('sha256').update(`${clientIp}-${userAgent}-${dateStr}`).digest('hex').slice(0, 16)`；
- 杜绝在数据库中落盘任何用户明文网络标识。

### 4. 统计大盘聚合引擎
文件位置：[analyticsService.ts](file:///e:/Code/新建文件夹/server/src/modules/analytics/analyticsService.ts)
- `getOverview()`：并行查询今日 PV、今日去重 UV、近 7 天趋势数组、高频搜索与零命中率、下载转化漏斗、生态数据与站长验证状态。

---

## 五、自动化质量保障与验收

针对上述数据采集逻辑，已建立专用自动化测试套件 [p910OperationsAnalyticsTest.ts](file:///e:/Code/新建文件夹/server/tests/p910OperationsAnalyticsTest.ts)，纳入全站 [runAllQualityTests.ts](file:///e:/Code/新建文件夹/scripts/runAllQualityTests.ts)（第 31 套件），确保打点逻辑不退化、隐私短哈希不失效、前台路由打点安全隔离。
