# 软游部落 P8.9 全站性能、多端视口与 Core Web Vitals 实测报告

## 一、实测环境与测试方法说明

- **测试工具**：Playwright Headless Chromium (真实浏览器无头渲染引擎)
- **测量基线**：客户端 SPA 热加载与数据流完成（`networkidle` + DOM 就绪）
- **测试视口覆盖**：
  1. `1440 × 900`（桌面大屏 / 默认基准）
  2. `1280 × 800`（主流笔记本屏幕）
  3. `1024 × 768`（平板横屏 / 小屏笔记本）
  4. `768 × 1024`（iPad / 平板竖屏）
  5. `430 × 932`（大屏旗舰手机 / iPhone 14 Pro Max / 华为 Mate 60）
  6. `390 × 844`（标准移动视口 / iPhone 12/13/14）
- **核心关注指标**：
  - **FCP (First Contentful Paint)**：首个文本或图片绘制耗时（目标 <= 1.8s）
  - **CLS (Cumulative Layout Shift)**：累积布局偏移（目标 <= 0.1）
  - **横向溢出 (Horizontal Overflow)**：`scrollWidth > innerWidth`（强制要求为 0 溢出）
  - **Console JS 错误**：未捕获脚本异常数（强制要求为 0）

---

## 二、七大主频道多端视口实测性能矩阵

基于 `scripts/p89_performance_data.json` 真实 54 组测量数据统计：

| 页面名称 | 路径 | 1440px FCP | 1024px FCP | 390px FCP | 平均 FCP | 横向溢出 | 控制台 JS 错误 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **首页** | `/` | 338 ms | 325 ms | 310 ms | **331 ms** | ✅ 0 溢出 | 0 |
| **电脑软件** | `/software` | 240 ms | 235 ms | 228 ms | **234 ms** | ✅ 0 溢出 | 0 |
| **系统工具** | `/system-tools` | 238 ms | 231 ms | 230 ms | **233 ms** | ✅ 0 溢出 | 0 |
| **游戏中心** | `/games` | 235 ms | 228 ms | 224 ms | **229 ms** | ✅ 0 溢出 | 0 |
| **装机必备** | `/essentials` | 236 ms | 230 ms | 231 ms | **232 ms** | ✅ 0 溢出 | 0 |
| **软件教程** | `/tutorials` | 242 ms | 238 ms | 232 ms | **237 ms** | ✅ 0 溢出 | 0 |
| **最新更新** | `/updates` | 249 ms | 242 ms | 239 ms | **243 ms** | ✅ 0 溢出 | 0 |
| **对比评测** | `/compare` | 245 ms | 239 ms | 236 ms | **240 ms** | ✅ 0 溢出 | 0 |
| **社区交流** | `/community` | 241 ms | 236 ms | 234 ms | **237 ms** | ✅ 0 溢出 | 0 |

> [!NOTE]
> **性能评价**：全站 9 个核心路由的平均 FCP 为 **246 ms**，远优于 Google Web Vitals 优秀标准（<= 1800 ms）。全站 54 组视口测试横向溢出发生率均为 **0%**，移动端响应式断点（`sm`, `md`, `lg`, `xl`）适配严密。

---

## 三、前端生产构建产物体积分析

基于 Vite 8.3.6 生产编译（`npm run build`）产物审计：

- **主 CSS 样式表**：`dist/assets/index-*.css`：`214.05 kB`（Gzip 压缩后：**26.97 kB**）
- **核心 React 运行时**：`dist/assets/vendor-react-*.js`：`288.48 kB`（Gzip 压缩后：**92.07 kB**）
- **主业务入口**：`dist/assets/index-*.js`：`186.88 kB`（Gzip 压缩后：**41.54 kB**）
- **按需加载路由 Chunk**（页面代码分割）：
  - `TutorialsPage.js`: 27.18 kB (Gzip: 6.65 kB)
  - `TutorialDetailPage.js`: 29.40 kB (Gzip: 8.00 kB)
  - `UpdatesPage.js`: 41.68 kB (Gzip: 9.23 kB)
  - `SoftwarePage.js`: 51.25 kB (Gzip: 10.69 kB)
  - `SystemToolsPage.js`: 63.45 kB (Gzip: 13.21 kB)
  - `EssentialsPage.js`: 72.81 kB (Gzip: 15.80 kB)

- **体积优化评价**：
  所有路由页面均实现 **按需动态加载 (Dynamic Imports)**。首屏用户仅需下载约 160 kB Gzip 资源即可完成完整交互就绪，无阻塞大体积冗余依赖。

---

## 四、代表性屏幕截图归档清单

Playwright 自动化验收已生成高保真截图并持久化存入 Artifacts 目录：

1. 首页桌面端：[p89_home_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_home_1440.png)
2. 首页移动端：[p89_home_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_home_390.png)
3. 电脑软件桌面端：[p89_software_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_software_1440.png)
4. 电脑软件移动端：[p89_software_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_software_390.png)
5. 系统工具桌面端：[p89_system_tools_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_system_tools_1440.png)
6. 系统工具移动端：[p89_system_tools_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_system_tools_390.png)
7. 游戏中心桌面端：[p89_games_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_games_1440.png)
8. 游戏中心移动端：[p89_games_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_games_390.png)
9. 装机必备桌面端：[p89_essentials_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_essentials_1440.png)
10. 装机必备移动端：[p89_essentials_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_essentials_390.png)
11. 软件教程桌面端：[p89_tutorials_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_tutorials_1440.png)
12. 软件教程移动端：[p89_tutorials_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_tutorials_390.png)
13. 最新更新桌面端：[p89_updates_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_updates_1440.png)
14. 最新更新移动端：[p89_updates_390.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_updates_390.png)
15. 深色模式全屏效果：[p89_dark_mode_1440.png](file:///C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p89_dark_mode_1440.png)
