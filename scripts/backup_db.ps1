# 软游部落生产级数据库备份脚本
$ErrorActionPreference = "Stop"
$env:PGPASSWORD = if ($env:PGPASSWORD) { $env:PGPASSWORD } else { "postgres" }
$pgDump = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
if (-not (Test-Path $pgDump)) { $pgDump = "pg_dump" }

$backupsDir = "backups"
if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = "$backupsDir\softbuluo_$timestamp.dump"

Write-Host "📦 正在执行软游部落数据库全量二进制备份..." -ForegroundColor Cyan
& $pgDump -h localhost -p 5432 -U postgres -F c -b -v -f $dumpFile softbuluo

if (Test-Path $dumpFile) {
    $size = (Get-Item $dumpFile).Length
    Write-Host "✅ 备份成功！文件: $dumpFile (大小: $([math]::Round($size/1024, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "❌ 备份失败！未找到生成的文件" -ForegroundColor Red
    exit 1
}
