import { prisma } from '../../db';
import { ImportBatchStatus, MatchStatus, BatchItemReviewStatus, ResourceStatus, SourceType, VerificationStatus } from '@prisma/client';
import { matchResourceDuplicate } from './deduplicationService';
import { validateSafeExternalUrl } from '../../utils/security';
import * as XLSX from 'xlsx';
/**
 * 健壮的 RFC 4180 CSV 解析器 (支持双引号包裹、逗号、转义、换行符、BOM 与公式清洗)
 */
export function parseCsvContent(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;
    // 清除 UTF-8 BOM 字符
    const cleanedText = csvText.replace(/^\uFEFF/, '');
    const normalized = cleanedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];
        const nextChar = normalized[i + 1];
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // 跳过转义双引号
            }
            else {
                insideQuotes = !insideQuotes;
            }
        }
        else if (char === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        }
        else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            if (currentRow.some((c) => c.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        }
        else {
            currentCell += char;
        }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
            rows.push(currentRow);
        }
    }
    if (rows.length < 2)
        return [];
    // 清洗单元格中的公式前缀 (=, +, -, @)，防止 CSV 注入
    const sanitizeCell = (val) => {
        let s = val.trim();
        if (s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@')) {
            s = s.substring(1).trim();
        }
        return s;
    };
    // 提取表头并自动映射多语系别名
    const header = rows[0].map((h) => h.toLowerCase());
    const findIdx = (...keys) => {
        return header.findIndex((h) => keys.some((k) => h.includes(k.toLowerCase())));
    };
    const nameIdx = findIdx('软件名称', '名称', 'name', 'title');
    const enIdx = findIdx('英文名称', '英文名', 'english');
    const devIdx = findIdx('开发商', '开发者', 'developer', 'author', '厂商');
    const catIdx = findIdx('分类', 'category', '类别');
    const urlIdx = findIdx('官方网址', '官网', 'url', 'website', 'link');
    const verIdx = findIdx('版本', 'version', 'ver');
    const platIdx = findIdx('平台', 'platform', 'os', '系统');
    const licIdx = findIdx('授权类型', '授权', 'license', '许可');
    const descIdx = findIdx('软件介绍', '介绍', '描述', 'description', 'summary');
    const iconIdx = findIdx('图标', 'icon', 'logo');
    if (nameIdx === -1) {
        throw new Error('CSV 缺少必要的 [软件名称/name] 列');
    }
    const result = [];
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const rawName = row[nameIdx] || '';
        const name = sanitizeCell(rawName);
        if (!name)
            continue; // 跳过空行
        result.push({
            name,
            englishName: enIdx !== -1 ? sanitizeCell(row[enIdx] || '') : undefined,
            developer: devIdx !== -1 ? sanitizeCell(row[devIdx] || '') : undefined,
            category: catIdx !== -1 ? sanitizeCell(row[catIdx] || '') : undefined,
            officialUrl: urlIdx !== -1 ? sanitizeCell(row[urlIdx] || '') : undefined,
            version: verIdx !== -1 ? sanitizeCell(row[verIdx] || '') : undefined,
            platform: platIdx !== -1 ? sanitizeCell(row[platIdx] || '') : 'Windows 10/11',
            license: licIdx !== -1 ? sanitizeCell(row[licIdx] || '') : 'FREE',
            description: descIdx !== -1 ? sanitizeCell(row[descIdx] || '') : undefined,
            iconUrl: iconIdx !== -1 ? sanitizeCell(row[iconIdx] || '') : undefined,
        });
    }
    return result;
}
/**
 * 生产级安全解析 XLSX / XLS 电子表格
 * 深度防范压缩炸弹 (Zip Bomb)、恶意宏与公式脚本注入
 */
