#!/bin/bash
set -e

echo "======================================================="
echo "  SOFTTRIBE P9.0.2 STAGE C PRODUCTION IMPLEMENTATION   "
echo "======================================================="

# -----------------------------------------------------
# STEP 1: PRE-DEPLOYMENT BACKUPS (DATABASE & CODE)
# -----------------------------------------------------
echo -e "\n▶ [STEP 1] EXECUTING PRE-DEPLOYMENT BACKUPS..."
BACKUP_DIR="/home/ubuntu/backups/deploy_pre_p902"
mkdir -p "$BACKUP_DIR"

echo "1. Triggering daily PostgreSQL logical backup with SHA-256..."
/bin/bash /home/ubuntu/scripts/backup_db_daily.sh

DATE=$(date +%Y%m%d_%H%M%S)
echo "2. Copying latest logical backup to deployment snapshot..."
LATEST_DUMP=$(ls -t /home/ubuntu/backups/softtribe/softbuluo_*.dump | head -1)
cp "$LATEST_DUMP" "$BACKUP_DIR/softbuluo_p902_pre_$DATE.dump"
sha256sum "$BACKUP_DIR/softbuluo_p902_pre_$DATE.dump" > "$BACKUP_DIR/softbuluo_p902_pre_$DATE.dump.sha256"
echo "Dedicated pre-deployment database dump created: $BACKUP_DIR/softbuluo_p902_pre_$DATE.dump ($(du -h "$BACKUP_DIR/softbuluo_p902_pre_$DATE.dump" | cut -f1))"

echo "3. Archiving current production code directory..."
tar -czf "$BACKUP_DIR/softtribe_pre_p902_$DATE.tar.gz" \
    --exclude='node_modules' --exclude='.git' --exclude='uploads' \
    -C /var/www/softtribe.top .
echo "Pre-deployment code backup completed: $BACKUP_DIR/softtribe_pre_p902_$DATE.tar.gz ($(du -h "$BACKUP_DIR/softtribe_pre_p902_$DATE.tar.gz" | cut -f1))"

# -----------------------------------------------------
# STEP 2: CODE EXTRACTION & ASSETS DEPLOYMENT
# -----------------------------------------------------
echo -e "\n▶ [STEP 2] EXTRACTING P9.0.2 CODE & ASSETS..."
if [ ! -f "/tmp/p902_deploy.tar.gz" ]; then
    echo "[FATAL] /tmp/p902_deploy.tar.gz not found!" >&2
    exit 1
fi

tar -xzf /tmp/p902_deploy.tar.gz -C /var/www/softtribe.top
rm -f /tmp/p902_deploy.tar.gz
echo "Extracted package to /var/www/softtribe.top and cleaned /tmp/p902_deploy.tar.gz"

cd /var/www/softtribe.top

# -----------------------------------------------------
# STEP 3: PRISMA CLIENT GENERATION
# -----------------------------------------------------
echo -e "\n▶ [STEP 3] REGENERATING PRISMA CLIENT..."
npx prisma generate --schema=./server/prisma/schema.prisma

# -----------------------------------------------------
# STEP 4: DATABASE BATCH PUBLISHING
# -----------------------------------------------------
echo -e "\n▶ [STEP 4] RUNNING P9.0.2 DATABASE ATOMIC RELEASE..."
node scripts/p902_prod_release.cjs

# -----------------------------------------------------
# STEP 5: PM2 ZERO-DOWNTIME RELOAD
# -----------------------------------------------------
echo -e "\n▶ [STEP 5] RELOADING PM2 SOFTTRIBE-BACKEND..."
pm2 reload softtribe-backend --update-env
sleep 3
pm2 status

# -----------------------------------------------------
# STEP 6: VERIFY LOCAL BACKEND HEALTH
# -----------------------------------------------------
echo -e "\n▶ [STEP 6] CHECKING LOCAL FASTIFY 3008 HEALTH..."
HEALTH_RES=$(curl -s http://127.0.0.1:3008/api/v1/health || echo "FAILED")
echo "Backend health response: $HEALTH_RES"
if [[ "$HEALTH_RES" != *"HEALTHY"* ]]; then
    echo "[FATAL] Fastify backend health check failed!" >&2
    exit 1
fi

# -----------------------------------------------------
# STEP 7: DISK & LOGS HYGIENE
# -----------------------------------------------------
echo -e "\n▶ [STEP 7] CHECKING DISK CAPACITY..."
df -h /

echo -e "\n======================================================="
echo "   P9.0.2 STAGE C PRODUCTION IMPLEMENTATION COMPLETE! "
echo "======================================================="
