# 软游部落 P8-0 工程与生产资产基线审计报告

> **审计执行时间**：2026-11-09 21:20:00 (Asia/Shanghai) / 2026-11-09T13:20:00Z  
> **工程目录**：`E:\Code\新建文件夹`  
> **审计环境**：Node.js v22.14.0 | PostgreSQL 16.2 | Vite 8.3.6 | Fastify 5.12.8  
> **当前数据库**：`postgresql://postgres:postgres@localhost:5432/softbuluo?schema=public`  
> **执行角色**：首席技术架构师 / 生产运维与安全负责人

---

## 1. 代码仓库与版本状态 (Git Audit)

| 检查项 | 实际状态 | 详细说明 |
| :--- | :--- | :--- |
| **当前分支** | `main` | 代码主分支，已与远端 `origin/main` 保持最新同步基线 |
| **工作区状态** | 存在未提交修改与未跟踪新增目录 | 包含 P1–P7 迭代开发产生的前后端代码、脚本及部署文件 |
| **未跟踪目录** | `server/`, `scripts/`, `deploy/`, `backups/`, `docs/`, `public/screenshots/` | 均为全栈工程必需模块及运维保障资产 |
| **敏感文件过滤** | `.env` 已列入 `.gitignore` | 实际本地存在 `.env` (包含开发数据库连接及本地密钥)，生产配置未混入 Git |

---

## 2. 前后端构建与类型安全检查

- **前端构建 (`npm run build`)**：
  - 工具链：Vite 8.3.6 + React 19 + Tailwind CSS v4
  - 产物目录：`dist/` (包含 `index.html`, 50 个分块 JS bundle, 1 个 CSS bundle)
  - 构建结果：**0 错误、0 致命警告通过** (构建耗时 < 1.0s)
- **前端类型检查 (`npm run lint` / `tsc --noEmit`)**：
  - 结果：**0 TypeScript 错误通过**
- **后端类型检查 (`npx tsc --noEmit -p server/tsconfig.json`)**：
  - 结果：**0 TypeScript 错误通过**

---

## 3. 数据库结构与 Prisma Migration 历史

- **Prisma Schema**：`server/prisma/schema.prisma`
  - 涵盖模型数：**56 个模型 (Models)**
  - 枚举类型数：**18 个枚举 (Enums)**
- **物理迁移历史记录** (`server/prisma/migrations/`)：
  1. `20261108000000_init` (48 KB，涵盖 P1–P5 基础表结构、商品、订单、支付流水、SEO、对比评测等)
  2. `20261109000000_p6_ecosystem` (11 KB，涵盖开发者入驻、软件权属认领、社区讨论治理、开放 API 等)
- **迁移完整性**：所有迁移均已按顺序成功应用至本地数据库 `softbuluo`。

---

## 4. PostgreSQL 真实数据现状深度核验

经直接执行原生数据库查询脚本（无任何推断或伪造），当前开发/测试数据库 `softbuluo` 的真实数据记录如下：

### 4.1 软件与资源主体 (`Software`)
- **软件总记录数**：**99 款**
- **状态分布**：
  - 已发布 (`PUBLISHED`)：**36 款**（其中 20 款为真实正式收录软件，16 款为历史自动化测试生成之 `isTestData: true` 测试工具）
  - 待审核草稿 (`DRAFT`)：**63 款**（100% 隔离在草稿队列，绝无前台外泄）
  - 待初审 (`PENDING_REVIEW`)：**0 款**
  - 数据完整性待复核 (`NEEDS_REVIEW`)：**13 款**
  - 包含测试标识 (`isTestData: true`)：**16 款**

### 4.2 商业订单与支付流水 (`Order` & `PaymentLog`)
- **订单总记录数**：**136 笔**
  - 已支付 (`PAID`)：**78 笔** (总金额: 2438.60 元)
  - 超时关闭 (`CLOSED`)：**26 笔** (总金额: 517.40 元)
  - 已退款 (`REFUNDED`)：**23 笔** (总金额: 1316.00 元)
  - 待退款审核 (`REFUND_PENDING`)：**8 笔** (总金额: 91.20 元)
  - 待支付 (`PENDING_PAYMENT`)：**1 笔** (总金额: 19.90 元)
- **资金性质核验**：
  - 带有 `MOCK_` 前缀交易号：**29 笔**
  - 属于测试账号或含 `TEST` 订单号：**28 笔**
  - 模拟并发/超时测试回调：**21 笔**
  - **公网真实微信商户到账流水：0 笔**
  - **结论**：当前数据库内 100% 的订单均为开发阶段模拟及自动化测试生成的测试数据，绝对不得计入正式生产财务核算！

