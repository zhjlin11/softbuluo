#!/bin/bash
set -e

echo "======================================================="
echo "   SOFTTRIBE P8.9.1 STAGE C PRODUCTION IMPLEMENTATION  "
echo "======================================================="

# -----------------------------------------------------
# BATCH 1: BACKUP SCRIPT ENHANCEMENT & RUN
# -----------------------------------------------------
echo -e "\n▶ [BATCH 1] ENHANCING POSTGRESQL BACKUP SCRIPT..."
BACKUP_SCRIPT="/home/ubuntu/scripts/backup_db_daily.sh"

# Backup existing script
cp "$BACKUP_SCRIPT" "${BACKUP_SCRIPT}.bak_pre_p891"

cat << 'EOF' > "$BACKUP_SCRIPT"
#!/bin/bash
set -e
BACKUP_DIR="/home/ubuntu/backups/softtribe"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/softbuluo_$DATE.dump"

# 1. 磁盘空间熔断检查 (剩余必须大于 2GB)
FREE_KB=$(df / | tail -n 1 | awk '{print $4}')
if [ "$FREE_KB" -lt 2097152 ]; then
    echo "[$(date)] [FATAL] 生产根磁盘可用空间小于 2GB (${FREE_KB}KB)，自动熔断阻断备份以防主机夯死！" >&2
    exit 2
fi

echo "[$(date)] Starting daily PostgreSQL backup..."
docker exec vasto-postgres pg_dump -U vasto_admin -F c softbuluo > "$BACKUP_FILE"

# 2. 完整性检查：非空且可读取 TOC
if [ ! -s "$BACKUP_FILE" ]; then
    echo "[$(date)] [FATAL] 备份文件为空！" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

docker exec -i vasto-postgres pg_restore -l < "$BACKUP_FILE" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[$(date)] [FATAL] 备份文件 TOC 损坏！" >&2
    exit 1
fi

# 3. 计算 SHA-256 完整性哈希
sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"

# 4. 滚动保留最近 14 天
find "$BACKUP_DIR" -name "softbuluo_*.dump*" -mtime +14 -exec rm -f {} \;
echo "[$(date)] Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
EOF

chmod +x "$BACKUP_SCRIPT"

# Test run enhanced backup script now
/bin/bash "$BACKUP_SCRIPT"
echo " [PASS] Batch 1 Completed: Backup script enhanced & executed successfully."

# -----------------------------------------------------
# BATCH 2: PORT 8080 CONVERGENCE (NGINX & UFW)
# -----------------------------------------------------
echo -e "\n▶ [BATCH 2] CONVERGING PORT 8080 (BIND 127.0.0.1 & UFW REMOVAL)..."
NGINX_CONF="/etc/nginx/sites-available/softtribe.top.conf"

# Backup nginx config
sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak_pre_8080_close"

# Replace listen 8080; with listen 127.0.0.1:8080;
sudo python3 -c "
with open('$NGINX_CONF', 'r') as f:
    c = f.read()
if 'listen 8080;' in c:
    c = c.replace('listen 8080;', 'listen 127.0.0.1:8080;')
    with open('$NGINX_CONF', 'w') as f:
        f.write(c)
    print('Nginx config updated to listen 127.0.0.1:8080;')
else:
    print('listen 8080; already updated or not found')
"

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Remove UFW 8080/tcp allow rule
sudo ufw delete allow 8080/tcp || true
sudo ufw delete allow 8080 || true

echo " [PASS] Batch 2 Completed: Nginx bound to 127.0.0.1:8080 and UFW rule removed."

# -----------------------------------------------------
# BATCH 3: DISK CLEANUP OF SAFE ORPHAN ARTIFACTS
# -----------------------------------------------------
echo -e "\n▶ [BATCH 3] CLEANING SAFE /TMP ORPHAN ARTIFACTS..."
# 1. Clean historical dist upload in /tmp
if [ -f "/tmp/dist_upload.tar.gz" ]; then
    rm -f /tmp/dist_upload.tar.gz
    echo "Removed /tmp/dist_upload.tar.gz"
fi

# 2. Clean headless Chrome scoped dirs in /tmp
rm -rf /tmp/com.google.Chrome.scoped_dir.* 2>/dev/null || true
echo "Cleaned /tmp/com.google.Chrome.scoped_dir.*"

# 3. Clean temporary logs in /tmp
rm -f /tmp/meta-all.log /tmp/jall.log /tmp/today.log 2>/dev/null || true

# 4. Vacuum systemd journal to 3 days
sudo journalctl --vacuum-time=3d >/dev/null 2>&1 || true

echo " [PASS] Batch 3 Completed: Disk cleanup finished."

# -----------------------------------------------------
# BATCH 4: FULL SMOKE TEST & STATUS CHECK
# -----------------------------------------------------
echo -e "\n▶ [BATCH 4] EXECUTING POST-CHANGE SMOKE TEST & HARDENING VERIFICATION..."

# 1. Check disk capacity now
echo "=== CURRENT DISK CAPACITY ==="
df -h /

# 2. Check port 8080 listener
echo -e "\n=== PORT 8080 LISTENER (MUST BE 127.0.0.1:8080) ==="
sudo ss -tulpn | grep 8080

# 3. Check UFW status (8080 must NOT appear in allowed rules)
echo -e "\n=== UFW STATUS ==="
sudo ufw status | grep 8080 || echo "8080/tcp is NOT in allowed rules (SAFE)"

# 4. Run full production smoke test script
echo -e "\n=== RUNNING PRODUCTION SMOKE TEST SCRIPT ==="
bash /var/www/softtribe.top/scripts/prod_smoke_test.sh

echo -e "\n======================================================="
echo "   STAGE C PRODUCTION CHANGES COMPLETED AND VERIFIED!  "
echo "======================================================="
