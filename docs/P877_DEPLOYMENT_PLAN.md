# 软游部落 P8.7.7 —— 社区交流频道 (Community) 生产发布部署计划

**文档版本**：P8.7.7-DEPLOY-PLAN-V1  
**编制时间**：2026-11-10 22:46 (CST)  
**当前状态**：`READY_FOR_DEPLOYMENT_AUTHORIZATION` (待用户明确授权)  
**目标服务器**：腾讯云生产服务器 (`134.175.230.107`)  
**正式站点域名**：`https://softtribe.top/`  
**核心发布路径**：`/community`、`/community/thread/:id`、`/sitemap-community.xml`

---

## 一、发布范围与变更清单

### 1.1 数据库结构变更 (PostgreSQL)
- **枚举拓展**：`DiscussionCategory` 新增 4 个技术子分类：
  - `WINDOWS` (Windows系统维护)
  - `REPAIR` (电脑维修与装机)
  - `NETWORK` (网络与安全)
  - `GAMES` (游戏讨论)
- **数据表新增字段**：
  - `DiscussionThread`:
    - `acceptedPostId` (String?, 可选外键指针，指向被采纳的有效解答楼层)
    - `tags` (String?, 可选标签字段，用于存储多标签检索)
  - `DiscussionPost`:
    - `isAccepted` (Boolean, 默认 false，标识该楼层是否为采纳的最佳解答)

### 1.2 服务端后端能力 (Fastify)
- 开放统计接口：`GET /api/v1/community/stats`（纯净透明真实指标，绝无假数据）
- 待解决求助接口：`GET /api/v1/community/pending`（侧边栏待解答展示）
- 采纳解答接口：`POST /api/v1/community/threads/:id/resolve`（权限校验：题主或管理员）
- 撤销解决接口：`POST /api/v1/community/threads/:id/unresolve`（权限校验：题主或管理员）
- SEO 服务端渲染 (SSR)：
  - `GET /community` (服务端生成包含 Schema.org CollectionPage 的 HTML5)
  - `GET /community/thread/:id` (服务端生成包含 Schema.org QAPage & acceptedAnswer 的 HTML5)
  - 动态站点地图：`GET /sitemap-community.xml`

### 1.3 前端构建产物 (React 19 + Vite 8)
- UI 3.0 高密度门户化重构：`CommunityPage`、`CommunityDetailPage`
- 新增现代组件：
  - `CommunityHero.tsx`（紧凑横幅与发帖触发）
  - `CommunityFilterBar.tsx`（8 大板块 + 4 大状态切换）
  - `CommunityThreadList.tsx`（高密度卡片讨论流）
  - `CommunitySidebar.tsx`（真实统计、待解决求助、发帖公约）
  - `CommunityCreateModal.tsx`（关联软件搜索、标签、字数统计）
  - `CommunityReportModal.tsx`（多维违规原因举报）

---

## 二、部署前自检与质量门禁

| 检查项 | 验证指标 | 本地实际状态 |
| :--- | :--- | :--- |
| **自动化测试套件** | 全部 22 个测试套件，通过率 100% | ✅ PASS (662 项通过，0 失败) |
| **前端编译打包** | `npm run build` 成功且零告警 | ✅ PASS (打包完成于 8.59s) |
| **多视口横向防溢出** | 1440px / 1280px / 1024px / 768px / 430px / 390px | ✅ PASS (6 大视口零溢出) |
| **既有核心业务隔离** | 首页、软件、系统工具、游戏、装机必备、对比评测 | ✅ PASS (核心频道无污染回归) |
| **生产数据库操作安全性** | 增量字段均带默认值或可为空，无破坏性变更 | ✅ PASS (无损平滑迁移) |

---

## 三、标准生产发布流程 (待授权触发)

收到用户明确发布指令（如“确认发布”或“开始部署”）后，执行以下 5 步标准发布流水线：

```
[步骤 1] 远程数据备份 (PostgreSQL pg_dump 自动生成软回滚底包)
   ↓
[步骤 2] 打包本地构建产物 (前端 dist/ + 后端 server/ + prisma/)
   ↓
[步骤 3] SCP 安全传输发布压缩包至远程生产服务器临时目录
   ↓
[步骤 4] 远程解压、执行 prisma db push、PM2 热重载 (softbuluo-server)
   ↓
[步骤 5] 生产环境浏览器端真实探针验收 (1440px / 390px 截图归档与健康检查)
```

### 3.1 紧急回滚预案
如若在生产发布后发现任何线上异常：
1. **服务快速回滚**：PM2 切换回滚至上一个稳定版本备份包。
2. **数据库结构**：新增的字段均为可选字段，保留现有数据无需物理回滚即可兼容旧版代码运行。
3. **Nginx 状态保护**：全程保障静态资源托管与反向代理高可用。
