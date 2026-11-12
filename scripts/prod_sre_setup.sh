#!/bin/bash
set -e

echo "=== 1. DISK CLEANUP (ISS-08) ==="
# Remove duplicate 185M archive
if [ -f "/var/www/backups/softtribe_pre_p879_.tar.gz" ]; then
    rm -f /var/www/backups/softtribe_pre_p879_.tar.gz
    echo "Removed duplicate /var/www/backups/softtribe_pre_p879_.tar.gz"
fi

# Clean journal logs older than 7 days
sudo journalctl --vacuum-time=7d || true

echo "Current disk space:"
df -h /

echo -e "\n=== 2. DAILY AUTOMATED DB BACKUP (ISS-07) ==="
mkdir -p /home/ubuntu/scripts
mkdir -p /home/ubuntu/logs
mkdir -p /home/ubuntu/backups/softtribe

cat << 'EOF' > /home/ubuntu/scripts/backup_db_daily.sh
#!/bin/bash
set -e
BACKUP_DIR="/home/ubuntu/backups/softtribe"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/softbuluo_$DATE.dump"

# Check free space (at least 2GB)
FREE_KB=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
if [ "$FREE_KB" -lt 2097152 ]; then
  echo "[$(date)] ERROR: Not enough disk space (<2GB) for database backup!" >&2
  exit 1
fi

echo "[$(date)] Starting daily PostgreSQL backup..."
docker exec vasto-postgres pg_dump -U vasto_admin -F c softbuluo > "$BACKUP_FILE"

# Generate SHA-256 checksum
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"

# Verify non-empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[$(date)] ERROR: Backup file is empty!" >&2
  exit 1
fi

# Keep only last 14 days of backups
find "$BACKUP_DIR" -name "softbuluo_*.dump*" -mtime +14 -exec rm -f {} \;
echo "[$(date)] Backup completed and verified: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
EOF

chmod +x /home/ubuntu/scripts/backup_db_daily.sh

# Test run the backup script now
/bin/bash /home/ubuntu/scripts/backup_db_daily.sh

# Ensure crontab entry exists
CRON_CMD="0 3 * * * /bin/bash /home/ubuntu/scripts/backup_db_daily.sh >> /home/ubuntu/logs/softtribe_backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "backup_db_daily.sh"; echo "$CRON_CMD") | crontab -

echo "Current crontab:"
crontab -l

echo -e "\n=== 3. VERIFY BACKUP FILES ==="
ls -lh /home/ubuntu/backups/softtribe/

echo -e "\n=== SRE REMEDIATION COMPLETED ==="
