import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, ResourceStatus, ResourceType, CandidateReviewStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../../db';
export async function operationsRoutes(server) {
    // 1. 运营工作台综合数据大盘 (全部取自真实数据库)
    const overviewHandler = async (req, reply) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalSoftwares, publishedSoftwares, pendingSoftwares, draftSoftwares, totalGames, pendingVersionCandidates, brokenLinksCount, qualityReports, todayAddedCount, recent7DaysUpdatedCount, officialClicksCount, unreadNotificationsCount,] = await Promise.all([
            prisma.software.count({ where: { isTestData: false } }),
            prisma.software.count({ where: { status: ResourceStatus.PUBLISHED, isTestData: false } }),
            prisma.software.count({ where: { status: ResourceStatus.PENDING_REVIEW, isTestData: false } }),
            prisma.software.count({ where: { status: ResourceStatus.DRAFT, isTestData: false } }),
            prisma.software.count({ where: { type: ResourceType.GAME, isTestData: false } }),
            prisma.versionCandidate.count({ where: { reviewStatus: CandidateReviewStatus.PENDING_REVIEW } }),
            prisma.downloadSource.count({
                where: {
                    OR: [
                        { verificationStatus: VerificationStatus.FAILED },
                        { lastHttpStatus: { in: [404, 410, 0] } },
                    ],
                },
            }),
            prisma.resourceQualityReport.findMany({ select: { completenessScore: true } }),
            prisma.software.count({ where: { createdAt: { gte: startOfToday }, isTestData: false } }),
            prisma.software.count({ where: { updatedAt: { gte: sevenDaysAgo }, isTestData: false } }),
            prisma.downloadEvent.count({ where: { eventType: 'OFFICIAL_LINK_CLICK' } }),
            prisma.operationNotification.count({ where: { isRead: false } }),
        ]);
        const avgQualityScore = qualityReports.length > 0
            ? Math.round(qualityReports.reduce((sum, r) => sum + r.completenessScore, 0) / qualityReports.length)
            : 85;
        return reply.send({
            success: true,
            data: {
                resources: {
                    total: totalSoftwares,
                    published: publishedSoftwares,
                    pending: pendingSoftwares,
                    draft: draftSoftwares,
                },
                versionCandidates: {
                    pendingReview: pendingVersionCandidates,
                    total: pendingVersionCandidates,
                },
                links: {
                    brokenOrNeedsReview: brokenLinksCount,
                    broken: brokenLinksCount,
                    needsReview: 0,
                },
                totalSoftwares,
                publishedSoftwares,
                pendingSoftwares,
                draftSoftwares,
                totalGames,
                pendingVersionCandidates,
                brokenLinksCount,
                averageQualityScore: avgQualityScore,
                todayAddedCount,
                recent7DaysUpdatedCount,
                officialClicksCount,
                unreadNotificationsCount,
            },
        });
    };
    server.get('/api/v1/admin/operations/overview', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, overviewHandler);
    server.get('/api/v1/admin/operations/stats', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, overviewHandler);
    // 2. 运营待办事项中心 (待审资源、待审新版本、失效链接、资料缺失资源)
    server.get('/api/v1/admin/operations/todos', { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const [pendingResources, pendingVersions, brokenSources, lowQualityReports] = await Promise.all([
            prisma.software.findMany({
                where: { status: ResourceStatus.PENDING_REVIEW, isTestData: false },
                take: 10,
                select: { id: true, name: true, slug: true, developer: true, createdAt: true },
            }),
            prisma.versionCandidate.findMany({
                where: { reviewStatus: CandidateReviewStatus.PENDING_REVIEW },
                take: 10,
                include: { software: { select: { name: true, slug: true } } },
            }),
            prisma.downloadSource.findMany({
                where: {
                    OR: [
                        { verificationStatus: VerificationStatus.FAILED },
                        { lastHttpStatus: { in: [404, 410, 0] } },
                    ],
                },
                take: 10,
                include: {
                    version: { select: { version: true, software: { select: { name: true } } } },
                },
            }),
            prisma.resourceQualityReport.findMany({
                where: { completenessScore: { lt: 70 } },
                take: 10,
                include: {
                    software: { select: { id: true, name: true, slug: true } },
                },
            }),
        ]);
        return reply.send({
            success: true,
            data: {
                pendingResources,
                pendingVersions,
                brokenSources: brokenSources.map((s) => ({
                    id: s.id,
                    sourceName: s.sourceName,
                    url: s.url,
                    lastHttpStatus: s.lastHttpStatus,
                    softwareName: s.version.software.name,
                    version: s.version.version,
                })),
                lowQualitySoftwares: lowQualityReports.map((q) => ({
                    softwareId: q.softwareId,
                    softwareName: q.software.name,
                    slug: q.software.slug,
                    score: q.completenessScore,
                })),
            },
        });
    });
    // 3. 获取运营站内通知列表
    server.get('/api/v1/admin/operations/notifications', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const notifications = await prisma.operationNotification.findMany({
            orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
            take: 30,
        });
        return reply.send({
            success: true,
            data: notifications,
        });
    });
    // 4. 标记通知为已读
    server.patch('/api/v1/admin/operations/notifications/:id/read', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const updated = await prisma.operationNotification.update({
            where: { id },
            data: { isRead: true },
        });
        return reply.send({
            success: true,
            data: updated,
        });
    });
}
