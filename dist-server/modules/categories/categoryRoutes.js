import { z } from 'zod';
import { prisma } from '../../db';
import { requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
export async function categoryRoutes(server) {
    // 获取公开可见分类列表
    server.get('/api/v1/categories', async (req, reply) => {
        const categories = await prisma.category.findMany({
            where: { isVisible: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { softwares: { where: { status: 'PUBLISHED' } } }
                }
            }
        });
        const formatted = categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            iconName: cat.icon || 'Grid',
            sortOrder: cat.sortOrder,
            itemCount: cat._count.softwares,
        }));
        return reply.send({
            success: true,
            data: formatted
        });
    });
    // 管理员创建分类
    const createCategorySchema = z.object({
        name: z.string().min(1, '分类名称不能为空'),
        slug: z.string().min(1, 'Slug 不能为空'),
        description: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().default(0),
        parentId: z.string().nullable().optional(),
    });
    server.post('/api/v1/admin/categories', { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = createCategorySchema.safeParse(req.body);
        if (!parseRes.success) {
            const errMsg = parseRes.error.issues?.[0]?.message || parseRes.error.message || '参数校验失败';
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: errMsg }
            });
        }
        const data = parseRes.data;
        const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (existing) {
            return reply.status(409).send({
                success: false,
                error: { code: 'SLUG_CONFLICT', message: `Slug "${data.slug}" 已存在` }
            });
        }
        const created = await prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                icon: data.icon,
                sortOrder: data.sortOrder,
                parentId: data.parentId || undefined,
            }
        });
        return reply.status(201).send({
            success: true,
            data: created
        });
    });
}
