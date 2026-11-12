#!/bin/bash
set -e
echo "=== PM2 STATUS ==="
pm2 status softtribe-backend

echo -e "\n=== DISK USAGE ==="
df -h /

echo -e "\n=== BACKUP DIRECTORY ==="
ls -lh /var/www/backups/
ls -lh /home/ubuntu/backups/softtribe/

echo -e "\n=== TUTORIALS API STATS ==="
curl -s http://127.0.0.1:8080/api/v1/channels/tutorials | python3 -c '
import sys, json
data = json.load(sys.stdin)
print("Stats:", data.get("data", {}).get("stats"))
'

echo -e "\n=== SITEMAP-TUTORIALS CHECK ==="
curl -s http://127.0.0.1:8080/sitemap-tutorials.xml | grep -c '<loc>' || true

echo -e "\n=== CRAWLER SSR TEST (updates & tutorials) ==="
curl -s -A "Googlebot" http://127.0.0.1:8080/updates | head -n 10
curl -s -A "Googlebot" http://127.0.0.1:8080/tutorials | head -n 10

echo -e "\n=== NGINX CONFIG REGEX CHECK ==="
grep -n "software|system-tools" /etc/nginx/sites-available/softtribe.top.conf

echo -e "\n=== ALL CHECKS COMPLETED ==="