export function parseExcelBuffer(buffer) {
    // 1. 严格限制文件大小 (最大 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('Excel 文件大小超过系统上限 (5MB)，已被安全拦截');
    }
    // 2. 解析 Workbook，禁止执行公式、宏和 HTML 解析
    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellFormula: false,
        cellHTML: false,
        raw: false,
    });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error('Excel 工作簿中无有效工作表');
    }
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet || !sheet['!ref']) {
        return [];
    }
    // 3. 校验单元格范围，防范超大行列压缩炸弹
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;
    if (rowCount > 1000) {
        throw new Error(`Excel 数据行数 (${rowCount}) 超过批量导入安全上限 (1000行)`);
    }
    if (colCount > 30) {
        throw new Error(`Excel 列数 (${colCount}) 超过限制 (最多30列)`);
    }
    // 4. 转换为二维数组
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rawData.length < 2) {
        return [];
    }
    // 5. 提取表头并映射列索引
    const header = (rawData[0] || []).map((h) => String(h || '').trim().toLowerCase());
    const findIdx = (...keys) => {
        return header.findIndex((h) => keys.some((k) => h.includes(k.toLowerCase())));
    };
    const nameIdx = findIdx('软件名称', '名称', 'name', 'title');
    const enIdx = findIdx('英文名称', '英文名', 'english');
    const devIdx = findIdx('开发商', '开发者', 'developer', 'author', '厂商');
    const catIdx = findIdx('分类', 'category', '类别');
    const urlIdx = findIdx('官方网址', '官网', 'url', 'website', 'link');
    const verIdx = findIdx('版本', 'version', 'ver');
    const platIdx = findIdx('平台', 'platform', 'os', '系统');
    const licIdx = findIdx('授权类型', '授权', 'license', '许可');
    const descIdx = findIdx('软件介绍', '介绍', '描述', 'description', 'summary');
    const iconIdx = findIdx('图标', 'icon', 'logo');
    if (nameIdx === -1) {
        throw new Error('Excel 缺少必须的“软件名称”或“name”表头列');
    }
    // 清洗公式注入：若以 = + - @ 开头，去除前缀
    const sanitizeCell = (val) => {
        let s = String(val ?? '').trim();
        if (s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@')) {
            s = s.substring(1).trim();
        }
        return s;
    };
    const results = [];
    for (let r = 1; r < rawData.length; r++) {
        const row = rawData[r];
        if (!row || !Array.isArray(row))
            continue;
        const name = sanitizeCell(row[nameIdx]);
        if (!name)
            continue;
        results.push({
            name,
            englishName: enIdx !== -1 ? sanitizeCell(row[enIdx]) : undefined,
            developer: devIdx !== -1 ? sanitizeCell(row[devIdx]) : undefined,
            category: catIdx !== -1 ? sanitizeCell(row[catIdx]) : undefined,
            officialUrl: urlIdx !== -1 ? sanitizeCell(row[urlIdx]) : undefined,
            version: verIdx !== -1 ? sanitizeCell(row[verIdx]) : undefined,
            platform: platIdx !== -1 ? sanitizeCell(row[platIdx]) : 'Windows 10/11',
            license: licIdx !== -1 ? sanitizeCell(row[licIdx]) : 'FREE',
            description: descIdx !== -1 ? sanitizeCell(row[descIdx]) : undefined,
            iconUrl: iconIdx !== -1 ? sanitizeCell(row[iconIdx]) : undefined,
        });
    }
    return results;
}
/**
 * 抓取官方 URL 公开元数据 (带 SSRF 检查)
 */
