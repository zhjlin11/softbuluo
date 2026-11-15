# 软游部落 P9.1.0 —— 运营数据分析与指标定义规范

- **文件编号**：`SOFTTRIBE-P910-REQ-02`
- **编制角色**：首席技术架构师 / 数据分析工程师 / 产品运营负责人
- **生效周期**：P9.1.0 起及后续正式运营阶段
- **核心原则**：**以真实用户数据作为决策依据；严禁虚构数据、严禁人为放大倍数、严禁统计口径模糊化**。

---

## 一、指标体系设计原则

软游部落（SoftTribe）从 P9.1.0 阶段起全面转向以“数据驱动的精细化运营”。数据统计必须严格遵循以下五大铁律：
1. **真实可信（Honesty）**：所有指标必须由底层数据库记录聚合而来，严禁为了向汇报好看而添加任何“虚假放大系数”或“伪造随机访客”。
2. **严守隐私（Privacy-First）**：绝不落盘用户的明文 IP 地址、绝不采集用户的剪贴板或设备序列号、绝不在日志中存储明文密码或鉴权 Cookie。
3. **口径明确（Clear Semantics）**：明确区分“软件详情页浏览”、“下载入口点击”、“文件传输成功”与“客户端安装完成”，绝不将前期意图混淆为最终结果。
4. **防抖防刷（Anti-Fraud & Debouncing）**：对于 1 秒内的连续狂点、网络爬虫自动化遍历以及管理人员内部巡检操作，必须严格过滤隔离。
5. **轻量低耗（Performance & Zero-Impact）**：打点上报采用静默异步请求，客户端遇错静默吞掉，绝不影响普通用户的页面交互速度与首屏渲染。

---

## 二、基础流量指标（Traffic Metrics）

### 1. 页面浏览量（Page Views, PV）
- **定义**：用户在前台客户端成功加载或通过单页应用（SPA）路由导航至某一公开页面的有效访问总次数。
- **统计触发点**：前台 `RouteAnalyticsTracker` 监听到 `location.pathname` 变化且通过防刷防抖校验时。
- **排除规则**：
  - 严格排除所有以 `/admin` 开头的后台管理路由；
  - 严格排除 1000ms（1秒）内对同一路由路径的重复请求；
  - 严格排除已知搜索引擎通用爬虫（如 Baiduspider、Googlebot、bingbot）的自动化探测。

### 2. 独立访客数（Unique Visitors, UV）
- **定义**：自然日（00:00:00 - 23:59:59）内，访问软游部落的独立自然人或独立客户端环境去重计数。
- **技术实现**：
  - 后端在接收到前台打点时，提取 `clientIp` 与 `User-Agent`，结合当天日期（`YYYY-MM-DD`）通过 SHA-256 计算 16 位短哈希（`visitorHash`）；
  - `UV = COUNT(DISTINCT visitorHash)`。
- **业务特性**：同一用户在当天内刷新页面 50 次或浏览 20 个软件页面，其 PV 计为 20-50 次，但 UV **仅计为 1 次**。

### 3. 新客与老客访客占比（New vs. Returning Visitors）
- **定义**：
  - **新访客（New Visitor）**：当天其 `visitorHash` 在数据库历史 `SitePageView` 中首次出现；
  - **回访访客（Returning Visitor）**：当天其 `visitorHash` 曾出现在历史其他日期的访问记录中。
- **运营价值**：衡量 SEO 引流能力（新客占比）与装机工具箱口碑沉淀（老客留存率）。

---

## 三、渠道与来源指标（Channel & Source Metrics）

### 1. 外部引荐来源（External Referrers）
- **定义**：用户通过外部网站的超链接点击进入软游部落时，由浏览器 Header 传递的 `document.referrer` 域名。
- **分类统计**：
  - **直接访问（Direct）**：`referer` 为空或为本地收藏夹、桌面快捷方式、聊天工具无 Header 打开；
  - **站外引荐（Referral）**：来自知乎、哔哩哔哩、V2EX、GitHub、个人博客等外部技术站；
  - **自然搜索（Organic Search）**：包含 `baidu.com`、`google.com`、`bing.com`、`sogou.com`、`so.com`。

