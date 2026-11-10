import { z } from 'zod';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ProductStatus, ProductType, Role } from '@prisma/client';
export async function ensureDefaultProducts() {
    const defaults = [
        {
            slug: 'single-service',
            name: '单次尊享下载与技术指导',
            productType: ProductType.SINGLE_SERVICE,
            description: '针对单个受限资源的免排队高速直链下载，附带人工环境排错指导（支持未消费前无理由退款）',
            priceFen: 290, // ¥2.90
            originalPriceFen: 500, // ¥5.00
            durationDays: 0,
            status: ProductStatus.ACTIVE,
            sortOrder: 1,
            entitlementsConfig: JSON.stringify({ quota: 1, type: 'SINGLE_SERVICE' }),
        },
        {
            slug: 'monthly-vip',
            name: '月度会员 (30天全站高速通道)',
            productType: ProductType.MONTHLY_MEMBERSHIP,
            description: '全站所有资源免限速直达下载通道、去广告体验、专属技术教程与社群解答（有效期 30 天，可顺延续费）',
            priceFen: 1990, // ¥19.90
            originalPriceFen: 2990, // ¥29.90
            durationDays: 30,
            status: ProductStatus.ACTIVE,
            sortOrder: 2,
            entitlementsConfig: JSON.stringify({ unlimitedDownloads: true, type: 'MEMBERSHIP_ACCESS' }),
        },
        {
            slug: 'yearly-vip',
            name: '年度终身尊享会员 (365天全站权益)',
            productType: ProductType.YEARLY_MEMBERSHIP,
            description: '365天全站高速直连、专业远程装机急救支持、优先更新推送与VIP专属标识（超高性价比推荐）',
            priceFen: 9900, // ¥99.00
            originalPriceFen: 19900, // ¥199.00
            durationDays: 365,
            status: ProductStatus.ACTIVE,
            sortOrder: 3,
            entitlementsConfig: JSON.stringify({ unlimitedDownloads: true, type: 'MEMBERSHIP_ACCESS', prioritySupport: true }),
        },
    ];
    for (const item of defaults) {
        const exists = await prisma.product.findUnique({
            where: { slug: item.slug },
        });
        if (!exists) {
            await prisma.product.create({
                data: item,
            });
        }
    }
}
export async function productRoutes(server) {
    // 确保系统默认商品存在
    await ensureDefaultProducts();
    // 1. 公开获取所有上架商品
    server.get('/api/v1/products', async (req, reply) => {
        const products = await prisma.product.findMany({
            where: { status: ProductStatus.ACTIVE },
            orderBy: { sortOrder: 'asc' },
        });
        return reply.send({
            success: true,
            data: products.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                productType: p.productType,
                description: p.description,
                priceFen: p.priceFen,
                priceYuan: (p.priceFen / 100).toFixed(2),
                originalPriceFen: p.originalPriceFen,
                originalPriceYuan: p.originalPriceFen ? (p.originalPriceFen / 100).toFixed(2) : null,
                durationDays: p.durationDays,
                sortOrder: p.sortOrder,
            })),
        });
    });
    // 2. 公开获取单个商品信息
    server.get('/api/v1/products/:identifier', async (req, reply) => {
        const { identifier } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                OR: [{ id: identifier }, { slug: identifier }],
            },
        });
        if (!product) {
            return reply.status(404).send({
                success: false,
                error: { code: 'PRODUCT_NOT_FOUND', message: '商品不存在或已下架' },
            });
        }
        return reply.send({
            success: true,
            data: {
                ...product,
                priceYuan: (product.priceFen / 100).toFixed(2),
                originalPriceYuan: product.originalPriceFen ? (product.originalPriceFen / 100).toFixed(2) : null,
            },
        });
    });
    // 3. 管理员获取所有商品 (含未上架/草稿)
    server.get('/api/v1/admin/products', { preHandler: [requireAuth] }, async (req, reply) => {
        const products = await prisma.product.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
        return reply.send({
            success: true,
            data: products,
        });
    });
    // 4. 管理员创建新商品
    const createProductSchema = z.object({
        name: z.string().min(2, '商品名称至少2个字符'),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'slug 仅允许小写字母、数字和连字符'),
        productType: z.nativeEnum(ProductType),
        description: z.string().min(5, '商品描述至少5个字符'),
        priceFen: z.number().int().min(1, '售价必须大于0分'),
        originalPriceFen: z.number().int().optional(),
        durationDays: z.number().int().min(0).default(0),
        sortOrder: z.number().int().default(0),
        status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
        entitlementsConfig: z.string().optional(),
    });
    server.post('/api/v1/admin/products', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] }, async (req, reply) => {
        const parseRes = createProductSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '商品参数格式不正确' },
            });
        }
        const existing = await prisma.product.findUnique({
            where: { slug: parseRes.data.slug },
        });
        if (existing) {
            return reply.status(409).send({
                success: false,
                error: { code: 'DUPLICATE_SLUG', message: '商品 slug 已存在' },
            });
        }
        const product = await prisma.product.create({
            data: parseRes.data,
        });
        return reply.status(201).send({
            success: true,
            data: product,
        });
    });
    // 5. 管理员更新商品
    server.put('/api/v1/admin/products/:id', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const parseRes = createProductSchema.partial().safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '更新参数格式不正确' },
            });
        }
        const updated = await prisma.product.update({
            where: { id },
            data: parseRes.data,
        });
        return reply.send({
            success: true,
            data: updated,
        });
    });
}
