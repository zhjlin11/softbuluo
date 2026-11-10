import { FastifyInstance } from 'fastify';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth';
import { EventType, ResourceStatus, VerificationStatus } from '@prisma/client';

export async function statsRoutes(server: FastifyInstance) {
  // 管理员后台仪表盘真实统计数据
  server.get(
    '/api/v1/admin/statistics',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        publishedCount,
        draftCount,
        pendingReviewCount,
        rejectedCount,
        failedSourcesCount,
        recentUpdatesCount,
        totalViewsAgg,
        officialClicksCount,
        recentLogs,
      ] = await Promise.all([
        prisma.software.count({ where: { status: ResourceStatus.PUBLISHED } }),
        prisma.software.count({ where: { status: ResourceStatus.DRAFT } }),
        prisma.software.count({ where: { status: ResourceStatus.PENDING_REVIEW } }),
        prisma.software.count({ where: { status: ResourceStatus.REJECTED } }),
        prisma.downloadSource.count({
          where: { verificationStatus: VerificationStatus.FAILED, isActive: true }
        }),
        prisma.software.count({
          where: { updatedAt: { gte: sevenDaysAgo } }
        }),
        prisma.software.aggregate({
          _sum: { viewCount: true }
        }),
        prisma.downloadEvent.count({
          where: { eventType: EventType.OFFICIAL_LINK_CLICK }
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            actor: {
              select: { username: true, role: true }
            }
          }
        })
      ]);

      return reply.send({
        success: true,
        data: {
          metrics: {
            publishedCount,
            draftCount,
            pendingReviewCount,
            rejectedCount,
            failedSourcesCount,
            recentUpdatesCount,
            totalViews: totalViewsAgg._sum.viewCount || 0,
            officialClicksCount,
          },
          recentAuditLogs: recentLogs.map((log) => ({
            id: log.id,
            action: log.action,
            actorName: log.actor?.username || '系统',
            actorRole: log.actor?.role || 'SYSTEM',
            targetType: log.targetType,
            targetId: log.targetId,
            createdAt: log.createdAt,
            details: log.after,
          }))
        }
      });
    }
  );
}
