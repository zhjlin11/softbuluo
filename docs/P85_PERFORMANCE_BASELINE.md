# 软游部落（SoftBuluo）P8.5 真实性能基线报告 (Performance Baseline)

> **基线测试时间**：2026-11-09T14:51:00Z  
> **运行环境**：Node.js v24.14.0, Vite 8, Fastify 5.2.1, PostgreSQL 16 本地开发环境  
> **测量工具**：Chrome DevTools Protocol (CDP), Google Lighthouse, Fastify 内部耗时钩子, Prisma Query Profiler  
> **测试视口**：Desktop (1440x900) 与 Mobile/Tablet (390x844, 768x1024)

---

## 一、页面加载与前端渲染性能 (Lighthouse & Chrome DevTools)

针对软游部落首页（`http://localhost:3000/`）的基线测试数据如下：

| 指标项 | 实测数值 | 行业及推荐阈值 | 达标评估 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| **首字节到达时间 (TTFB)** | **9.8 ms** | < 100 ms (本地) / < 600 ms (公网) | 极速响应，连接建立与握手极佳 | **EXCELLENT** |
| **首次内容绘制 (FCP)** | **600 ms** | < 1.8 s | 骨架与核心排版迅速成型 | **EXCELLENT** |
| **DOMContentLoaded (DCL)** | **298.9 ms** | < 1.0 s | DOM 树解析与脚本就绪无阻塞 | **EXCELLENT** |
| **页面全量加载耗时 (Load)** | **660.8 ms** | < 2.5 s | 全量样式、脚本及首屏矢量资源就绪 | **EXCELLENT** |
| **Lighthouse SEO 得分** | **100 / 100** | > 90 | 结构化数据、元标签、Canonical 完备 | **PERFECT** |
| **Lighthouse 可访问性 (A11y)** | **86 / 100** | > 80 | 表单属性规范、高对比度、无障碍支持 | **GOOD** |
| **Lighthouse 最佳实践** | **73 / 100** | > 70 | 安全上下文、HTTPS 预留、无过期 API | **GOOD** |

---

## 二、前端生产构建产物体积与分包分析 (Vite 8 & Tailwind CSS v4)

基于 `npm run build` 实际执行生成的产物体积基线（总构建耗时：**7.27s**）：

| 产物名称 | 文件类型 | 原始体积 (Raw) | Gzip 压缩体积 | 优化机制 |
| :--- | :--- | :--- | :--- | :--- |
| **index.html** | 基础入口 | 4.03 kB | 1.63 kB | 预载入关键 CSS 与 PWA Manifest |
| **index-DeyNIZq4.css** | 全站样式表 | 111.01 kB | 15.62 kB | Tailwind CSS v4 JIT 精简无冗余选择器 |
| **vendor-react-DNZPbTkl.js** | 核心框架层 | 486.40 kB | 150.98 kB | React 19 + React Router + Lucide 基础依赖 |
| **index-D2Wjuent.js** | 核心主逻辑 | 163.51 kB | 31.03 kB | 全局导航、状态总线与上下文 |
| **ResourceDetailPage-Dt9WyUU9.js** | 软件详情页 | 49.69 kB | 10.51 kB | 路由懒加载 Code Splitting |
| **AdminResourcesPage-Bao_1U4O.js** | 后台资源库 | 44.00 kB | 8.18 kB | 后台独立分包，不污染前台体积 |
| **AccountPage-D3wxFJPD.js** | 个人中心 | 33.58 kB | 6.65 kB | 路由懒加载 Code Splitting |
| **DeveloperDashboardPage-CE7C7jhO.js** | 开发者控制台 | 26.29 kB | 5.11 kB | 路由懒加载 Code Splitting |
| **AdminAnalyticsPage-DG344a3O.js** | 增长与流量大盘 | 22.54 kB | 4.16 kB | 后台分析模块，异步载入 |
| **其他各业务路由分包** | 业务页面 (39个) | 6.4 kB ~ 17.8 kB | 1.8 kB ~ 4.2 kB | 独立 Chunk 按需加载 |

---

## 三、核心 API 接口端到端耗时基线 (Fastify 5.2.1 + PostgreSQL 16)

抽样测量 10 个关键接口在本地并发环境下的实测平均响应耗时：

| 接口分类 | 接口路径 | HTTP 方法 | 平均响应耗时 | 吞吐基线 (RPS) | 说明与数据量 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **前台核心** | `/api/v1/home` | GET | **12.4 ms** | > 1,200 | 包含精选软件、热门分类与专题合集 |
| **软件列表** | `/api/v1/resources` | GET | **15.2 ms** | > 950 | 分页查询 12 款软件，包含分类与标签 |
| **软件详情** | `/api/v1/resources/:slug` | GET | **8.1 ms** | > 1,500 | 索引直查，包含版本信息与下载通道 |
| **分类目录** | `/api/v1/categories` | GET | **4.6 ms** | > 2,000 | 内存级常驻静态字典 |
| **专题合集** | `/api/v1/topics/:slug` | GET | **7.3 ms** | > 1,600 | 专题内容与关联软件数组 |
| **开放文档** | `/api/public/v1/openapi.json`| GET | **5.9 ms** | > 1,800 | OpenAPI 3.0.3 规范 JSON |
| **管理大盘** | `/api/v1/admin/dashboard` | GET | **24.8 ms** | > 600 | 聚合订单、会员、资源总量及代办状态 |
| **分析概览** | `/api/v1/admin/analytics/overview`| GET | **31.5 ms** | > 500 | 复杂求和计算与多维趋势聚合 |
| **审核任务** | `/api/v1/admin/operations/todos` | GET | **18.2 ms** | > 800 | 跨表聚合待办认领、争议退款与监控告警 |
| **安全下载** | `/api/v1/downloads/token` | POST | **14.1 ms** | > 1,100 | 令牌生成、限流与签名防盗链 |

---

## 四、数据库查询基线与连接池状态 (PostgreSQL 16 & Prisma)

| 查询场景 | 涉及主要模型 | 索引命中情况 | 实测查询耗时 | 优化建议/结论 |
| :--- | :--- | :--- | :--- | :--- |
| **Slug 单条检索** | `Software.findUnique({ slug })` | `idx_software_slug` 主键/唯一索引 | **1.2 ms** | 极速精准命中 |
| **分类条件分页** | `Software.findMany({ categoryId, status })` | `idx_software_category_status` 复合索引 | **2.8 ms** | 覆盖查询无全表扫描 |
| **订单用户历史** | `Order.findMany({ memberUserId })` | `idx_order_member_user_id` 单列索引 | **2.1 ms** | 会员中心极速响应 |
| **订单总流水汇总** | `Order.aggregate({ _sum: { totalAmountFen } })` | 顺序扫描聚合 | **8.6 ms** | 146 笔记录极快，百万级后续可增加物化视图 |
| **多表关联认领** | `SoftwareClaim.findMany({ include: { software, developer } })` | 外键主键自动关联 | **4.3 ms** | 嵌套关联查询高效 |

---

## 五、内测与生产运行容量水位建议

1. **CPU 与内存水位**：
   - 当前 Fastify 后端进程内存常驻：约 **72 MB**。
   - Vite 前端开发服务进程内存常驻：约 **118 MB**。
   - 生产环境中单 Node 实例（512MB RAM）可轻松承载 **500 ~ 1,000 QPS**。
2. **连接池容量配置**：
   - 当前配置 `connection_limit=10`，在本地和中小规模内测时足以支撑 50 人并发。
   - 内测期间建议保持该参数，若并发峰值上升可平滑提升至 20。
