# 软游部落 P9.1.0 —— 搜索引擎收录与站长平台接入运营方案

- **文件编号**：`SOFTTRIBE-P910-SEO-05`
- **编制角色**：SEO 技术负责人 / 网站运营负责人
- **生效周期**：P9.1.0 启动至 30 天增长验证期
- **诚实准则**：**严禁虚构收录状态与排名数据。对于尚未完成人工认证的平台，明确标识为“待接入”并提供详细指引。**

---

## 一、搜索引擎平台接入现状客观审计

截至 2026-11-15 本次审计基线：

| 平台名称 | 当前认证状态 | 生产技术就绪度 | 核心运营价值 | 阻断原因与后续动作 |
| :--- | :--- | :--- | :--- | :--- |
| **百度搜索资源平台**<br>(ziyuan.baidu.com) | **未完成所有权认证** | 已支持 HTML 标签与文件验证接口 | 国内 Windows 软件下载与装机场景主要搜索入口 | 需站长注册百度账号并获取 `baidu-site-verification` 令牌 |
| **Google Search Console**<br>(search.google.com) | **未完成所有权认证** | 已支持 HTML 标签与 DNS TXT 验证 | 海外中文、开源软件、程序员技术教程主要流量池 | 需站长绑定 Google 账号并获取验证 Meta 标签 |
| **Bing Webmaster Tools**<br>(bing.com/webmasters) | **未完成所有权认证** | 已支持 XML 验证与 IndexNow API | Win10/Win11 默认 Edge 浏览器及 Copilot 引用核心源 | 需站长绑定微软账号并接入 IndexNow 实时推送 |
| **搜狗站长平台** | 未认证 | 基础 Sitemap 就绪 | 国内拼音输入法与微信环境搜索补充 | 后续阶段视精力补充提交 |
| **360 搜索站长平台** | 未认证 | 基础 Sitemap 就绪 | 国内部分办公电脑默认浏览器搜索补充 | 后续阶段视精力补充提交 |

---

## 二、站长必须配合执行的人工接入步骤（SOP）

由于搜索引擎站长平台的所有权认证需要绑定个人或企业实名账号，AI 助手无法擅自代为申请。请站长按照以下步骤依次认领：

