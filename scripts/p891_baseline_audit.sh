#!/bin/bash
set -e

echo "=== 1. SYSTEM & HOST INFORMATION ==="
uname -a
uptime
cat /etc/os-release | grep PRETTY_NAME

echo -e "\n=== 2. DISK PARTITION USAGE ==="
df -hT / /dev/shm

echo -e "\n=== 3. NETWORK LISTENERS (PORTS) ==="
sudo ss -tulpn | grep -E "8080|3000|3001|5432|80|443|22" || true

echo -e "\n=== 4. PM2 PROCESS STATUS ==="
pm2 status softtribe-backend

echo -e "\n=== 5. DOCKER CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== 6. POSTGRESQL STATS (INSIDE DOCKER) ==="
docker exec vasto-postgres psql -U vasto_admin -d softbuluo -c "
SELECT pg_size_pretty(pg_database_size('softbuluo')) as db_size;
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema='public';
SELECT count(*) as total_software FROM \"Software\";
SELECT count(*) as total_download_sources FROM \"DownloadSource\";
SELECT count(*) as total_tutorials FROM \"Tutorial\";
SELECT count(*) as genuine_tutorials FROM \"Tutorial\" WHERE slug NOT LIKE 'tut-p3-%';
" || true

echo -e "\n=== 7. RECENT DATABASE BACKUPS & INTEGRITY TEST ==="
ls -lh /home/ubuntu/backups/softtribe/
LATEST_DUMP=$(ls -t /home/ubuntu/backups/softtribe/*.dump 2>/dev/null | head -n 1)
if [ -n "$LATEST_DUMP" ]; then
    echo "Testing dump integrity with pg_restore -l on $LATEST_DUMP..."
    docker exec -i vasto-postgres pg_restore -l < "$LATEST_DUMP" | head -n 15
    echo "... TOC header read successfully."
fi

echo -e "\n=== 8. DIRECTORY DISK USAGE BREAKDOWN ==="
echo "Top-level directories on /:"
sudo du -sh /var /home /opt /usr /etc /tmp 2>/dev/null || true

echo -e "\nDetail of /var/www:"
sudo du -sh /var/www/* 2>/dev/null || true

echo -e "\nDetail of /var/log:"
sudo du -sh /var/log/* 2>/dev/null | sort -hr | head -n 10 || true

echo -e "\nDetail of /home/ubuntu:"
sudo du -sh /home/ubuntu/* 2>/dev/null | sort -hr | head -n 10 || true

echo -e "\nDocker storage usage:"
docker system df || true

echo -e "\n=== 9. CERTBOT & SSL STATUS ==="
sudo certbot certificates 2>/dev/null || true
systemctl list-timers | grep -E "certbot|cert" || true

echo -e "\n=== 10. IPTABLES / UFW FIREWALL ==="
sudo ufw status || true
sudo iptables -L INPUT -n --line-numbers | head -n 25 || true

echo -e "\n=== BASELINE AUDIT SCRIPT COMPLETE ==="
