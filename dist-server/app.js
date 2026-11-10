import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import multipart from '@fastify/multipart';
import { config, validateEnvironmentSecurity } from './config';
import { checkDatabaseConnection } from './db';
import { authRoutes } from './modules/auth/authRoutes';
import { categoryRoutes } from './modules/categories/categoryRoutes';
import { resourceRoutes } from './modules/resources/resourceRoutes';
import { searchRoutes } from './modules/search/searchRoutes';
import { downloadRoutes } from './modules/downloads/downloadRoutes';
import { statsRoutes } from './modules/statistics/statsRoutes';
import { uploadRoutes } from './modules/uploads/uploadRoutes';
import { memberRoutes } from './modules/members/memberRoutes';
import { productRoutes } from './modules/products/productRoutes';
import { orderRoutes } from './modules/orders/orderRoutes';
import { paymentRoutes } from './modules/payments/paymentRoutes';
import { refundRoutes } from './modules/refunds/refundRoutes';
import { commerceAdminRoutes } from './modules/admin/commerceAdminRoutes';
import { sourceRoutes } from './modules/sources/sourceRoutes';
import { importRoutes } from './modules/import/importRoutes';
import { versionRoutes } from './modules/versions/versionRoutes';
import { linkHealthRoutes } from './modules/linkHealth/linkHealthRoutes';
import { jobRoutes } from './modules/jobs/jobRoutes';
import { topicRoutes } from './modules/topics/topicRoutes';
import { tutorialAdminRoutes } from './modules/tutorials/tutorialAdminRoutes';
import { operationsRoutes } from './modules/operations/operationsRoutes';
import { seoRoutes } from './modules/seo/seoRoutes';
import { seoAdminRoutes } from './modules/seo/seoAdminRoutes';
import { comparisonRoutes } from './modules/comparisons/comparisonRoutes';
import { alternativeRoutes } from './modules/alternatives/alternativeRoutes';
import { reviewRoutes } from './modules/reviews/reviewRoutes';
import { aiRoutes } from './modules/ai/aiRoutes';
import { analyticsRoutes } from './modules/analytics/analyticsRoutes';
import { healthRoutes } from './modules/health/healthRoutes';
import { governanceRoutes } from './modules/governance/governanceRoutes';
import { bookmarkRoutes } from './modules/bookmarks/bookmarkRoutes';
import { initDefaultJobs, recoverStaleJobs } from './modules/jobs/jobSchedulerService';
export async function buildApp() {
    // 执行生产安全配置与合规启动校验
    validateEnvironmentSecurity();
    const server = Fastify({
        logger: {
            level: config.isProd ? 'info' : 'debug',
            transport: config.isProd
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                    },
                },
        },
        trustProxy: true,
    });
    // CORS 配置（生产环境严格限制为合法授权前端域名，拒绝无条件通配）
    const allowedOrigins = config.isProd
        ? [config.clientUrl]
        : [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    await server.register(cors, {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    });
    // Cookie 与 Session 支持
    await server.register(cookie);
    await server.register(session, {
        secret: config.sessionSecret,
        cookieName: 'softbuluo_session',
        cookie: {
            secure: config.isProd,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天有效期
            path: '/',
        },
    });
    // 文件上传支持 (最大 100MB)
    await server.register(multipart, {
        limits: {
            fileSize: 100 * 1024 * 1024,
        },
    });
    // 生产安全加固响应头 (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
    server.addHook('onSend', async (_request, reply) => {
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'SAMEORIGIN');
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        if (config.isProd) {
            reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            reply.header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' https: data:;");
        }
    });
    // 健康检查接口
    server.get('/api/health', async () => {
        const dbStatus = await checkDatabaseConnection();
        return {
            status: dbStatus.connected ? 'healthy' : 'degraded',
            database: dbStatus.connected ? 'connected' : 'error',
            dbError: dbStatus.error,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    });
    // 注册 P1 核心业务路由
    await server.register(authRoutes);
    await server.register(categoryRoutes);
    await server.register(resourceRoutes);
    await server.register(searchRoutes);
    await server.register(downloadRoutes);
    await server.register(statsRoutes);
    await server.register(uploadRoutes);
    // 注册 P2 商业化与会员系统业务路由
    await server.register(memberRoutes);
    await server.register(productRoutes);
    await server.register(orderRoutes);
    await server.register(paymentRoutes);
    await server.register(refundRoutes);
    await server.register(commerceAdminRoutes);
    // 注册 P3 资源自动化运营与监控路由
    await server.register(sourceRoutes);
    await server.register(importRoutes);
    await server.register(versionRoutes);
    await server.register(linkHealthRoutes);
    await server.register(jobRoutes);
    await server.register(topicRoutes);
    await server.register(tutorialAdminRoutes);
    await server.register(operationsRoutes);
    await server.register(seoRoutes);
    await server.register(healthRoutes);
    // 注册 P4 SEO 内容增长、横向评测、替代品关联、真实评价、AI 辅助运营与数据分析路由
    await server.register(seoAdminRoutes);
    await server.register(comparisonRoutes);
    await server.register(alternativeRoutes);
    await server.register(reviewRoutes);
    await server.register(aiRoutes);
    await server.register(analyticsRoutes);
    await server.register(governanceRoutes, { prefix: '/api/v1/admin/governance' });
    await server.register(bookmarkRoutes, { prefix: '/api/v1/user/bookmarks' });
    // 初始化定时调度作业并自动回收上一任异常遗留的租约
    try {
        await initDefaultJobs();
        await recoverStaleJobs();
    }
    catch (err) {
        server.log.warn(`调度任务初始化/恢复警告: ${err.message}`);
    }
    return server;
}
