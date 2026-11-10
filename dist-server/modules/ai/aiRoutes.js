import { AiProviderService } from './aiProviderService';
import { requireAuth } from '../../middleware/auth';
export async function aiRoutes(fastify) {
    // 获取 Provider 配置列表
    fastify.get('/api/v1/admin/ai/providers', {
        preHandler: [requireAuth],
    }, async (_request, reply) => {
        const list = await AiProviderService.listProviders();
        return reply.send({ success: true, data: list });
    });
    // 创建 Provider 配置
    fastify.post('/api/v1/admin/ai/providers', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const body = request.body;
        if (!body.name || !body.modelName) {
            return reply.status(400).send({ success: false, error: '缺少必填字段 (name, modelName)' });
        }
        try {
            const created = await AiProviderService.createProvider(body);
            return reply.status(201).send({ success: true, data: created });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 更新 Provider 配置
    fastify.put('/api/v1/admin/ai/providers/:id', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        try {
            const updated = await AiProviderService.updateProvider(id, body);
            return reply.send({ success: true, data: updated });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 删除 Provider 配置
    fastify.delete('/api/v1/admin/ai/providers/:id', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            await AiProviderService.deleteProvider(id);
            return reply.send({ success: true, message: 'Provider 已删除' });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 触发 AI 生成（保存为待审核草稿 AI_DRAFT）
    fastify.post('/api/v1/admin/ai/generate', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const body = request.body;
        if (!body.taskType || !body.inputContext) {
            return reply.status(400).send({ success: false, error: '缺少 taskType 或 inputContext' });
        }
        try {
            const task = await AiProviderService.executeGeneration(body);
            return reply.status(201).send({
                success: true,
                data: task,
                message: 'AI 草稿生成完成，已存入待审核库，请核对无误后人工采纳',
            });
        }
        catch (err) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });
    // 任务列表
    fastify.get('/api/v1/admin/ai/tasks', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const query = request.query;
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '20', 10);
        const result = await AiProviderService.listTasks(page, pageSize, query.taskType, query.status);
        return reply.send({ success: true, data: result });
    });
    // 人工审核并采纳/驳回 AI 草稿
    fastify.post('/api/v1/admin/ai/tasks/:id/review', {
        preHandler: [requireAuth],
    }, async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        if (!body.action || !['APPROVE', 'REJECT'].includes(body.action)) {
            return reply.status(400).send({ success: false, error: '审核操作仅支持 APPROVE 或 REJECT' });
        }
        const reviewedBy = request.adminUser?.username || 'admin';
        try {
            const task = await AiProviderService.reviewTask(id, body.action, reviewedBy, {
                applyChanges: body.applyChanges,
                feedback: body.feedback,
            });
            return reply.send({
                success: true,
                data: task,
                message: body.action === 'APPROVE' ? '已采纳 AI 草稿内容' : '已驳回该草稿',
            });
        }
        catch (err) {
            return reply.status(400).send({ success: false, error: err.message });
        }
    });
    // 用量与 Token 消耗统计
    fastify.get('/api/v1/admin/ai/usage', {
        preHandler: [requireAuth],
    }, async (_request, reply) => {
        const analytics = await AiProviderService.getUsageAnalytics();
        return reply.send({ success: true, data: analytics });
    });
}
