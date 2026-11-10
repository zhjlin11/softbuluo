import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, SoftwareSourceType, SourceTrustStatus } from '@prisma/client';
import { createSoftwareSource, updateSoftwareSource, verifySoftwareSource, listSoftwareSources, } from './sourceService';
import { prisma } from '../../db';
export async function sourceRoutes(server) {
    // 1. 获取官方资源来源列表
    server.get('/api/v1/admin/sources', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { page, limit, trustStatus, sourceType, q } = req.query;
        const result = await listSoftwareSources({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            trustStatus: trustStatus,
            sourceType: sourceType,
            q,
        });
        return reply.send({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    });
    // 2. 添加官方资源来源
    const createSchema = z.object({
        name: z.string().min(2, '来源名称至少2个字符'),
        sourceType: z.nativeEnum(SoftwareSourceType).default(SoftwareSourceType.OFFICIAL_WEBSITE),
        baseUrl: z.string().url('必须输入合法的 HTTP/HTTPS 链接'),
        developerName: z.string().optional(),
        discoveryMethod: z.string().optional(),
        apiEndpoint: z.string().optional(),
        checkInterval: z.number().int().min(60).optional(),
        rateLimit: z.number().int().min(1).optional(),
        softwareId: z.string().optional(),
    });
    server.post('/api/v1/admin/sources', { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = createSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
            });
        }
        try {
            const source = await createSoftwareSource(parseRes.data);
            return reply.status(201).send({
                success: true,
                data: source,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'SOURCE_CREATION_FAILED', message: err.message },
            });
        }
    });
    // 3. 更新官方资源来源
    const updateSchema = z.object({
        name: z.string().min(2).optional(),
        baseUrl: z.string().url().optional(),
        developerName: z.string().nullable().optional(),
        discoveryMethod: z.string().optional(),
        apiEndpoint: z.string().nullable().optional(),
        enabled: z.boolean().optional(),
        trustStatus: z.nativeEnum(SourceTrustStatus).optional(),
        checkInterval: z.number().int().min(60).optional(),
        rateLimit: z.number().int().min(1).optional(),
        softwareId: z.string().nullable().optional(),
    });
    server.patch('/api/v1/admin/sources/:id', { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const parseRes = updateSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
            });
        }
        try {
            const source = await updateSoftwareSource(id, parseRes.data);
            return reply.send({
                success: true,
                data: source,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'SOURCE_UPDATE_FAILED', message: err.message },
            });
        }
    });
    // 4. 手动发起来源健康核验
    server.post('/api/v1/admin/sources/:id/verify', { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        try {
            const result = await verifySoftwareSource(id);
            return reply.send({
                success: true,
                data: result,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VERIFICATION_ERROR', message: err.message },
            });
        }
    });
    // 5. 删除来源
    server.delete('/api/v1/admin/sources/:id', { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const source = await prisma.softwareSource.findUnique({ where: { id } });
        if (!source) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: '来源不存在' },
            });
        }
        await prisma.softwareSource.delete({ where: { id } });
        return reply.send({
            success: true,
            message: '来源已成功删除',
        });
    });
    // 6. 测试外部 URL 安全性与域名提取 (带 SSRF 防护)
    server.post('/api/v1/admin/sources/test', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { url } = req.body || {};
        if (!url) {
            return reply.status(400).send({ success: false, message: 'URL 不能为空' });
        }
        const { validateSafeExternalUrl } = await import('../../utils/security');
        const check = await validateSafeExternalUrl(url);
        if (!check.valid) {
            return reply.status(400).send({
                success: false,
                error: { code: 'SSRF_BLOCKED', message: check.reason || '检测到私有或内网非法地址' },
                message: check.reason || '检测到私有或内网非法地址',
            });
        }
        return reply.send({
            success: true,
            data: {
                verifiedDomain: check.urlObj?.hostname,
                url,
                httpStatus: 200,
            },
        });
    });
}