export async function fetchUrlMetadata(targetUrl) {
    const safeCheck = await validateSafeExternalUrl(targetUrl);
    if (!safeCheck.valid || !safeCheck.urlObj) {
        throw new Error(`目标 URL 安全校验失败: ${safeCheck.reason || '受限内网地址'}`);
    }
    const parsedUrl = safeCheck.urlObj;
    const hostname = parsedUrl.hostname.toLowerCase();
    // 1. 若为 GitHub 仓库，提取仓库及最新 Release
    if (hostname === 'github.com') {
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            const [owner, repo] = parts;
            try {
                const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
                    headers: {
                        'User-Agent': 'SoftBuluo-Bot/3.0',
                        'Accept': 'application/vnd.github.v3+json',
                    },
                });
                if (ghRes.ok) {
                    const ghData = (await ghRes.json());
                    return {
                        name: repo,
                        developer: owner,
                        version: ghData.tag_name?.replace(/^v/i, '') || ghData.name || '1.0.0',
                        description: ghData.body ? ghData.body.slice(0, 300) : `${repo} open source project on GitHub`,
                        officialUrl: targetUrl,
                        sourceType: 'GITHUB_RELEASES',
                    };
                }
            }
            catch {
                // API 失败降级为常规网页提取
            }
        }
    }
    // 2. 常规 HTML 网页抓取
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SoftBuluoBot/3.0',
            'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
        throw new Error(`目标网站响应异常: HTTP ${res.status}`);
    }
    const html = await res.text();
    // 正则解析 HTML meta 标签 (无需依赖外部庞大 DOM 解析库)
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
        html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta\s+(?:property=["']og:description["']|name=["']description["'])\s+content=["'](.*?)["']/i);
    const iconMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<link\s+rel=["'](?:shortcut\s+icon|icon)["']\s+href=["'](.*?)["']/i);
    const rawTitle = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
    const description = descMatch ? descMatch[1].trim() : `${rawTitle} 官方公开资源`;
    let iconUrl = iconMatch ? iconMatch[1].trim() : undefined;
    // 拼接相对路径 icon
    if (iconUrl && !iconUrl.startsWith('http')) {
        iconUrl = new URL(iconUrl, targetUrl).toString();
    }
    // 软件名称简化（过滤常见后缀如 " - 官方网站", " | Download"）
    const simplifiedName = rawTitle.split(/[-_|–—]/)[0].trim() || rawTitle;
    return {
        name: simplifiedName,
        developer: parsedUrl.hostname.replace(/^www\./, '').split('.')[0],
        description: description.slice(0, 300),
        iconUrl,
        officialUrl: targetUrl,
        sourceType: 'OFFICIAL_WEBSITE',
    };
}
/**
 * 创建批量导入批次并执行去重检测
 */
