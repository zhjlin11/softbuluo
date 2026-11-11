# 软游部落 P8.7.8 —— 软件教程频道升级基线审计报告

**报告生成时间**：2026-11-11  
**阶段代号**：P8.7.8  
**目标栏目**：`https://softtribe.top/tutorials` （本地 `http://localhost:3000/tutorials`）  
**工程根目录**：`E:\Code\新建文件夹`  

---

## 一、Git 与代码版本状态

- **当前分支**：`main`
- **上游远程仓库**：`origin/main` (`https://github.com/zhjlin11/softbuluo.git`)
- **最新提交 Commit**：`5275070` (`docs(p8710): record production deployment success and online smoke test results`)
- **工作区状态**：干净（除运行中生成的临时审计脚本外无未提交冲突）
- **基线测试水平**：P8.7.10 阶段全站通过 **24 个测试套件，720 项测试全部通过，0 失败**。

---

## 二、教程数据与模型基线审计

### 2.1 Prisma Schema 模型现状
数据库中 `Tutorial` 表结构如下：
```prisma
model Tutorial {
  id             String    @id @default(cuid())
  title          String
  slug           String    @unique
  summary        String
  content        String
  coverUrl       String?
  authorId       String
  softwareId     String?
  status         String    @default("PUBLISHED")
  isPremium      Boolean   @default(false)
  viewCount      Int       @default(0)
  seoTitle       String?
  seoKeywords    String?
  seoDescription String?
  publishedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  software       Software? @relation(fields: [softwareId], references: [id], onDelete: SetNull)

  @@index([slug])
  @@index([softwareId])
}
```

### 2.2 数据库真实数据统计
- **教程总数**：27 篇
- **已发布教程（PUBLISHED）**：27 篇
- **草稿数（DRAFT）**：0 篇
- **测试数据（isTestData）**：0 篇（所有关联软件 `isTestData === false`）
- **关联软件教程数**：17 篇（明确关联已收录软件，如 Rufus、Everything、CrystalDiskInfo、Wireshark、7-Zip、Git、RustDesk、OBS Studio 等）
- **独立通用技术指南数**：10 篇（如 Windows 11 原版纯净装机、ISO 哈希校验、下载来源安全规范等）

### 2.3 教程正文内容与结构特征
- 25 篇教程具有标准 Markdown 结构（包含一级/二级标题 `#`、`##`、无序列表、引用说明等）。
- 具备代码块的教程（包含 `powershell`、`cmd`、`bash` 代码片段，需支持一键复制与安全展示）。
- 涉及高风险系统操作的教程（如磁盘分区、绕过 TPM、自启清理、注册表修改等，需展示高风险操作告警与安全回退建议）。

---

## 三、现有功能与主要缺陷审计

### 3.1 教程列表页（`/tutorials`）
1. **分类过滤在客户端执行**：当前前端拉取全量数据后使用 `Array.prototype.filter` 匹配标题/摘要，无法与分页结合，缺乏服务端高阶搜索支持。
2. **缺乏独立 UI 3.0 门户布局**：仅有单一的横幅和网格卡片，没有 65%/35% 焦点教程展示，没有热门常见问题排障快捷解决入口（如蓝屏排障、系统重装、启动盘制作等）。
3. **缺乏多维过滤能力**：缺少适用操作系统（Windows 11 / Windows 10 / 通用）、难度等级（入门 / 进阶 / 专业）、排序规则（最新发布 / 浏览热度 / 最近维护）等多维检索。

### 3.2 教程详情页（`/tutorials/:slug`）
1. **正文渲染简陋与硬编码**：旧版代码中硬编码了 3 个假步骤（“1. 准备工作与环境核验”、“2. 步骤详解”、“3. 常见故障”），在下方直接用 `whitespace-pre-line` 输出原始 content，导致 Markdown 标题、代码块、列表、链接格式错乱。
2. **缺少动态目录（TOC）**：右侧导航写死 3 个固定条目，无法根据文章实际 H2/H3 标题动态生成锚点、追踪阅读进度。
3. **代码块体验缺失**：无语法高亮、无一键复制代码按钮、无复制成功反馈。
4. **图片交互缺失**：正文中的图片无法点击放大（缺少 Lightbox 遮罩预览与键盘 ESC 退出）。
5. **缺少实操前置准备清单**：未提供用户可阅读辅助勾选的前置条件（如“是否具备管理员权限”、“是否已备份重要数据”）。
6. **缺少高风险警示组件**：对格式化、分区操作缺少显目的风险提示条。

