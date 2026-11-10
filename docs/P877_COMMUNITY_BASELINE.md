# 软游部落 P8.7.7 —— 社区交流频道 (Community) UI 3.0 改版基线报告

**报告生成时间**：2026-11-10 22:18 (CST)  
**目标页面**：`/community`、`/community/thread/:id`  
**基线状态**：`P877_COMMUNITY_BASELINE_RECORDED`  
**责任角色**：首席产品架构师、React 全栈工程师、社区产品经理、PostgreSQL 数据库工程师、安全工程师、Playwright 自动化测试负责人

---

## 一、改版前技术与数据基线审计

### 1.1 数据模型（Prisma Schema）
当前系统已有基础社区数据模型：
- **`DiscussionThread`**：
  - 字段：`id`, `softwareId` (可选关联软件), `userId`, `title`, `content`, `category`, `isPinned`, `isResolved`, `status`, `viewCount`, `replyCount`, `lastActivityAt`, `createdAt`, `updatedAt`
  - 关联：`software`, `user: MemberUser`, `posts: DiscussionPost[]`, `reports: DiscussionReport[]`
- **`DiscussionPost`**：
  - 字段：`id`, `threadId`, `userId`, `parentPostId`, `content`, `isDeveloperReply`, `status`, `createdAt`, `updatedAt`
  - 关联：`thread`, `user`, `reports`
- **`DiscussionReport`**：
  - 字段：`id`, `threadId`, `postId`, `reporterId`, `reason`, `status`, `adminNotes`, `resolvedBy`, `resolvedAt`, `createdAt`
- **`ModerationAction`**：
  - 字段：`id`, `targetType`, `targetId`, `action`, `reason`, `moderatorId`, `createdAt`
- **当前枚举**：
  - `DiscussionCategory`: `EXPERIENCE`, `INSTALL_ISSUE`, `QUESTION`, `FEEDBACK`
  - `DiscussionStatus`: `ACTIVE`, `PENDING_REVIEW`, `HIDDEN`, `DELETED`
  - `ReportStatus`: `PENDING`, `RESOLVED`, `DISMISSED`

### 1.2 本地实际数据库记录盘点
经真实 PostgreSQL 数据库审计：
- **`DiscussionThread` 总数**：2 条
  - `cmwammrve000fvkhwxvoaoez4`: Blender 顶尖开源全能三维动画与渲染套件 官方建议征集帖
  - `cmwammrva000dvkhw7xugqtr4`: 软游部落 UI 2.1 与 P6 综合体验交流贴
- **`DiscussionPost` 总数**：1 条
  - `cmwammrvi000hvkhw4ypwat2d`: 官方认证开发者回复
- **`DiscussionReport` 总数**：1 条
- **`MemberUser` 真实用户总数**：258 个

---

## 二、改版前 UI / UX 与功能局限分析

| 维度 | 当前基线状态 | 存在缺陷与改进点 |
| :--- | :--- | :--- |
| **页面布局** | 单列居中简单卡片列表 | 缺乏 UI 3.0 高密度技术社区专业感，缺少桌面端 70%/30% 主从分区与侧边栏 |
| **头部 Hero** | 简单文字横幅 | 高度与信息层次单薄，未强化“软游部落技术问答与电脑维修互助”的定位与发帖引导 |
| **分类体系** | 仅支持 4 种基础枚举分类 | 缺少技术问答、系统工具、电脑维修、装机配置、网络安全等高频需求子分类 |
| **问答闭环** | 仅有 `isResolved` 布尔标记 | 缺少“采纳最佳回答”交互，无法将有效解答置顶并高亮呈现给后续遇到相同问题的用户 |
| **真实数据统计** | 页面无社区数据指标 | 缺乏透明可信的真实统计看板（帖子数、回复数、已解决率等真实统计） |
| **发帖交互** | 简陋弹窗，软件关联仅支持文本输入 ID | 无法方便搜索并挂载关联软件，缺少发帖规范提醒与排版提示 |
| **详情页体验** | 纯文本展示，代码与排版简陋 | 缺少代码高亮、格式化排版、楼层采纳动作、作者权限控制、侧边作者卡片 |
| **响应式支持** | 移动端有基础响应式但间距略显松散 | 需针对 1440px / 1280px / 1024px / 768px / 390px 做像素级高密度优化与防溢出保护 |

---

## 三、基线截图归档

Playwright 已完成对当前本地社区页面的全屏基线拍摄：
1. **桌面端基线 (1440px)**：`p877_before_community_1440.png`
2. **移动端基线 (390px)**：`p877_before_community_390.png`

---

## 四、改版目标与绝对边界

### 4.1 核心用户闭环
**浏览社区 → 搜索问题 → 查看讨论 → 登录发帖 → 获得回复 → 选择有效解答 → 标记问题解决 → 沉淀技术经验**

### 4.2 绝对修改边界
- **仅升级**：
  - `/community` 社区门户主页
  - `/community/thread/:id` (兼容 `/community/:id`) 讨论与问答详情页
  - 社区专用组件模块：`src/components/community/*`
  - 社区服务与后端治理路由：`server/src/modules/community/*`
  - 对应 SEO 与自动化测试
- **严格保护不得变更**：
  - 首页 `/`、电脑软件 `/software`、系统工具 `/system-tools`、游戏中心 `/games`、装机必备 `/essentials`、对比评测 `/compare`、软件教程 `/tutorials`、最近更新 `/updates`
  - 全站 Header、Footer、Logo、会员鉴权、下载系统与支付订单核心
- **安全与数据诚信准则**：
  - 严禁伪造机器人用户、虚假刷量、伪造在线人数
  - 数据冷启动完全依赖系统真实公告、管理员指引贴与真实会员互动
  - 严禁未经用户明确授权直接执行生产部署
