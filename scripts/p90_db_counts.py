import subprocess

SQL = """
SELECT 'Software_Total', count(*) FROM "Software"
UNION ALL SELECT 'Software_Published_NonTest', count(*) FROM "Software" WHERE status = 'PUBLISHED' AND "isTestData" = false
UNION ALL SELECT 'Software_Draft_NonTest', count(*) FROM "Software" WHERE status = 'DRAFT' AND "isTestData" = false
UNION ALL SELECT 'Software_TestData', count(*) FROM "Software" WHERE "isTestData" = true
UNION ALL SELECT 'Software_Type_SOFTWARE_Pub', count(*) FROM "Software" WHERE type = 'SOFTWARE' AND status = 'PUBLISHED' AND "isTestData" = false
UNION ALL SELECT 'Software_Type_TOOL_Pub', count(*) FROM "Software" WHERE type = 'TOOL' AND status = 'PUBLISHED' AND "isTestData" = false
UNION ALL SELECT 'Software_Type_GAME_Pub', count(*) FROM "Software" WHERE type = 'GAME' AND status = 'PUBLISHED' AND "isTestData" = false
UNION ALL SELECT 'Tutorial_Total', count(*) FROM "Tutorial"
UNION ALL SELECT 'Tutorial_Published_Genuine', count(*) FROM "Tutorial" WHERE status = 'PUBLISHED' AND slug NOT LIKE 'tut-p3-%'
UNION ALL SELECT 'Tutorial_TestP3', count(*) FROM "Tutorial" WHERE slug LIKE 'tut-p3-%'
UNION ALL SELECT 'DownloadSource_Total', count(*) FROM "DownloadSource"
UNION ALL SELECT 'DownloadSource_Pub_Software', count(*) FROM "DownloadSource" ds JOIN "SoftwareVersion" sv ON sv.id = ds."versionId" JOIN "Software" s ON s.id = sv."softwareId" WHERE s.status = 'PUBLISHED'
UNION ALL SELECT 'DownloadSource_Pub_NonTest_Software', count(*) FROM "DownloadSource" ds JOIN "SoftwareVersion" sv ON sv.id = ds."versionId" JOIN "Software" s ON s.id = sv."softwareId" WHERE s.status = 'PUBLISHED' AND s."isTestData" = false
UNION ALL SELECT 'DownloadSource_Pub_CurrentVer_NonTest', count(*) FROM "DownloadSource" ds JOIN "SoftwareVersion" sv ON sv.id = ds."versionId" JOIN "Software" s ON s.id = sv."softwareId" WHERE s.status = 'PUBLISHED' AND s."isTestData" = false AND sv."isLatest" = true
UNION ALL SELECT 'DownloadSource_Pub_NonLatestVer_NonTest', count(*) FROM "DownloadSource" ds JOIN "SoftwareVersion" sv ON sv.id = ds."versionId" JOIN "Software" s ON s.id = sv."softwareId" WHERE s.status = 'PUBLISHED' AND s."isTestData" = false AND sv."isLatest" = false
UNION ALL SELECT 'DownloadSource_Draft_Or_Test', count(*) FROM "DownloadSource" ds JOIN "SoftwareVersion" sv ON sv.id = ds."versionId" JOIN "Software" s ON s.id = sv."softwareId" WHERE s.status != 'PUBLISHED' OR s."isTestData" = true
UNION ALL SELECT 'VersionCandidate_Total', count(*) FROM "VersionCandidate"
UNION ALL SELECT 'ImportBatch_Total', count(*) FROM "ImportBatch"
UNION ALL SELECT 'ImportBatchItem_Total', count(*) FROM "ImportBatchItem"
UNION ALL SELECT 'SoftwareSource_Total', count(*) FROM "SoftwareSource"
UNION ALL SELECT 'LinkCheckLog_Total', count(*) FROM "LinkCheckLog"
UNION ALL SELECT 'Job_Total', count(*) FROM "Job"
UNION ALL SELECT 'JobRun_Total', count(*) FROM "JobRun"
UNION ALL SELECT 'OperationNotification_Total', count(*) FROM "OperationNotification"
UNION ALL SELECT 'SeoPageAudit_Total', count(*) FROM "SeoPageAudit"
UNION ALL SELECT 'SeoKeyword_Total', count(*) FROM "SeoKeyword";
"""
print(SQL)