### 3.3 服务端与 SEO / SSR
1. `/tutorials` 频道首页在 `server/src/modules/seo/seoRoutes.ts` 中尚未注册专属 SSR 路由（目前仅有 `/tutorials/:slug` 的 SSR），需要补齐 `renderTutorialsChannelHtml`。
2. 频道推荐配置中 `ALLOWED_CHANNELS` 缺少 `'TUTORIALS'`，需纳入官方频道推荐体系。
3. 现有的 `/sitemap-tutorials.xml` 和 `/sitemap.xml` 正常，需确保与更新后的路由和标题保持一致。

---

## 四、改版前浏览器截图归档

- 桌面端 1440px 基线截图：`before_p878_tutorials_1440.png`
- 移动端 390px 基线截图：`before_p878_tutorials_390.png`
- 截图保存路径：`C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/`

---

## 五、拟修改与新建文件清单

| 文件路径 | 操作性质 | 核心职责 |
| :--- | :---: | :--- |
| `server/src/modules/channels/tutorialsChannelService.ts` | **新建** | 教程频道聚合服务（门户数据、多维筛选检索、分类统计、快捷排障入口） |
| `server/src/modules/channels/softwareChannelService.ts` | 修改 | 将 `'TUTORIALS'` 加入 `ALLOWED_CHANNELS` 保证统一推荐位治理 |
| `server/src/modules/channels/channelRoutes.ts` | 修改 | 注册 `GET /api/v1/channels/tutorials` 门户聚合接口 |
| `server/src/modules/tutorials/tutorialAdminRoutes.ts` | 修改 | 增强详情 API：关联推荐、上一篇/下一篇、前置核验项、风险标志提取 |
| `server/src/modules/seo/seoService.ts` | 修改 | 增加 `renderTutorialsChannelHtml()` 与完善教程结构化数据（JSON-LD） |
| `server/src/modules/seo/seoRoutes.ts` | 修改 | 注册 `GET /tutorials` 服务端渲染兜底与 Canonical 一致性 |
| `src/services/tutorialService.ts` | **新建** | 前端类型安全教程数据调用接口与 DTO 定义 |
| `src/components/tutorials/TutorialsHero.tsx` | **新建** | 65%/35% UI 3.0 教程门户 Hero 与热门排障快捷入口 |
| `src/components/tutorials/TutorialsFilterBar.tsx` | **新建** | 分类、关键词、难度、平台、排序等多维筛选栏 |
| `src/components/tutorials/TutorialCard.tsx` | **新建** | 现代化图文卡片（分类标签、阅读时长、真实发布日期、软件联动） |
| `src/components/tutorials/TutorialReader.tsx` | **新建** | 沉浸式教程阅读器（Markdown 完整解析、代码高亮、一键复制、图片预览） |
| `src/components/tutorials/TutorialTOC.tsx` | **新建** | 真实 H2/H3 标题动态目录、滚动高亮、锚点跳转、移动端折叠 |
| `src/components/tutorials/TutorialPreflight.tsx` | **新建** | 操作前准备清单（管理员权限、系统要求、备份提醒） |
| `src/components/tutorials/TutorialRiskBanner.tsx` | **新建** | 高风险系统操作安全警告横幅 |
| `src/components/tutorials/ImageLightbox.tsx` | **新建** | 支持 ESC 与点击关闭的图片全屏放大预览模态框 |
| `src/components/tutorials/RelatedSoftwareCard.tsx` | **新建** | P8.8 官方可信下载与软件详情直达卡片 |
| `src/pages/TutorialsPage.tsx` | **重写** | 现代化 UI 3.0 教程门户首页 |
| `src/pages/TutorialDetailPage.tsx` | **重写** | 沉浸式教程阅读与技术排障详情页 |
| `server/tests/p878TutorialsFinalPortalTest.ts` | **新建** | 40+ 项严苛自动化测试套件 |
| `scripts/runAllQualityTests.ts` | 修改 | 纳入全量质量自动化测试套件执行清单 |
