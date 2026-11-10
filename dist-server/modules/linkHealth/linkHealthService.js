import { prisma } from '../../db';
import { LinkHealthStatus, VerificationStatus, NotificationLevel } from '@prisma/client';
import { validateSafeExternalUrl } from '../../utils/security';
/**
 * 执行单个下载源健康探测（含严格逐跳 SSRF 防护）
 */
export async function checkSingleDownloadSource(sourceId) {
    const source = await prisma.downloadSource.findUnique({
        where: { id: sourceId },
        include: {
            version: { include: { software: true } },
        },
    });
    if (!source) {
        throw new Error('下载源不存在');
    }
    const startTime = Date.now();
    // 1. SSRF 拦截检查
    const safeCheck = await validateSafeExternalUrl(source.url);
    if (!safeCheck.valid) {
        const log = await prisma.linkCheckLog.create({
            data: {
                sourceId,
                url: source.url,
                httpStatus: 403,
                healthStatus: LinkHealthStatus.BROKEN,
                responseTimeMs: Date.now() - startTime,
                isSafeUrl: false,
                errorMessage: safeCheck.reason || 'SSRF 拦截：禁止访问内网或非法目标',
            },
        });
        await prisma.downloadSource.update({
            where: { id: sourceId },
            data: {
                lastCheckedAt: new Date(),
                lastHttpStatus: 403,
                verificationStatus: VerificationStatus.FAILED,
            },
        });
        return {
            sourceId,
            url: source.url,
            httpStatus: 403,
            healthStatus: LinkHealthStatus.BROKEN,
            responseTimeMs: Date.now() - startTime,
            isSafeUrl: false,
            errorMessage: safeCheck.reason,
        };
    }
    // 2. 发起真实 HTTP 连通性探测
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 秒超时
        const res = await fetch(source.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoftBuluo-HealthBot/3.0 (+https://softbuluo.com/health; health@softbuluo.com)',
                'Accept': '*/*',
            },
            signal: controller.signal,
            redirect: 'manual', // 手动捕获重定向
        });
        clearTimeout(timeout);
        const responseTimeMs = Date.now() - startTime;
        const status = res.status;
        let healthStatus = LinkHealthStatus.UNKNOWN;
        let redirectUrl = undefined;
        if (status >= 200 && status < 300) {
            healthStatus = LinkHealthStatus.HEALTHY;
        }
        else if (status >= 300 && status < 400) {
            healthStatus = LinkHealthStatus.REDIRECTED;
            redirectUrl = res.headers.get('location') || undefined;
        }
        else if (status === 403) {
            // 规范约束：不能把所有 403 都直接判为失效，防爬策略或限流标记为待人工审核
            healthStatus = LinkHealthStatus.NEEDS_REVIEW;
        }
        else if (status === 404 || status === 410) {
            healthStatus = LinkHealthStatus.BROKEN;
        }
        else if (status >= 500) {
            healthStatus = LinkHealthStatus.TEMPORARY_ERROR;
        }
        else {
            healthStatus = LinkHealthStatus.NEEDS_REVIEW;
        }
        // 记录检测流水
        await prisma.linkCheckLog.create({
            data: {
                sourceId,
                url: source.url,
                httpStatus: status,
                healthStatus,
                responseTimeMs,
                redirectUrl,
                isSafeUrl: true,
            },
        });
        // 同步更新源状态
        await prisma.downloadSource.update({
            where: { id: sourceId },
            data: {
                lastCheckedAt: new Date(),
                lastHttpStatus: status,
                verificationStatus: healthStatus === LinkHealthStatus.HEALTHY || healthStatus === LinkHealthStatus.REDIRECTED
                    ? VerificationStatus.VERIFIED
                    : healthStatus === LinkHealthStatus.BROKEN
                        ? VerificationStatus.FAILED
                        : source.verificationStatus,
            },
        });
        // 若检测为损坏，写入运营提醒
        if (healthStatus === LinkHealthStatus.BROKEN) {
            const swName = source.version?.software?.name || '未知软件';
            await prisma.operationNotification.create({
                data: {
                    title: `下载源异常失效: ${swName}`,
                    message: `软件 [${swName}] 的下载源 [${source.sourceName}] HTTP 响应 ${status}，已被判定为失效，建议核实。`,
                    level: NotificationLevel.WARNING,
                    category: 'BROKEN_LINK',
                    targetUrl: `/admin/link-monitor?sourceId=${sourceId}`,
                },
            });
        }
        return {
            sourceId,
            url: source.url,
            httpStatus: status,
            healthStatus,
            responseTimeMs,
            redirectUrl,
            isSafeUrl: true,
        };
    }
    catch (err) {
        const responseTimeMs = Date.now() - startTime;
        const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
        const log = await prisma.linkCheckLog.create({
            data: {
                sourceId,
                url: source.url,
                httpStatus: 0,
                healthStatus: isTimeout ? LinkHealthStatus.TEMPORARY_ERROR : LinkHealthStatus.BROKEN,
                responseTimeMs,
                isSafeUrl: true,
                errorMessage: err.message || '网络连接超时或不可达',
            },
        });
        await prisma.downloadSource.update({
            where: { id: sourceId },
            data: {
                lastCheckedAt: new Date(),
                lastHttpStatus: 0,
                verificationStatus: VerificationStatus.FAILED,
            },
        });
        return {
            sourceId,
            url: source.url,
            httpStatus: 0,
            healthStatus: isTimeout ? LinkHealthStatus.TEMPORARY_ERROR : LinkHealthStatus.BROKEN,
            responseTimeMs,
            errorMessage: err.message,
            isSafeUrl: true,
        };
    }
}
/**
 * 批量执行全量或最久未检测下载源健康扫描 (带并发保护)
 */
