# 软游部落 P8.7.8 —— 软件教程频道 UI 3.0 生产环境部署方案与回滚预案

**生成时间**：2026-11-11  
**阶段代号**：P8.7.8  
**目标环境**：腾讯云生产服务器（`ubuntu@134.175.230.107`）  
**正式站地址**：`https://softtribe.top/tutorials`  
**当前状态**：**`P878_LOCAL_PASSED`**（等待用户明确授权，未执行发布）  

---

## 一、严格部署安全边界

> [!IMPORTANT]
> **绝对准则**：未经用户明确输入授权指令（如“确认发布”），**绝对不得**向生产服务器上传代码、执行线上重启或修改生产数据库。本地验收已通过，所有部署物料均处于预制待命状态。

---

## 二、部署前自检清单（Pre-flight Checklist）

- [x] 本地全阶段回归测试：25 个测试套件，752 项测试全部通过（0 失败）。
- [x] TypeScript 类型检查：`npx tsc --noEmit` 0 错误。
- [x] 前端生产 Bundle 构建：`npm run build` 成功（产物位于 `dist/`，无任何缺失依赖）。
- [x] 数据库 Schema 兼容性：本次未新增破坏性 Prisma 字段，现有 `Tutorial` 表结构完全兼容，无需在生产库执行任何 DDL Migration。
- [x] 七大导航防回退检查：前台单一可信源严格为 7 项，无对比评测与社区交流。
- [x] SSH 密钥就绪：`C:\Users\Administrator\.ssh\id_antigravity` 连接正常。

---

## 三、生产部署执行步骤（待授权后执行）

### 步骤 1：本地提交并推送到 GitHub 远程仓库
```bash
git add .
git commit -m "feat(tutorials): complete P8.7.8 Tutorials Channel UI 3.0 portal upgrade and immersive reader"
git push origin main
```

### 步骤 2：生产服务器全量快照备份（约 20 秒）
通过 SSH 在生产服务器创建部署前备份：
```bash
ssh -i C:\Users\Administrator\.ssh\id_antigravity ubuntu@134.175.230.107 "sudo mkdir -p /var/www/backups && sudo tar -czf /var/www/backups/softtribe_pre_p878_backup.tar.gz -C /var/www/softtribe.top dist server package.json"
```

### 步骤 3：构建生产打包传输物料并推送到生产服务器
```bash
# 压缩打包生产发布物料
tar -czf p878_deploy_payload.tar.gz dist server/src server/prisma package.json

# SCP 传输至生产服务器
scp -i C:\Users\Administrator\.ssh\id_antigravity p878_deploy_payload.tar.gz ubuntu@134.175.230.107:/tmp/

# 解压并更新到部署根目录
ssh -i C:\Users\Administrator\.ssh\id_antigravity ubuntu@134.175.230.107 "sudo tar -xzf /tmp/p878_deploy_payload.tar.gz -C /var/www/softtribe.top/ && sudo rm /tmp/p878_deploy_payload.tar.gz"
```

### 步骤 4：无缝平滑重载 PM2 进程
```bash
ssh -i C:\Users\Administrator\.ssh\id_antigravity ubuntu@134.175.230.107 "pm2 reload softtribe-backend"
```

### 步骤 5：线上冒烟验收脚本执行
执行预备脚本 `scripts/smokeTestP878Prod.ts`，验证线上正式站：
1. `https://softtribe.top/` (HTTP 200)
2. `https://softtribe.top/tutorials` (HTTP 200, Title, H1)
3. `https://softtribe.top/tutorials/rufus-win11-bypass-tpm-guide` (HTTP 200)
4. `https://softtribe.top/api/v1/channels/tutorials` (HTTP 200, 27篇教程)
5. `https://softtribe.top/sitemap-tutorials.xml` (HTTP 200)
6. 线上 Playwright 捕获 `prod_p878_tutorials_1440.png` 与 `prod_p878_tutorials_390.png`。

---

## 四、秒级紧急回滚预案（Rollback Plan）

若部署后线上出现任何非预期的 500 异常或渲染崩溃，可在 30 秒内一键秒级恢复：

```bash
# 触发一键回滚指令
ssh -i C:\Users\Administrator\.ssh\id_antigravity ubuntu@134.175.230.107 "sudo tar -xzf /var/www/backups/softtribe_pre_p878_backup.tar.gz -C /var/www/softtribe.top/ && pm2 reload softtribe-backend"
```
回滚完成后重新运行线上巡检，确认业务恢复至上一稳定版本。
