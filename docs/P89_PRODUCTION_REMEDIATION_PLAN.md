# 软游部落 P8.9 生产环境整改与部署方案（待授权实施）

## 一、生产整改原则与前提

> [!CAUTION]
> **安全红线**：根据架构规范，生产环境审计与修复方案制定并不等同于拥有线上变更授权。以下所有线上指令**必须在用户明确发出部署授权（如“确认发布”）后方可执行**。

---

## 二、整改任务优先级与分类

| 阶段 | 任务内容 | 影响范围 | 变更类型 | 风险等级 |
| :--- | :--- | :--- | :--- | :---: |
| **阶段 1** | **本地代码修复部署**<br>• SEO Canonical 规范化<br>• Sitemap XML 链接修正<br>• 文案真实度合规（去虚假标语）<br>• 教程测试数据隔离 (`tut-p3-*`) | 前端静态资源 `dist/`<br>后端路由与服务 `server/` | 代码更新 / PM2 重载 | **低风险**（已通过 752 项测试） |
| **阶段 2** | **线上 Nginx 爬虫 SSR 路由规则补齐**<br>• 将爬虫反代范围扩展至全部 7 大主频道与历史频道 | `/etc/nginx/sites-enabled/softtribe.top.conf` | Nginx 配置变更 | **低风险**（仅对爬虫 UA 生效） |
| **阶段 3** | **生产服务器磁盘空间清理**<br>• 清理 `/var/www/backups/` 中重复冗余的大体积历史归档 | 服务器本地磁盘存储 | 文件删除 | **低风险**（保留最新前置备份） |
| **阶段 4** | **PostgreSQL 每日定时自动备份脚本配置**<br>• 配置 Crontab 每天凌晨 03:00 自动 Dump 数据库 | 系统定时任务 Crontab | 运维配置新增 | **无风险**（只读 dump，不影响业务） |
| **阶段 5** | **生产 8080 明文调试端口安全收敛**<br>• 评估收敛公网访问或配置安全组白名单 | 生产防火墙 / Nginx 端口 | 网络安全加固 | **中风险**（需确认无外部硬编码依赖） |

---

## 三、分阶段具体实施步骤

### 阶段 1：本地代码成果上线（待用户授权）
1. **本地打包准备**：
   - 执行 `npm run build` 生成最新 `dist/`。
   - 打包 `dist/`、`server/`、`package.json` 为部署归档包。
2. **线上前置备份**：
   - 远程执行备份当前版本至 `/var/www/backups/softtribe_pre_p89_backup.tar.gz`。
3. **上传与解压**：
   - SCP 传输归档包并覆盖更新至 `/var/www/softtribe.top/`。
4. **PM2 热重载**：
   - 执行 `pm2 reload softtribe-backend`。
5. **线上端点冒烟**：
   - 运行冒烟测试脚本验证 14 项端点全部返回 HTTP 200。

### 阶段 2：Nginx 爬虫 SSR 路由更新（待用户授权）
针对线上 `softtribe.top.conf` 中的爬虫反代块：
- **修改前**：
  ```nginx
  location ~* ^/(software|system-tools|games|essentials)$ {
      if ($http_user_agent ~* (Baiduspider|Googlebot|bingbot|Bytespider|360Spider|Sogou|YisouSpider)) {
          proxy_pass http://127.0.0.1:3008;
          break;
      }
      try_files $uri $uri/ /index.html;
  }
  ```
- **修改后**：
  ```nginx
  location ~* ^/(software|system-tools|games|essentials|tutorials|updates|compare|community)$ {
      if ($http_user_agent ~* (Baiduspider|Googlebot|bingbot|Bytespider|360Spider|Sogou|YisouSpider)) {
          proxy_pass http://127.0.0.1:3008;
          break;
      }
      try_files $uri $uri/ /index.html;
  }
  ```
- **测试与生效**：`sudo nginx -t && sudo systemctl reload nginx`。

### 阶段 3：磁盘空间健康清理（待用户授权）
在生产服务器上安全释放空间：
1. 检查 `/var/www/backups/`：
   - `softtribe_pre_p879_.tar.gz` (193MB) 与 `softtribe_pre_p879_backup.tar.gz` (193MB) 是重复归档，可删除冗余副本。
2. 清理临时部署目录残留：释放约 400MB 空间，使系统盘可用裕量提升至 8.5GB+。

### 阶段 4：PostgreSQL 定时自动备份脚本（待用户授权）
1. 创建运维备份脚本 `/var/www/softtribe.top/scripts/backup_db_daily.sh`：
   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/ubuntu/backups/softtribe"
   mkdir -p $BACKUP_DIR
   DATE=$(date +%Y%m%d_%H%M%S)
   # 执行 PostgreSQL 自定义格式导出
   pg_dump -U softbuluo -h 127.0.0.1 -d softbuluo -F c -f "$BACKUP_DIR/softbuluo_$DATE.dump"
   # 仅保留最近 14 天备份，自动滚动清理
   find $BACKUP_DIR -name "softbuluo_*.dump" -mtime +14 -exec rm -f {} \;
   ```
2. 授予执行权限并配置入 `crontab`：
   ```cron
   0 3 * * * /bin/bash /var/www/softtribe.top/scripts/backup_db_daily.sh >> /home/ubuntu/logs/softtribe_backup.log 2>&1
   ```

---

## 四、回滚方案与应急处理

若发布后出现不可预测的异常：
1. **代码回滚**：
   ```bash
   ssh ubuntu@134.175.230.107 "tar -xzf /var/www/backups/softtribe_pre_p878_backup.tar.gz -C /var/www/softtribe.top/ && pm2 reload softtribe-backend"
   ```
2. **Nginx 回滚**：
   ```bash
   ssh ubuntu@134.175.230.107 "sudo cp /etc/nginx/sites-available/softtribe.top.conf.bak /etc/nginx/sites-available/softtribe.top.conf && sudo nginx -t && sudo systemctl reload nginx"
   ```