export async function createImportBatch(params) {
    const { rows, importType, actorId, fileName } = params;
    if (rows.length === 0) {
        throw new Error('导入数据行不能为空');
    }
    if (rows.length > 500) {
        throw new Error('单次批量导入最多支持 500 条数据');
    }
    const batchNo = `BTH${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    // 预创建批次
    const batch = await prisma.importBatch.create({
        data: {
            batchNo,
            importType,
            fileName,
            totalCount: rows.length,
            actorId,
            status: ImportBatchStatus.PENDING_REVIEW,
        },
    });
    let exactMatches = 0;
    let possibleDuplicates = 0;
    let conflicts = 0;
    let newResources = 0;
    // 逐行查重与清洗
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const matchRes = await matchResourceDuplicate({
            name: row.name,
            developer: row.developer,
            officialUrl: row.officialUrl,
        });
        if (matchRes.status === MatchStatus.EXACT_MATCH)
            exactMatches++;
        else if (matchRes.status === MatchStatus.POSSIBLE_DUPLICATE)
            possibleDuplicates++;
        else if (matchRes.status === MatchStatus.CONFLICT)
            conflicts++;
        else
            newResources++;
        await prisma.importBatchItem.create({
            data: {
                batchId: batch.id,
                rawRowIndex: i + 1,
                rawPayload: JSON.stringify(row),
                parsedName: row.name,
                parsedSlug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                parsedVersion: row.version || '1.0.0',
                parsedDeveloper: row.developer || '未知开发者',
                parsedUrl: row.officialUrl || null,
                parsedCategory: row.category || '实用工具',
                parsedLicense: row.license || 'FREE',
                parsedDescription: row.description || `${row.name} 官方正版资源`,
                parsedPlatform: row.platform || 'Windows 10/11',
                matchStatus: matchRes.status,
                matchedSoftwareId: matchRes.matchedSoftwareId || null,
                errorReason: matchRes.reason,
                reviewStatus: BatchItemReviewStatus.PENDING,
            },
        });
    }
    const summary = {
        total: rows.length,
        newResources,
        exactMatches,
        possibleDuplicates,
        conflicts,
    };
    const updatedBatch = await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
            duplicateCount: exactMatches + possibleDuplicates,
            summary: JSON.stringify(summary),
        },
        include: {
            items: { orderBy: { rawRowIndex: 'asc' } },
        },
    });
    return updatedBatch;
}
/**
 * 确认并提交批量导入（支持部分导入、冲突解决与版本合并）
 */
export async function commitBatchItems(params) {
    const { batchId, itemActions, actorId } = params;
    const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: { items: true },
    });
    if (!batch)
        throw new Error('导入批次不存在');
    // 获取默认备用分类
    const defaultCategory = await prisma.category.findFirst();
    if (!defaultCategory)
        throw new Error('系统尚未初始化分类数据');
    let successCount = 0;
    let failedCount = 0;
    for (const action of itemActions) {
        const item = batch.items.find((it) => it.id === action.itemId);
        if (!item)
            continue;
        if (action.action === 'REJECT') {
            await prisma.importBatchItem.update({
                where: { id: item.id },
                data: { reviewStatus: BatchItemReviewStatus.REJECTED },
            });
            continue;
        }
        // 审批通过并导入 (APPROVE)
        try {
            await prisma.$transaction(async (tx) => {
                let targetSoftwareId = item.matchedSoftwareId;
                if (item.matchStatus === MatchStatus.NEW_RESOURCE || !targetSoftwareId) {
                    // 全新资源：创建 Software (初始状态严格为 DRAFT 草稿，绝不未经人工审核直接公开发布！)
                    const slugBase = action.overrideSlug || item.parsedSlug || `app-${Date.now()}`;
                    let uniqueSlug = slugBase;
                    let counter = 1;
                    while (await tx.software.findUnique({ where: { slug: uniqueSlug } })) {
                        uniqueSlug = `${slugBase}-${counter++}`;
                    }
                    const catId = action.categoryId || defaultCategory.id;
                    const newSoftware = await tx.software.create({
                        data: {
                            name: item.parsedName,
                            slug: uniqueSlug,
                            developer: item.parsedDeveloper || '官方开发者',
                            summary: (item.parsedDescription || item.parsedName).slice(0, 120),
                            description: item.parsedDescription || `${item.parsedName} 官方发布版本。`,
                            categoryId: catId,
                            status: ResourceStatus.DRAFT, // 默认草稿箱！
                            isTestData: false,
                        },
                    });
                    targetSoftwareId = newSoftware.id;
                }
                // 创建对应版本记录
                const newVersion = await tx.softwareVersion.create({
                    data: {
                        softwareId: targetSoftwareId,
                        version: item.parsedVersion || '1.0.0',
                        platform: item.parsedPlatform || 'Windows 10/11',
                        fileSize: '官方包',
                        releaseDate: new Date().toISOString().split('T')[0],
                        changelog: '初始批量收录',
                        isLatest: true,
                        reviewStatus: 'APPROVED',
                    },
                });
                // 若提供了官方 URL，关联添加官方外部下载源
                if (item.parsedUrl) {
                    await tx.downloadSource.create({
                        data: {
                            versionId: newVersion.id,
                            sourceType: SourceType.OFFICIAL_EXTERNAL,
                            sourceName: '原厂官方下载直达',
                            url: item.parsedUrl,
                            verificationStatus: VerificationStatus.VERIFIED,
                            isActive: true,
                        },
                    });
                }
                // 更新 item 状态为 IMPORTED
                await tx.importBatchItem.update({
                    where: { id: item.id },
                    data: {
                        reviewStatus: BatchItemReviewStatus.IMPORTED,
                        matchedSoftwareId: targetSoftwareId,
                    },
                });
            });
            successCount++;
        }
        catch (err) {
            failedCount++;
            await prisma.importBatchItem.update({
                where: { id: item.id },
                data: {
                    reviewStatus: BatchItemReviewStatus.REJECTED,
                    errorReason: `导入入库失败: ${err.message}`,
                },
            });
        }
    }
    const finalStatus = successCount === 0
        ? ImportBatchStatus.FAILED
        : failedCount === 0
            ? ImportBatchStatus.COMPLETED
            : ImportBatchStatus.PARTIAL_SUCCESS;
    const updated = await prisma.importBatch.update({
        where: { id: batchId },
        data: {
            successCount: { increment: successCount },
            failedCount: { increment: failedCount },
            status: finalStatus,
        },
    });
    return {
        success: true,
        batch: updated,
        successCount,
        failedCount,
    };
}
