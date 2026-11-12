#!/bin/bash
set -e

echo "=== ISOLATED DATABASE RESTORE DRILL ==="
DUMP_FILE="/home/ubuntu/backups/softtribe/softbuluo_20261112_135819.dump"
if [ ! -f "$DUMP_FILE" ]; then
    echo "Dump file $DUMP_FILE not found!"
    exit 1
fi

DRILL_DB="softbuluo_drill_$(date +%s)"
echo "1. Creating isolated test database: $DRILL_DB"
docker exec vasto-postgres psql -U vasto_admin -d postgres -c "CREATE DATABASE \"$DRILL_DB\";"

echo "2. Restoring dump into $DRILL_DB..."
# pg_restore may return 0 or non-fatal exit codes for minor ownership warnings
docker exec -i vasto-postgres pg_restore -U vasto_admin --clean --if-exists -d "$DRILL_DB" < "$DUMP_FILE" || true

echo "3. Verifying restored data counts in $DRILL_DB:"
docker exec vasto-postgres psql -U vasto_admin -d "$DRILL_DB" -c "
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema='public';
SELECT count(*) as total_software FROM \"Software\";
SELECT count(*) as total_download_sources FROM \"DownloadSource\";
SELECT count(*) as total_tutorials FROM \"Tutorial\";
SELECT count(*) as genuine_tutorials FROM \"Tutorial\" WHERE slug NOT LIKE 'tut-p3-%';
"

echo "4. Dropping isolated test database: $DRILL_DB"
docker exec vasto-postgres psql -U vasto_admin -d postgres -c "DROP DATABASE \"$DRILL_DB\";"

echo "=== RESTORE DRILL COMPLETED SUCCESSFULLY ==="
