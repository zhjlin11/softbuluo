# 软游部落 P8.7.5.1 —— 生产环境部署实施与回滚预案

> **项目名称**：软游部落（SoftTribe）  
> **正式域名**：`https://softtribe.top/`  
> **生产服务器**：`134.175.230.107`  
> **目标页面**：`/essentials`（装机必备）  
> **执行阶段**：P8.7.5.1 装机必备质量专项修复生产发布准备  
> **当前状态**：`P8751_PRODUCTION_DEPLOYED`（已获用户明确授权并完成生产部署与冒烟验证）

---

## 1. 发布前置检查清单

在用户下达正式部署指令前，必须确认以下检查项全部处于就绪状态：

- [x] 本地 Git 分支处于 `main`，工作区整洁，代码改动已审查。
- [x] TypeScript 类型检查通过（`npx tsc --noEmit` 0 错误）。
- [x] 前端生产打包构建通过（`npm run build` 耗时 13.53s，生成于 `dist/` 目录）。
- [x] 全阶段 20 个测试套件全部执行通过（`527 passed, 0 failed`）。
- [x] Playwright 6 视口（390px ~ 1440px）响应式、0 溢出、0 破图、CLS <= 0.0022 验证通过。
- [x] 清单导出 TXT 与 JSON 内容已确认使用 `https://softtribe.top/software/`，无 `localhost` 泄露。
- [x] 生产服务器（`134.175.230.107`）SSH 密钥就绪，PM2 进程状态健康。
- [ ] **用户明确批准执行生产发布命令**（发布严格受控，未获授权绝不执行）。

---

## 2. 数据库变更说明

- **DDL 结构变更**：**无（Zero DDL Change）**。
- **Prisma Schema**：数据模型完全保持不变，无需执行 `prisma migrate` 或 `prisma db push`。
- **数据修补（DML）**：**无破坏性改动**。当前排行榜与统计均基于现有的 `DownloadEvent` 和 `Software.viewCount` 实时聚合，无需手工清洗数据表。

---

## 3. 代码打包与远程同步流程（待授权执行）

当用户发出「确认发布」或「部署上线」指令后，按如下标准步骤执行：

### 步骤 1：本地提交并推送到远端 Git 仓库
```powershell
git add .
git commit -m "feat(essentials): P8.7.5.1 装机必备质量专项修复与数据治理 (真实非测试双榜/无localhost安全导出/MemTest86隔离/教程提示词优化)"
git push origin main
```

### 步骤 2：登录远程服务器拉取最新代码
```bash
ssh -i /path/to/key root@134.175.230.107
cd /var/www/softbuluo  # 或生产项目根目录
git pull origin main
```

### 步骤 3：安装依赖与生产编译
```bash
# 检查依赖与构建前端
npm install --production=false
npm run build

# 校验构建产物
ls -la dist/assets/EssentialsPage-*.js
```

### 步骤 4：更新静态资源目录并平滑重载 Fastify 服务
```bash
# 同步 dist 静态文件到 Nginx Web 目录（如需要）
# 平滑重载 PM2 后端进程
pm2 reload softbuluo-backend --update-env
# 或
pm2 restart softbuluo-backend
```

### 步骤 5：Nginx 配置与反代核验
```bash
nginx -t
systemctl reload nginx
```

---

## 4. 线上冒烟验证清单（发布后即刻执行）

上线完成后，应立即通过独立网络环境执行以下验证：

1. **核心页面访问**：
   - `curl -sI https://softtribe.top/essentials` 必须返回 `HTTP/2 200`
   - 检查响应头包含正确的缓存与安全策略
2. **SSR 页面元数据检查**：
   - 页面 H1 必须包含「新电脑装机与必备软件中心」
   - Canonical 链接必须为 `https://softtribe.top/essentials`
   - JSON-LD 必须包含 `ItemList` 结构化数据
3. **聚合接口与真实榜单验证**：
   - `curl -s https://softtribe.top/api/v1/channels/essentials | jq '.data.leaderboards'`
   - 验证浏览榜（mostViewed）与下载榜（mostDownloaded）数据全部大于 0，且 Chrome 等排位与数据库完全对齐
4. **清单交互与导出测试**：
   - 打开浏览器访问 `https://softtribe.top/essentials`
   - 点击装机方案卡片切换至「游戏电竞」
   - 点击「导出 TXT 清单」，打开下载的文本，确认无 `localhost:3000` 泄露
   - 点击「导出 JSON 清单」，确认 `detailUrl` 均以 `https://softtribe.top/software/` 起始
5. **历史频道防退化核查**：
   - `/`（首页）：HTTP 200
   - `/software`（电脑软件）：HTTP 200
   - `/system-tools`（系统工具）：HTTP 200
   - `/games`（游戏中心）：HTTP 200（保持 2 款已发布游戏）

---

## 5. 故障回滚预案（Rollback Plan）

若线上发布出现任何异常（如 PM2 崩溃、Nginx 报错 502/500、样式错乱），按以下预案在 3 分钟内完成回滚：

### 快速回滚操作步骤：
1. **回退 Git 版本**：
   ```bash
   cd /var/www/softbuluo
   git log --oneline -n 3
   git reset --hard HEAD~1
   ```
2. **重新编译前端产物**：
   ```bash
   npm run build
   ```
3. **重启 PM2 后端应用**：
   ```bash
   pm2 restart softbuluo-backend
   ```
4. **验证服务恢复**：
   ```bash
   curl -sI https://softtribe.top/essentials
   ```

---

## 6. 发布执行结果记录

> [!NOTE]
> **发布时间**：2026-11-10 18:55:36 (UTC+8)  
> **备份目录**：`/home/ubuntu/backup_p8751_20261110_185536`  
> **生产服务**：PM2 `softtribe-backend` (PID: 1662336, cluster mode, status: online)  
> **线上验证**：
> - `https://softtribe.top/essentials`: HTTP/2 200 OK  
> - `https://softtribe.top/sitemap-essentials.xml`: HTTP/2 200 OK  
> - `https://softtribe.top/api/v1/channels/essentials`: 真实非测试双榜、8步安装指引、6套合规方案全部生效  
> - 全量频道防退化：`/` (200), `/software` (200), `/system-tools` (200), `/games` (200, 2 款已发布游戏) 全部正常在线。  
> 
> **判定结论**：生产发布圆满成功，系统状态健康。
