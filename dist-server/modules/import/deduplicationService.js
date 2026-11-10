import { prisma } from '../../db';
import { MatchStatus } from '@prisma/client';
/**
 * 计算两个字符串的编辑距离 (Levenshtein distance)
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++)
        matrix[i] = [i];
    for (let j = 0; j <= a.length; j++)
        matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // 替换
                Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // 插入 / 删除
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
/**
 * 综合资源查重与冲突判定引擎
 */
export async function matchResourceDuplicate(candidate) {
    const normName = candidate.name.trim().toLowerCase();
    const normDev = (candidate.developer || '').trim().toLowerCase();
    // 1. 尝试通过 Slug 完全匹配
    if (candidate.slug && candidate.slug.trim()) {
        const slugMatch = await prisma.software.findUnique({
            where: { slug: candidate.slug.trim() },
        });
        if (slugMatch) {
            return {
                status: MatchStatus.EXACT_MATCH,
                matchedSoftwareId: slugMatch.id,
                matchedSoftwareName: slugMatch.name,
                matchedSoftwareSlug: slugMatch.slug,
                confidence: 1.0,
                reason: `Slug [${candidate.slug}] 完全匹配已发布软件`,
            };
        }
    }
    // 2. 尝试通过官方域名完全匹配
    if (candidate.officialUrl && candidate.officialUrl.trim()) {
        try {
            const urlObj = new URL(candidate.officialUrl.trim());
            const domain = urlObj.hostname.toLowerCase();
            // 查询是否已有相同域名的下载源
            const sourceMatch = await prisma.downloadSource.findFirst({
                where: {
                    url: { contains: domain, mode: 'insensitive' },
                },
                include: {
                    version: { include: { software: true } },
                },
            });
            if (sourceMatch && sourceMatch.version?.software) {
                const sw = sourceMatch.version.software;
                // 如果名称也高度一致，认定为完全匹配
                if (sw.name.toLowerCase() === normName || normName.includes(sw.name.toLowerCase())) {
                    return {
                        status: MatchStatus.EXACT_MATCH,
                        matchedSoftwareId: sw.id,
                        matchedSoftwareName: sw.name,
                        matchedSoftwareSlug: sw.slug,
                        confidence: 0.95,
                        reason: `官方域名 [${domain}] 与软件名称一致，匹配已有资源`,
                    };
                }
            }
        }
        catch {
            // 忽略非法 URL 格式
        }
    }
    // 3. 查询名称完全匹配
    const exactNameMatch = await prisma.software.findFirst({
        where: {
            OR: [
                { name: { equals: candidate.name.trim(), mode: 'insensitive' } },
                { englishName: { equals: candidate.name.trim(), mode: 'insensitive' } },
            ],
        },
    });
    if (exactNameMatch) {
        const matchDev = (exactNameMatch.developer || '').toLowerCase();
        // 软件名称相同，但开发者明显冲突
        if (normDev && matchDev && normDev !== matchDev && !normDev.includes(matchDev) && !matchDev.includes(normDev)) {
            return {
                status: MatchStatus.CONFLICT,
                matchedSoftwareId: exactNameMatch.id,
                matchedSoftwareName: exactNameMatch.name,
                matchedSoftwareSlug: exactNameMatch.slug,
                confidence: 0.8,
                reason: `软件名称相同 [${exactNameMatch.name}]，但开发商冲突 (已存在: ${exactNameMatch.developer} vs 输入: ${candidate.developer})`,
            };
        }
        return {
            status: MatchStatus.EXACT_MATCH,
            matchedSoftwareId: exactNameMatch.id,
            matchedSoftwareName: exactNameMatch.name,
            matchedSoftwareSlug: exactNameMatch.slug,
            confidence: 0.9,
            reason: `软件名称 [${exactNameMatch.name}] 完全匹配`,
        };
    }
    // 4. 模糊与别名相似度检测
    const allSoftwares = await prisma.software.findMany({
        select: { id: true, name: true, slug: true, englishName: true, aliases: true, developer: true },
    });
    for (const sw of allSoftwares) {
        const swName = sw.name.toLowerCase();
        const swEng = (sw.englishName || '').toLowerCase();
        // 检查别名列表
        let aliasesList = [];
        try {
            aliasesList = JSON.parse(sw.aliases || '[]');
        }
        catch {
            aliasesList = [];
        }
        const aliasHit = aliasesList.some((al) => al.toLowerCase() === normName);
        if (aliasHit) {
            return {
                status: MatchStatus.POSSIBLE_DUPLICATE,
                matchedSoftwareId: sw.id,
                matchedSoftwareName: sw.name,
                matchedSoftwareSlug: sw.slug,
                confidence: 0.85,
                reason: `输入名称命中已有软件 [${sw.name}] 的已知别名库`,
            };
        }
        // 包含关系或短距离匹配
        if ((normName.length >= 3 && swName.includes(normName)) ||
            (swName.length >= 3 && normName.includes(swName)) ||
            (swEng.length >= 3 && normName.includes(swEng))) {
            return {
                status: MatchStatus.POSSIBLE_DUPLICATE,
                matchedSoftwareId: sw.id,
                matchedSoftwareName: sw.name,
                matchedSoftwareSlug: sw.slug,
                confidence: 0.75,
                reason: `名称与已有软件 [${sw.name}] 存在高度词根重合，疑似重复`,
            };
        }
        // 编辑距离在 2 以内
        if (normName.length > 4 && swName.length > 4) {
            const dist = levenshteinDistance(normName, swName);
            if (dist <= 2) {
                return {
                    status: MatchStatus.POSSIBLE_DUPLICATE,
                    matchedSoftwareId: sw.id,
                    matchedSoftwareName: sw.name,
                    matchedSoftwareSlug: sw.slug,
                    confidence: 0.7,
                    reason: `名称与已有软件 [${sw.name}] 编辑距离极小 (${dist})，建议人工核实`,
                };
            }
        }
    }
    // 5. 无任何冲突，认定为全新资源
    return {
        status: MatchStatus.NEW_RESOURCE,
        confidence: 1.0,
        reason: '未检测到重复或冲突记录，可作为全新资源收录',
    };
}