### 2. 站内各频道流量分布（Channel Breakdown）
将前台访问路径严格归集为七大主导航及二级内容体系：

| 频道类别 | 包含路由匹配规则 | 统计维度 |
| :--- | :--- | :--- |
| **首页** | `/` | 聚合流量入口 |
| **电脑软件** | `/software`、`/software/:slug` | 基础软件检索与详情 |
| **系统工具** | `/system-tools`、`/tool/:slug` | 系统维护工具与详情 |
| **游戏中心** | `/games`、`/game/:slug` | 游戏展示与下载 |
| **装机必备** | `/essentials` | 场景装机方案与导出 |
| **软件教程** | `/tutorials`、`/tutorials/:slug`、`/tutorial/:slug` | 技术文章与实操阅读 |
| **最新更新** | `/updates` | 发版动态与历史版本 |
| **对比评测** | `/compare`、`/compare/:slug` | 历史选型与横向评测 |
| **社区讨论** | `/community`、`/community/*` | 用户问答与交流 |

---

## 四、转化与下载业务指标（Conversion & Download Metrics）

### 1. 站内搜索意图与零命中率（Search Metrics）
- **总搜索请求数（Total Searches）**：用户在首页或频道顶部搜索框发起检索的总次数（记录于 `SearchQueryLog`）。
- **零命中搜索次数（Zero-Result Searches）**：检索返回结果数量为 0 的请求次数。
- **零命中率（Zero-Result Rate）**：`零命中搜索次数 / 总搜索请求数 * 100%`。
  - **运营警报线**：若零命中率 > 25%，说明大量用户寻找的软件或关键词平台尚未收录，应立即将高频零命中词提取至《待收录候选池》。

### 2. 软件详情到下载入口转化漏斗（Conversion Funnel）
软游部落必须严格区分以下四个层级的转化阶段：

```
[阶段 1: 站点全量访问] Total PV
       │
       ▼ (用户浏览/检索软件)
[阶段 2: 软件详情页浏览] Detail Page Views (software/:slug, tool/:slug, game/:slug)
       │
       ▼ (用户评估版本、授权、安全报告后决定下载)
[阶段 3: 下载入口授权点击] Download Entrance Clicks (DownloadEvent: AUTHORIZE / REDIRECT_OUT)
       │
       ▼ (外部官方服务器完成文件流分发 - 跨域不可测)
[阶段 4: 客户端安装完成] Client Installation Completed (Web端客观无法感知)
```

- **搜索到详情转化率（Search-to-Detail Rate）**：`软件详情页访问次数 / 站内搜索请求数 * 100%`。
- **详情到点击转化率（Detail-to-Click Rate）**：`下载入口点击次数 / 软件详情页访问次数 * 100%`。
- **核心合规红线**：
  > [!IMPORTANT]
  > **软游部落承诺直达官方来源或官方授权发布页。由于 Web 站点的同源策略限制，我们只能精确统计到“下载入口点击授权数”，绝不能将“点击下载”宣传为“成功安装量”。**

---

## 五、内容与榜单分析指标（Content Performance Metrics）

1. **软件热度榜（Top Viewed Software）**：按自然周期统计各软件详情页的真实 PV 与 UV 排行。
2. **下载意图榜（Top Downloaded Software）**：按自然周期统计各软件下载入口的点击量排行。
3. **教程阅读榜（Top Viewed Tutorials）**：按自然周期统计各教程的实际阅读浏览量，指导后续教程选题方向。
4. **设备与终端分布（Device Share）**：
   - 桌面端（Desktop）：Windows / macOS / Linux 浏览器；
   - 移动端（Mobile）：Android / iOS 微信内置浏览器及移动浏览器；
   - 关注移动端访问软件详情时是否有友好的官方移动版/网盘转存指引。

---

## 六、安全与合规红线

1. **绝对禁止伪造数据**：严禁在前端或后台将统计数据随意乘以 10 或 100 倍以虚假宣传网站规模。
2. **绝对禁止流氓捆绑**：统计后台严禁设立任何与“捆绑包”、“流氓静默安装”、“高速下载器分成”相关的指标。
3. **数据定期归档与物理安全**：访问打点日志建议保留 90 天，超过 90 天的数据可按自然月聚合沉淀为汇总数据，保障数据库索引高效稳定。
