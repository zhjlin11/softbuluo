#!/bin/bash
set -e

echo "======================================================="
echo "   SOFTTRIBE P9.0 STAGE C PRODUCTION IMPLEMENTATION    "
echo "======================================================="

# -----------------------------------------------------
# STEP 1: PRE-DEPLOYMENT BACKUP (DATABASE & CODE)
# -----------------------------------------------------
echo -e "\n▶ [STEP 1] EXECUTING PRE-DEPLOYMENT BACKUPS..."
BACKUP_DIR="/home/ubuntu/backups/deploy_pre_p90"
mkdir -p "$BACKUP_DIR"

echo "1. Triggering daily PostgreSQL logical backup with SHA-256..."
/bin/bash /home/ubuntu/scripts/backup_db_daily.sh

echo "2. Archiving current production code directory..."
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/softtribe_pre_p90_$DATE.tar.gz" \
    --exclude='node_modules' --exclude='.git' --exclude='uploads' \
    -C /var/www/softtribe.top .
echo "Pre-deployment code backup completed: $BACKUP_DIR/softtribe_pre_p90_$DATE.tar.gz ($(du -h "$BACKUP_DIR/softtribe_pre_p90_$DATE.tar.gz" | cut -f1))"

# -----------------------------------------------------
# STEP 2: CODE EXTRACTION & ASSETS DEPLOYMENT
# -----------------------------------------------------
echo -e "\n▶ [STEP 2] EXTRACTING P9.0 CODE & ASSETS..."
if [ ! -f "/tmp/p90_deploy.tar.gz" ]; then
    echo "[FATAL] /tmp/p90_deploy.tar.gz not found!" >&2
    exit 1
fi

tar -xzf /tmp/p90_deploy.tar.gz -C /var/www/softtribe.top
rm -f /tmp/p90_deploy.tar.gz
echo "Extracted package to /var/www/softtribe.top and cleaned /tmp/p90_deploy.tar.gz"

cd /var/www/softtribe.top

# -----------------------------------------------------
# STEP 3: PRISMA CLIENT & DEPENDENCIES
# -----------------------------------------------------
echo -e "\n▶ [STEP 3] REGENERATING PRISMA CLIENT..."
npx prisma generate --schema=./server/prisma/schema.prisma

# -----------------------------------------------------
# STEP 4: PM2 ZERO-DOWNTIME RELOAD
# -----------------------------------------------------
echo -e "\n▶ [STEP 4] RELOADING PM2 SOFTTRIBE-BACKEND..."
pm2 reload softtribe-backend --update-env
sleep 3
pm2 status

# -----------------------------------------------------
# STEP 5: VERIFY LOCAL BACKEND HEALTH
# -----------------------------------------------------
echo -e "\n▶ [STEP 5] CHECKING LOCAL FASTIFY 3008 HEALTH..."
HEALTH_RES=$(curl -s http://127.0.0.1:3008/api/health || echo "FAILED")
echo "Backend health response: $HEALTH_RES"
if [[ "$HEALTH_RES" != *"healthy"* ]]; then
    echo "[FATAL] Fastify backend health check failed!" >&2
    exit 1
fi

# -----------------------------------------------------
# STEP 6: PRODUCTION SMOKE TESTS & 7 CHANNELS
# -----------------------------------------------------
echo -e "\n▶ [STEP 6] RUNNING PRODUCTION SMOKE TESTS..."
bash /var/www/softtribe.top/scripts/prod_smoke_test.sh

# -----------------------------------------------------
# STEP 7: DISK & LOGS HYGIENE
# -----------------------------------------------------
echo -e "\n▶ [STEP 7] CHECKING DISK CAPACITY..."
df -h /

echo -e "\n======================================================="
echo "   P9.0 STAGE C PRODUCTION DEPLOYMENT COMPLETED!       "
echo "======================================================="