### 4.3 会员与用户体系 (`User` & `MemberUser` & `Entitlement`)
- **管理员账号 (`User`)**：**1 个** (`admin@softbuluo.com`，超管角色)
- **普通前台会员 (`MemberUser`)**：**85 个** (其中明确含测试邮箱/特征的账号为 14 个)
- **会员权益 (`Entitlement`)**：**108 条** (其中生效中 `ACTIVE` 为 **85 条**)

### 4.4 审核凭据与来源体系 (`ResourceReviewEvidence` & `DownloadSource`)
- **审核证据凭据总数**：**645 条**
  - `observedValue = NOT_SCANNED`：**129 条** (真实反映未进行本地病毒查杀)
  - `observedValue = NOT_CHECKED`：**129 条** (真实反映未提取数字证书)
- **官方数据来源 (`SoftwareSource`)**：**76 个** (100% 绑定官方顶级域名)
- **下载分发渠道 (`DownloadSource`)**：**110 条** (全部为官方直接外链)

### 4.5 开发者与社区生态资产
- **开发者档案 (`DeveloperProfile`)**：**1 个** (已认证通过)
- **软件认领申请 (`SoftwareClaim`)**：**1 条** (已认证通过)
- **社区讨论主题 (`DiscussionThread`)**：**2 篇** (含官方认证开发者回帖)
- **社区违规举报 (`DiscussionReport`)**：**1 条** (待审状态)
- **开放 API Key (`DeveloperApiKey`)**：**7 个** (全部采用 SHA-256 哈希存储)
- **API 调用统计 (`ApiUsageRecord`)**：**38 条**

### 4.6 运营内容与 SEO 资产
- **专题合集 (`Topic`)**：**13 个**
- **教程文章 (`Tutorial`)**：**29 篇** (已全部发布，包含 4 篇官方冷启动权威指南)
- **对比评测 (`SoftwareComparison`)**：**2 篇** (VS Code vs Sublime 等，已发布)
- **SEO 动态站点地图**：主地图 `sitemap.xml` 下挂 6 个独立子地图 (软件、游戏、对比、专题、开发者、社区)

---

## 5. 备份文件与归档资产检查

当前工程 `backups/` 目录下共留存 14 份数据库备份文件：
- **最新完整二进制导出**：`backups/backup_pre_p7.dump` (317,601 字节) 与 `backups/softbuluo_2026-11-09T12-55-40-535Z.dump` (325,129 字节)
- **历史里程碑备份**：涵盖 P5、P6、P7 阶段前后的全量快照，具备可靠的灾备回溯基础。

---

## 6. 部署脚本与运维资产现状

| 资产文件 | 功能定位 | 现行审计状态 |
| :--- | :--- | :--- |
| `deploy/nginx/softbuluo.conf` | 生产 Nginx 反向代理配置 | **就绪**。已移除非法 HSTS preload，配置限流与安全响应头 |
| `deploy/caddy/Caddyfile` | 生产 Caddy 自动化证书配置 | **就绪**。支持自动申请 Let's Encrypt 证书与 HTTP/3 反代 |
| `deploy/ecosystem.config.js` | PM2 生产集群配置 | **就绪**。配置 `instances: max`, `exec_mode: cluster`, 1G 内存熔断 |
| `server/src/scripts/backupRestoreManager.ts` | 自动化定时备份与轮转 | **就绪**。支持最多保留 30 份备份并自动清理过期文件 |

---

## 7. 审计核心发现与 P8 行动指引

1. **测试数据污染严重**：现有数据库中混杂了自动化测试生成的 16 款测试软件（`test-tool-*`）、136 笔模拟支付订单、测试会员以及测试令牌。**生产环境绝不可直接使用当前数据库！必须在 P8-2 中完成物理级别的生产数据库隔离！**
2. **数据量统计差异原因已完全查清**：P7 报告不同时间点出现的“98 vs 99 款软件”、“126 vs 136 笔订单”是由于多次回归测试用例在数据库中临时插入测试数据造成的累积，后续将在 `docs/P8_DATA_RECONCILIATION.md` 中进行全量对账与定性。
3. **支付安全防线坚固但需参数规范化**：现有代码已具备生产禁止 MOCK 机制，但在环境变量命名上存在 `WECHAT_MCH_ID` 与 `WECHAT_PAY_MCHID` 等历史别名差异，需在 P8-3 中完成标准化归一。
