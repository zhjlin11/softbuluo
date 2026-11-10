import { prisma } from '../../db';
import { KeywordIntent, KeywordStatus, PriorityLevel } from '@prisma/client';
export function normalizeKeyword(kw) {
    return kw.toLowerCase().trim().replace(/\s+/g, ' ');
}
export class SeoKeywordService {
    /**
     * 列表查询关键词
     */
    static async listKeywords(params) {
        const page = Math.max(1, params.page || 1);
        const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
        const skip = (page - 1) * pageSize;
        const where = {};
        if (params.intent)
            where.intent = params.intent;
        if (params.status)
            where.status = params.status;
        if (params.priority)
            where.priority = params.priority;
        if (params.search) {
            where.OR = [
                { keyword: { contains: params.search, mode: 'insensitive' } },
                { topic: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const [total, items] = await Promise.all([
            prisma.seoKeyword.count({ where }),
            prisma.seoKeyword.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            }),
        ]);
        return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
    }
    /**
     * 录入单个关键词（自带标准化与去重）
     */
    static async createKeyword(data) {
        const normalized = normalizeKeyword(data.keyword);
        if (!normalized) {
            throw new Error('关键词内容不能为空');
        }
        const existing = await prisma.seoKeyword.findUnique({
            where: { keyword: normalized },
        });
        if (existing) {
            throw new Error(`关键词 "${normalized}" 已存在，避免同质化关键词蚕食冲突`);
        }
        return prisma.seoKeyword.create({
            data: {
                keyword: normalized,
                normalizedKeyword: normalized,
                intent: data.intent || KeywordIntent.SOFTWARE_DOWNLOAD,
                topic: data.topic,
                targetPageType: data.targetPageType,
                targetPageId: data.targetPageId,
                priority: data.priority || PriorityLevel.MEDIUM,
                source: data.source || 'MANUAL',
                searchVolume: data.searchVolume,
                searchVolumeSource: data.searchVolumeSource,
                searchVolumeMeasuredAt: data.searchVolume ? new Date() : undefined,
                competition: data.competition,
                status: data.targetPageId ? KeywordStatus.TARGETED : KeywordStatus.PLANNED,
            },
        });
    }
    /**
     * 批量导入关键词 (支持去重与格式容错)
     */
    static async importKeywords(keywordsList) {
        let created = 0;
        let skipped = 0;
        const errors = [];
        for (const item of keywordsList) {
            const normalized = normalizeKeyword(item.keyword || '');
            if (!normalized) {
                skipped++;
                continue;
            }
            const existing = await prisma.seoKeyword.findUnique({ where: { keyword: normalized } });
            if (existing) {
                skipped++;
                continue;
            }
            let parsedIntent = KeywordIntent.SOFTWARE_DOWNLOAD;
            if (item.intent && Object.values(KeywordIntent).includes(item.intent)) {
                parsedIntent = item.intent;
            }
            let parsedPriority = PriorityLevel.MEDIUM;
            if (item.priority && Object.values(PriorityLevel).includes(item.priority)) {
                parsedPriority = item.priority;
            }
            try {
                await prisma.seoKeyword.create({
                    data: {
                        keyword: normalized,
                        normalizedKeyword: normalized,
                        intent: parsedIntent,
                        topic: item.topic,
                        priority: parsedPriority,
                        targetPageType: item.targetPageType,
                        targetPageId: item.targetPageId,
                        status: item.targetPageId ? KeywordStatus.TARGETED : KeywordStatus.PLANNED,
                        source: 'IMPORT',
                    },
                });
                created++;
            }
            catch (err) {
                errors.push(`"${normalized}": ${err.message}`);
                skipped++;
            }
        }
        return { total: keywordsList.length, created, skipped, errors };
    }
    /**
     * 统计大盘指标与内容缺口
     */
    static async getKeywordStats() {
        const total = await prisma.seoKeyword.count();
        const targeted = await prisma.seoKeyword.count({ where: { status: KeywordStatus.TARGETED } });
        const planned = await prisma.seoKeyword.count({ where: { status: KeywordStatus.PLANNED } });
        const withoutTarget = await prisma.seoKeyword.count({ where: { targetPageId: null } });
        // 按意图分布统计
        const byIntent = await prisma.seoKeyword.groupBy({
            by: ['intent'],
            _count: { id: true },
        });
        return {
            total,
            targeted,
            planned,
            contentGapCount: withoutTarget,
            coverageRate: total > 0 ? Math.round((targeted / total) * 100) : 0,
            intentDistribution: byIntent.map((b) => ({ intent: b.intent, count: b._count.id })),
        };
    }
    static async updateKeyword(id, data) {
        return prisma.seoKeyword.update({ where: { id }, data });
    }
    static async deleteKeyword(id) {
        return prisma.seoKeyword.delete({ where: { id } });
    }
}