export async function checkAllDownloadSources(limit = 20) {
    const sources = await prisma.downloadSource.findMany({
        where: { isActive: true },
        orderBy: { lastCheckedAt: 'asc' }, // 优先扫描从未检测或最早检测的
        take: limit,
    });
    const results = [];
    // 控制并发数为 5，避免被对端封禁
    const chunkSize = 5;
    for (let i = 0; i < sources.length; i += chunkSize) {
        const chunk = sources.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map((s) => checkSingleDownloadSource(s.id).catch((e) => ({
            sourceId: s.id,
            url: s.url,
            httpStatus: 0,
            healthStatus: LinkHealthStatus.BROKEN,
            responseTimeMs: 0,
            errorMessage: e.message,
            isSafeUrl: true,
        }))));
        results.push(...chunkResults);
    }
    const healthyCount = results.filter((r) => r.healthStatus === LinkHealthStatus.HEALTHY).length;
    const brokenCount = results.filter((r) => r.healthStatus === LinkHealthStatus.BROKEN).length;
    const redirectedCount = results.filter((r) => r.healthStatus === LinkHealthStatus.REDIRECTED).length;
    const needsReviewCount = results.filter((r) => r.healthStatus === LinkHealthStatus.NEEDS_REVIEW).length;
    return {
        scannedCount: results.length,
        healthyCount,
        brokenCount,
        redirectedCount,
        needsReviewCount,
        results,
    };
}
/**
 * 分页查询检测日志
 */
export async function listLinkCheckLogs(params) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;
    const where = {};
    if (params.healthStatus)
        where.healthStatus = params.healthStatus;
    if (params.sourceId)
        where.sourceId = params.sourceId;
    const [total, items] = await Promise.all([
        prisma.linkCheckLog.count({ where }),
        prisma.linkCheckLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { checkedAt: 'desc' },
            include: {
                downloadSource: {
                    select: {
                        id: true,
                        sourceName: true,
                        url: true,
                        version: {
                            select: {
                                version: true,
                                software: { select: { id: true, name: true, slug: true } },
                            },
                        },
                    },
                },
            },
        }),
    ]);
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
