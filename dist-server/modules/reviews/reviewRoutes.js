import { ReviewService } from './reviewService';
import { requireAuth, requireMemberAuth, optionalMemberAuth } from '../../middleware/auth';
export async function reviewRoutes(fastify) {
    // 公开接口：获取软件评价列表与评分统计
    fastify.get('/api/v1/software/:slug/reviews', async (request, reply) => {
        const { slug } = request.params;
        const query = request.query;
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '10', 10);
        const result = await ReviewService.getReviewsForSoftware(slug, page, pageSize);
        if (!result) {
            return reply.status(404).send({ success: false, error: '软件资源未找到' });
        }
        return reply.send({ success: true, data: result });
    });
    // 会员接口：提交或更新评价
    fastify.post('/api/v1/software/:id/reviews', {
        preHandler: [requireMemberAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.memberUser.memberId;
        const body = request.body;
        try {
            const res = await ReviewService.submitReview(userId, {
                softwareId: id,
                rating: body.rating,
                title: body.title,
                content: body.content,
                versionUsed: body.versionUsed,
                operatingSystem: body.operatingSystem,
            });
            return reply.send({
                success: true,
                data: res.review,
                message: res.isPendingReview ? '评价已提交，正在进行安全审核' : '评价发布成功',
            });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 会员接口：评价点赞 / 踩
    fastify.post('/api/v1/reviews/:id/vote', {
        preHandler: [requireMemberAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.memberUser.memberId;
        const body = request.body;
        if (body.isHelpful === undefined) {
            return reply.status(400).send({ success: false, error: '缺少 isHelpful 参数' });
        }
        try {
            const res = await ReviewService.voteReview(userId, id, body.isHelpful);
            return reply.send({ success: true, data: res });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 会员接口：举报评价
    fastify.post('/api/v1/reviews/:id/report', {
        preHandler: [requireMemberAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.memberUser.memberId;
        const body = request.body;
        if (!body.reason) {
            return reply.status(400).send({ success: false, error: '请提供举报原因' });
        }
        try {
            const report = await ReviewService.reportReview(userId, id, body.reason, body.description);
            return reply.status(201).send({ success: true, data: report, message: '举报已受理，感谢维护社区生态' });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 公开/会员接口：提交软件纠错 / 报错
    fastify.post('/api/v1/software/:id/corrections', {
        preHandler: [optionalMemberAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.memberUser?.memberId;
        const body = request.body;
        if (!body.details || body.details.trim().length < 4) {
            return reply.status(400).send({ success: false, error: '请详细描述您发现的问题（不少于 4 个字）' });
        }
        try {
            const correction = await ReviewService.submitCorrection({
                softwareId: id,
                userId,
                correctionType: body.correctionType || 'OTHER',
                details: body.details,
                contactEmail: body.contactEmail,
            });
            return reply.status(201).send({
                success: true,
                data: correction,
                message: '感谢您的纠错反馈，我们将尽快核实更新！',
            });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // --- 管理后台接口 ---
    // 评价审核列表
    fastify.get('/api/v1/admin/reviews', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const query = request.query;
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '20', 10);
        const result = await ReviewService.adminListReviews(page, pageSize, query.status, query.softwareId);
        return reply.send({ success: true, data: result });
    });
    // 更新评价审核状态
    fastify.put('/api/v1/admin/reviews/:id/status', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        if (!body.status) {
            return reply.status(400).send({ success: false, error: '缺少审核状态 status' });
        }
        try {
            const updated = await ReviewService.adminUpdateReviewStatus(id, body.status);
            return reply.send({ success: true, data: updated });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 删除评价
    fastify.delete('/api/v1/admin/reviews/:id', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            await ReviewService.adminDeleteReview(id);
            return reply.send({ success: true, message: '评价已彻底删除' });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 用户纠错反馈列表
    fastify.get('/api/v1/admin/corrections', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const query = request.query;
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '20', 10);
        const result = await ReviewService.adminListCorrections(page, pageSize, query.status);
        return reply.send({ success: true, data: result });
    });
    // 处理纠错反馈
    fastify.put('/api/v1/admin/corrections/:id/status', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        if (!body.status) {
            return reply.status(400).send({ success: false, error: '缺少处理状态 status' });
        }
        try {
            const updated = await ReviewService.adminUpdateCorrectionStatus(id, body.status, request.adminUser?.username);
            return reply.send({ success: true, data: updated });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 评价举报列表
    fastify.get('/api/v1/admin/reports', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const query = request.query;
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '20', 10);
        const result = await ReviewService.adminListReports(page, pageSize, query.status);
        return reply.send({ success: true, data: result });
    });
    // 处理举报
    fastify.put('/api/v1/admin/reports/:id/status', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        if (!body.status) {
            return reply.status(400).send({ success: false, error: '缺少处理状态 status' });
        }
        try {
            const updated = await ReviewService.adminUpdateReportStatus(id, body.status, request.adminUser?.username);
            return reply.send({ success: true, data: updated });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
}
