import { AnalyticsService } from './analyticsService';
import { requireAuth } from '../../middleware/auth';
import crypto from 'crypto';
export async function analyticsRoutes(fastify) {
    // 前台公开上报接口 (PV/UV 打点)
    fastify.post('/api/v1/analytics/collect', async (request, reply) => {
        const body = request.body;
        if (!body.pagePath) {
            return reply.status(400).send({ success: false, error: 'pagePath required' });
        }
        // 计算轻量访客哈希 (IP + UserAgent) 保护隐私不存原始 IP
        const clientIp = request.ip || '127.0.0.1';
        const userAgent = request.headers['user-agent'] || '';
        const visitorHash = crypto.createHash('sha256').update(`${clientIp}-${userAgent}-${new Date().toISOString().slice(0, 10)}`).digest('hex').slice(0, 16);
        try {
            await AnalyticsService.recordPageView({
                pagePath: body.pagePath,
                pageType: body.pageType,
                referer: body.referer,
                visitorHash,
                userAgent: userAgent.slice(0, 200),
            });
            return reply.send({ success: true });
        }
        catch {
            return reply.send({ success: false });
        }
    });
    // 管理后台：增长与流量大盘数据
    fastify.get('/api/v1/admin/analytics/overview', {
        preHandler: [requireAuth],
    }, async (_request, reply) => {
        const data = await AnalyticsService.getOverview();
        return reply.send({ success: true, data });
    });
}
