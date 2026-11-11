# 软游部落 P8.7.10 —— 生产部署与应急回滚方案

## 一、部署前安全纪律与状态确认

- **当前阶段**：本地全量开发与验证通过 (`P8710_LOCAL_PASSED_WITH_WARNINGS`)
- **正式域名**：`https://softtribe.top/`
- **正式服务器 IP**：`134.175.230.107`
- **远程目录**：`/www/wwwroot/softtribe`
- **安全红线**：
  - **未经用户明确发出“确认发布”指令，严禁连接线上服务器执行任何上传、Migration 或 PM2 重载！**
  - 当前所有工作严格限定在本地开发与自动化验证范围内。

---

## 二、生产变更内容清单

1. **前端变更**：
   - `src/pages/UpdatesPage.tsx`：全新 UI 3.0 门户化升级，替换旧版双 Tab。
   - `src/services/updatesService.ts`：新增更新频道专用 API 服务层。
   - `src/components/updates/*`：新增 Hero、FilterBar、Timeline、RecentlyAdded、Sidebar、VersionHistoryModal 等 6 个专业级组件。
   - 前端生产构建产物：`dist/` 静态资源更新。
2. **后端变更**：
   - `server/src/modules/channels/updatesChannelService.ts`：最新更新核心聚合服务。
   - `server/src/modules/channels/channelRoutes.ts`：新增 `/api/v1/channels/updates` 与 `/version-history/:softwareId`。
   - `server/src/modules/channels/softwareChannelService.ts`：`ALLOWED_CHANNELS` 扩充 `'UPDATES'`。
   - `server/src/modules/seo/seoService.ts`：新增 `renderUpdatesChannelHtml` SSR HTML 渲染。
   - `server/src/modules/seo/seoRoutes.ts`：新增 `/updates` SSR 路由、`/sitemap-updates.xml` 路由并同步 `robots.txt`。
3. **数据库变更**：
   - **零 Schema 变更**：完全复用已存在的 `Software`、`SoftwareVersion`、`DownloadSource`、`ChannelRecommendation`，无需执行不可逆数据库迁移。

---

## 三、待用户授权后的原子部署执行步骤（预案）

当用户明确回复“确认发布”后，按以下标准运维流水线执行：

### 步骤 1：本地构建与完整性封包
```bash
# 1. 执行 TypeScript 静态类型校验
npx tsc --noEmit

# 2. 执行 Vite 8 生产打包
npm run build

# 3. 运行全量 24 个自动化质量套件
npx tsx scripts/runAllQualityTests.ts
```

### 步骤 2：生产数据库与线上运行环境备份
```bash
# 连接线上服务器执行备份
ssh root@134.175.230.107
cd /www/wwwroot/softtribe

# 备份当前生产 PostgreSQL 数据库
pg_dump -U softtribe -d softtribe > /www/backup/softtribe_p8710_pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# 备份当前线上构建产物与源码
tar -czf /www/backup/dist_backup_$(date +%Y%m%d_%H%M%S).tar.gz dist/
```

### 步骤 3：代码推送与生产同步
```bash
# 本地提交并推送到远端 Git
git add .
git commit -m "feat(updates): complete P8.7.10 Updates Channel UI 3.0 portal upgrade and 7 channels acceptance"
git push origin main

# 线上服务器拉取
ssh root@134.175.230.107
cd /www/wwwroot/softtribe
git pull origin main
npm run build
```

### 步骤 4：PM2 平滑重载
```bash
# 优雅重载后端 Fastify 进程
pm2 reload softtribe-server
pm2 status
```

### 步骤 5：生产线上实时冒烟验证 (Smoke Testing)
1. 验证聚合接口：`curl -s https://softtribe.top/api/v1/channels/updates | jq .success`
2. 验证版本历史：`curl -s https://softtribe.top/api/v1/channels/updates/version-history/windows-10 | jq .success`
3. 验证 SSR 响应：`curl -s -I https://softtribe.top/updates | grep "200 OK"`
4. 验证 Sitemap：`curl -s https://softtribe.top/sitemap-updates.xml | grep "<urlset"`
5. 验证 robots.txt：`curl -s https://softtribe.top/robots.txt | grep "sitemap-updates.xml"`
6. 验证七大主导航页面：逐一请求 `/`、`/software`、`/system-tools`、`/games`、`/essentials`、`/tutorials`、`/updates`，确认全部返回 HTTP 200。
7. 验证历史隐藏路由：`/compare`、`/community` 均正常返回 200，无 404。

---

## 四、应急回滚预案（Rollback Plan）

若部署上线后出现任何阻断性故障，5 分钟内执行以下原子回滚指令：

```bash
ssh root@134.175.230.107
cd /www/wwwroot/softtribe

# 1. 恢复 Git 到 P8.7.9 稳定版本 (Commit 62858c7)
git checkout 62858c7

# 2. 恢复前端构建产物
npm run build

# 3. 优雅重载后端
pm2 reload softtribe-server

# 4. 验证回滚后网站正常
curl -I https://softtribe.top/
```

---

## 五、当前结论

本地开发、组件构建、后端接口、SEO 渲染、测试套件扩充与浏览器自动化验收全部就绪。当前系统处于最高安全受控状态，**等待用户进一步审核并明确授权发布**。
