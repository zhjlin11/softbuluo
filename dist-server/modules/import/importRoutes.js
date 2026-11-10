import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, ImportType } from '@prisma/client';
import { parseCsvContent, parseExcelBuffer, fetchUrlMetadata, createImportBatch, commitBatchItems, } from './importService';
import { prisma } from '../../db';
export async function importRoutes(server) {
    // 1. CSV 文本或文件数据预览查重接口
    const csvSchema = z.object({
        csvContent: z.string().min(1, 'CSV 内容不能为空'),
        fileName: z.string().optional().default('import.csv'),
    });
    server.post('/api/v1/admin/import/csv', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = csvSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
            });
        }
        try {
            const rows = parseCsvContent(parseRes.data.csvContent);
            if (rows.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'EMPTY_CSV', message: '未能从 CSV 中解析出有效的资源数据行' },
                });
            }
            const batch = await createImportBatch({
                rows,
                importType: ImportType.CSV,
                actorId: req.adminUser.userId,
                fileName: parseRes.data.fileName,
            });
            return reply.status(201).send({
                success: true,
                data: batch,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'CSV_PARSE_FAILED', message: err.message },
            });
        }
    });
    // 1.2 XLSX / Excel 电子表格 Base64 批量导入接口
    const xlsxSchema = z.object({
        excelBase64: z.string().min(1, 'Excel Base64 数据不能为空'),
        fileName: z.string().optional().default('import.xlsx'),
    });
    server.post('/api/v1/admin/import/xlsx', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = xlsxSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
            });
        }
        try {
            const buffer = Buffer.from(parseRes.data.excelBase64, 'base64');
            const rows = parseExcelBuffer(buffer);
            if (rows.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'EMPTY_EXCEL', message: '未能从 Excel 工作表中解析出有效的资源数据行' },
                });
            }
            const batch = await createImportBatch({
                rows,
                importType: ImportType.EXCEL,
                actorId: req.adminUser.userId,
                fileName: parseRes.data.fileName,
            });
            return reply.status(201).send({
                success: true,
                data: batch,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'EXCEL_PARSE_FAILED', message: err.message },
            });
        }
    });
    // 1.3 文件流上传导入接口 (自动识别 CSV / XLSX)
    server.post('/api/v1/admin/import/file', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({
                success: false,
                error: { code: 'NO_FILE', message: '未检测到上传文件' },
            });
        }
        const filename = data.filename.toLowerCase();
        const buffer = await data.toBuffer();
        try {
            let rows = [];
            let importType = ImportType.CSV;
            if (filename.endsWith('.csv')) {
                rows = parseCsvContent(buffer.toString('utf-8'));
                importType = ImportType.CSV;
            }
            else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                rows = parseExcelBuffer(buffer);
                importType = ImportType.EXCEL;
            }
            else {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'UNSUPPORTED_FORMAT', message: '仅支持上传 .csv 或 .xlsx / .xls 格式文件' },
                });
            }
            if (rows.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: { code: 'EMPTY_FILE', message: '文件中无有效数据行' },
                });
            }
            const batch = await createImportBatch({
                rows,
                importType,
                actorId: req.adminUser.userId,
                fileName: data.filename,
            });
            return reply.status(201).send({
                success: true,
                data: batch,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'IMPORT_FILE_FAILED', message: err.message },
            });
        }
    });
    // 2. 官方 URL 智能抓取元数据接口
    const urlSchema = z.object({
        url: z.string().url('必须输入合法的 HTTP/HTTPS 链接'),
    });
    server.post('/api/v1/admin/import/url', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = urlSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'URL 格式不合法' },
            });
        }
        try {
            const meta = await fetchUrlMetadata(parseRes.data.url);
            return reply.send({
                success: true,
                data: meta,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'METADATA_FETCH_FAILED', message: err.message },
            });
        }
    });
    // 3. 获取历史导入批次列表
    server.get('/api/v1/admin/import/batches', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;
        const [total, batches] = await Promise.all([
            prisma.importBatch.count(),
            prisma.importBatch.findMany({
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { items: true } },
                },
            }),
        ]);
        return reply.send({
            success: true,
            data: batches,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    });
    // 4. 获取指定批次详情及去重结果项
    server.get('/api/v1/admin/import/batches/:id', { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const batch = await prisma.importBatch.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { rawRowIndex: 'asc' },
                },
            },
        });
        if (!batch) {
            return reply.status(404).send({
                success: false,
                error: { code: 'BATCH_NOT_FOUND', message: '导入批次不存在' },
            });
        }
        return reply.send({
            success: true,
            data: batch,
        });
    });
    // 5. 提交/审核批准批量导入项
    const commitSchema = z.object({
        itemActions: z.array(z.object({
            itemId: z.string().min(1),
            action: z.enum(['APPROVE', 'REJECT']),
            categoryId: z.string().optional(),
            overrideSlug: z.string().optional(),
        })).min(1, '至少选择一项进行操作'),
    });
    server.post('/api/v1/admin/import/batches/:id/commit', { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const parseRes = commitSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
            });
        }
        try {
            const result = await commitBatchItems({
                batchId: id,
                itemActions: parseRes.data.itemActions,
                actorId: req.adminUser.userId,
            });
            return reply.send({
                success: true,
                data: result,
            });
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                error: { code: 'COMMIT_FAILED', message: err.message },
            });
        }
    });
}
