import subprocess
import json

def query(sql):
    cmd = ['docker', 'exec', '-i', 'vasto-postgres', 'psql', '-U', 'vasto_admin', '-d', 'softbuluo', '-t', '-A', '-c', sql]
    return subprocess.check_output(cmd).decode().strip()

print("=== PROD DB COUNTS ===")
print("Software total:", query('SELECT count(*) FROM "Software";'))
print("Software published:", query("SELECT count(*) FROM \"Software\" WHERE status = 'PUBLISHED';"))
print("Software published non-test:", query("SELECT count(*) FROM \"Software\" WHERE status = 'PUBLISHED' AND \"isTestData\" = false;"))
print("Software draft:", query("SELECT count(*) FROM \"Software\" WHERE status = 'DRAFT';"))
print("Software draft non-test:", query("SELECT count(*) FROM \"Software\" WHERE status = 'DRAFT' AND \"isTestData\" = false;"))
print("Software isTestData=true:", query('SELECT count(*) FROM "Software" WHERE "isTestData" = true;'))
print("Tutorials total:", query('SELECT count(*) FROM "Tutorial";'))
print("Tutorials published non-test:", query("SELECT count(*) FROM \"Tutorial\" WHERE status = 'PUBLISHED' AND slug NOT LIKE 'tut-p3-%';"))
print("DownloadSource total:", query('SELECT count(*) FROM "DownloadSource";'))
print("DownloadSource failed/404:", query("SELECT count(*) FROM \"DownloadSource\" WHERE \"verificationStatus\" = 'FAILED' OR \"lastHttpStatus\" IN (404, 410, 0);"))
print("SoftwareSource total:", query('SELECT count(*) FROM "SoftwareSource";'))
print("Job total:", query('SELECT count(*) FROM "Job";'))

# Query details on the 35 failed download sources
sql_failed = """
SELECT ds.id, s.name, s.slug, sv.version, ds.url, ds."sourceType", ds."isLatest", ds."verificationStatus", ds."lastHttpStatus"
FROM "DownloadSource" ds
JOIN "SoftwareVersion" sv ON ds."versionId" = sv.id
JOIN "Software" s ON sv."softwareId" = s.id
WHERE ds."verificationStatus" = 'FAILED' OR ds."lastHttpStatus" IN (404, 410, 0)
ORDER BY s.name, sv.version;
"""
print("\n=== DETAILS OF FAILED / 404 SOURCES ===")
failed_sources = query(sql_failed)
lines = [l for l in failed_sources.split('\n') if l.strip()]
print(f"Total failed/404 records found: {len(lines)}")
for idx, line in enumerate(lines, 1):
    parts = line.split('|')
    print(f"[{idx}] ID: {parts[0][:10]}... | SW: {parts[1]} ({parts[2]}) | Ver: {parts[3]} | HTTP: {parts[8]} | Status: {parts[7]} | URL: {parts[4][:60]}...")
