import { prisma } from '../../db';
export class AnalyticsService {
    /**
     * 记录前台页面访问日志 (PV / UV)
     */
    static async recordPageView(params) {
        if (!params.pagePath)
            return null;
        return await prisma.sitePageView.create({
            data: {
                pagePath: params.pagePath.slice(0, 255),
                pageType: params.pageType?.slice(0, 50) || 'OTHER',
                referer: params.referer ? params.referer.slice(0, 255) : null,
                visitorHash: params.visitorHash ? params.visitorHash.slice(0, 64) : null,
                userAgent: params.userAgent ? params.userAgent.slice(0, 255) : null,
            },
        });
    }
    /**
     * 站点增长与流量综合大盘
     */
    static async getOverview() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const [totalPv, todayPv, allViews, topPagesGroup, topReferersGroup, totalSearches, zeroResultSearches, recentPvRecords, totalDownloads, totalOrders, totalMembers,] = await Promise.all([
            prisma.sitePageView.count(),
            prisma.sitePageView.count({
                where: { createdAt: { gte: todayStart } },
            }),
            prisma.sitePageView.findMany({
                where: { createdAt: { gte: todayStart } },
                select: { visitorHash: true },
            }),
            prisma.sitePageView.groupBy({
                by: ['pagePath', 'pageType'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            prisma.sitePageView.groupBy({
                by: ['referer'],
                _count: { id: true },
                where: { referer: { not: null } },
                orderBy: { _count: { id: 'desc' } },
                take: 8,
            }),
            prisma.searchQueryLog.count(),
            prisma.searchQueryLog.count({ where: { hasResults: false } }),
            prisma.sitePageView.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
            }),
            prisma.downloadEvent.count(),
            prisma.order.count(),
            prisma.memberUser.count(),
        ]);
        // 今日独立访客 UV
        const todayUv = new Set(allViews.map((v) => v.visitorHash || 'anon')).size;
        // 近 7 天 PV 趋势
        const trendMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(5, 10); // MM-DD
            trendMap[key] = 0;
        }
        for (const rec of recentPvRecords) {
            const key = rec.createdAt.toISOString().slice(5, 10);
            if (trendMap[key] !== undefined) {
                trendMap[key]++;
            }
        }
        const trend = Object.entries(trendMap).map(([date, pv]) => ({ date, pv }));
        // 搜索无结果率
        const zeroResultRate = totalSearches > 0 ? parseFloat(((zeroResultSearches / totalSearches) * 100).toFixed(1)) : 0;
        return {
            traffic: {
                totalPv,
                todayPv,
                todayUv,
                trend,
            },
            content: {
                topPages: topPagesGroup.map((p) => ({
                    pagePath: p.pagePath,
                    pageType: p.pageType,
                    views: p._count.id,
                })),
                topReferers: topReferersGroup.map((r) => ({
                    referer: r.referer,
                    count: r._count.id,
                })),
            },
            searchMetrics: {
                totalSearches,
                zeroResultSearches,
                zeroResultRate: `${zeroResultRate}%`,
            },
            businessGrowth: {
                totalMembers,
                totalOrders,
                totalDownloads,
            },
            webmasterVerification: {
                baidu: process.env.VERIFICATION_BAIDU || '',
                google: process.env.VERIFICATION_GOOGLE || '',
                bing: process.env.VERIFICATION_BING || '',
                status: 'READY',
            },
        };
    }
}
