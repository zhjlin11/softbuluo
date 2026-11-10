# 软游部落隔离测试环境恢复演练脚本 (绝不在正式库执行)
param (
    [string]$DumpFile,
    [string]$TestDb = "softbuluo_restore_test"
)

$ErrorActionPreference = "Stop"

if ($TestDb.ToLower() -eq "softbuluo") {
    Write-Host "❌ 致命安全拦截：严禁向正式运行数据库 softbuluo 执行恢复测试！" -ForegroundColor Red
    exit 1
}

if (-not $DumpFile) {
    # 查找最新的备份文件
    $latest = Get-ChildItem "backups\*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) {
        Write-Host "❌ 未找到任何 .dump 备份文件" -ForegroundColor Red
        exit 1
    }
    $DumpFile = $latest.FullName
}

Write-Host "🚀 开始在隔离测试库 [$TestDb] 执行恢复演练..." -ForegroundColor Cyan
Write-Host "   源备份文件: $DumpFile" -ForegroundColor Gray

npx tsx -e "import { performRestoreDrill } from './server/src/scripts/backupRestoreManager'; performRestoreDrill(process.argv[1], process.argv[2]).then(r => { console.log(JSON.stringify(r, null, 2)); if (!r.success) process.exit(1); })" "$DumpFile" "$TestDb"