### 1. 百度搜索资源平台接入步骤
1. 打开 [https://ziyuan.baidu.com/](https://ziyuan.baidu.com/)，使用个人或企业百度账号登录；
2. 点击“用户中心” -> “站点管理” -> “添加网站”；
3. 输入站点协议与域名：`https://softtribe.top`；
4. 选择站点属性（如“软件下载 / IT 科技”）；
5. **验证所有权方式选择“HTML标签验证”**；
6. 复制页面给出的类似 `<meta name="baidu-site-verification" content="code-xxxx" />` 中的 `code-xxxx` 字符串；
7. 将该值配置至服务器环境变量 `VERIFICATION_BAIDU`，或通知开发人员添加至 `index.html`；
8. 返回百度后台点击“完成验证”；
9. 验证成功后，进入“数据引入” -> “链接提交” -> “Sitemap”，提交 `https://softtribe.top/sitemap.xml`。

### 2. Google Search Console 接入步骤
1. 打开 [https://search.google.com/search-console](https://search.google.com/search-console)；
2. 添加资源类型推荐选择“网址前缀”：`https://softtribe.top/`；
3. 验证方式选择“HTML 标记”，复制 `<meta name="google-site-verification" content="xxxx" />`；
4. 将该值配置至生产环境；
5. 点击“验证”；
6. 在左侧菜单点击“站点地图”，提交 `https://softtribe.top/sitemap.xml` 与 `https://softtribe.top/sitemap-software.xml`。

### 3. Bing Webmaster Tools（必应站长平台）
1. 打开 [https://www.bing.com/webmasters/](https://www.bing.com/webmasters/)；
2. 支持一键通过 Google Search Console 账号直接无缝导入（推荐），或通过微软账号手工添加；
3. 提交 `https://softtribe.top/sitemap.xml`；
4. 在“IndexNow”模块生成密钥，后续软件发版时可实现实时通知必应爬虫。

---

## 三、全站动态 Sitemap 索引矩阵与分卷规划

软游部落后端已内置完备的动态 XML Sitemap 生成系统，全量遵循 Sitemaps.org 协议与标准 XML 规范：

| Sitemap 文件 URL | 覆盖资源类型 | 当前包含记录数 | 动态更新机制 | 优先级 (Priority) |
| :--- | :--- | :--- | :--- | :--- |
| `https://softtribe.top/sitemap.xml` | 主索引 (Index) | 包含 11 个子分卷 | 每次访问实时计算 | 1.0 |
| `https://softtribe.top/sitemap-software.xml` | 电脑软件与系统工具 | **50 款**已发布软件 | 随软件发布/更新动态变化 | 0.9 |
| `https://softtribe.top/sitemap-tutorials.xml` | 软件教程与系统指南 | **27 篇**正式教程 | 随新教程发布实时更新 | 0.8 |
| `https://softtribe.top/sitemap-games.xml` | 游戏中心精选 | **3 款**精选游戏 | 随游戏发布动态变化 | 0.7 |
| `https://softtribe.top/sitemap-essentials.xml` | 装机必备专题 | 6 大场景方案 | 静态与推荐位绑定 | 0.8 |
| `https://softtribe.top/sitemap-updates.xml` | 版本更新时间线 | 最新版本动态 | 随版本发布自动推进 | 0.7 |
| `https://softtribe.top/sitemap-comparisons.xml` | 对比评测库 | 历史横向对比方案 | 保留路由平滑支持 | 0.6 |
| `https://softtribe.top/sitemap-categories.xml` | 软件分类目录 | 10+ 核心技术分类 | 随分类体系更新 | 0.6 |
| `https://softtribe.top/sitemap-topics.xml` | 专题中心索引 | 系统专题合集 | 随专题上线更新 | 0.6 |
| `https://softtribe.top/sitemap-community.xml` | 社区交流帖子 | 活跃讨论帖 | 随社区活跃度动态产生 | 0.5 |

---

## 四、软游部落 30 天核心 SEO 关键词矩阵策略

软游部落定位于“纯净、官方、安全、无流氓捆绑的 Windows 软件与装机维护门户”，SEO 关键词绝不能与传统大下载站拼杀极度宽泛的单一词（如“下载软件”），而应聚焦于**高意图、强信任度、长尾场景与教程修障词**：

### 1. 品牌信任词（建立首选心智）
- `软游部落`、`软游部落官网`、`软游部落软件下载`、`softtribe`、`softtribe.top`。

### 2. 纯净与安全特征词（主打差异化）
- `Win11装机必备纯净版`、`无广告软件下载站`、`开源Windows工具推荐`、`无绑定解压缩软件`、`官方原厂直接下载`。

### 3. 具体软件型号 + 官方原厂词（截流精准用户）
- `Process Explorer 官方下载`、`Autoruns 绿色中文版`、`MemTest86 内存测试工具`、`7-Zip 官方64位`、`ShareX 截图录屏设置教程`、`Rufus 制作系统启动盘`、`Dism++ Win11精简与备份`。

### 4. 故障排查与场景解决长尾词（教程驱动引流）
- `Win11 右键菜单恢复经典模式`
- `电脑开机卡死排查工具`
- `电脑新装机应该装哪些软件`
- `完全卸载流氓软件干净方法`
- `固态硬盘健康度检测工具读取`
- `双网卡流量监控悬浮窗推荐`

---

## 五、每周搜索引擎监控台账模板（Ledger Template）

正式运营启动后，SEO 负责人每周五下午填写下表，沉淀至运营档案：

| 监测自然周 | 百度收录量 | 谷歌收录量 | 必应收录量 | 站内总曝光数 | 搜索点击量 (Clicks) | 平均点击率 (CTR) | 核心引流页面 Top 3 | 异常/抓取错误备注 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Week 1** | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 提交验证并提交主 Sitemap |
| **Week 2** | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 重点观察 /software/ 与 /tutorials/ 抓取 |
| **Week 3** | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 排查 404 与服务器 5xx 抓取异常 |
| **Week 4** | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 待记录 | 首月收录复盘与关键词增补 |
