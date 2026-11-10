/**
 * 软游部落 P3.1 官方数据源真实联网验证与元数据探针服务
 */
/**
 * 真实请求 GitHub Releases API 获取公开项目元数据
 */
export async function fetchGitHubReleaseMetadata(owner, repo, timeoutMs = 8000) {
    const targetUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'SoftBuluo-OfficialVerifier/3.1 (+https://softbuluo.com; security-audit)',
                Accept: 'application/vnd.github.v3+json',
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const responseTimeMs = Date.now() - startTime;
        const rateLimitRem = res.headers.get('x-ratelimit-remaining') || undefined;
        if (res.status === 200) {
            const data = (await res.json());
            const ver = (data.tag_name || data.name || '').replace(/^v/i, '').trim();
            return {
                source: 'GITHUB',
                url: targetUrl,
                statusCode: 200,
                success: true,
                version: ver,
                releaseDate: data.published_at || data.created_at,
                releaseNotes: (data.body || '').slice(0, 1500),
                releaseUrl: data.html_url,
                assetsCount: Array.isArray(data.assets) ? data.assets.length : 0,
                rateLimitRemaining: rateLimitRem,
                responseTimeMs,
            };
        }
        if (res.status === 403) {
            return {
                source: 'GITHUB',
                url: targetUrl,
                statusCode: 403,
                success: false,
                errorType: 'RATE_LIMITED',
                errorMessage: 'GitHub API 请求频率达到匿名上限或受限 (403 Forbidden)',
                rateLimitRemaining: rateLimitRem,
                responseTimeMs,
            };
        }
        if (res.status === 404) {
            return {
                source: 'GITHUB',
                url: targetUrl,
                statusCode: 404,
                success: false,
                errorType: 'NOT_FOUND',
                errorMessage: `目标仓库未找到或尚未发布任何 Release (${owner}/${repo})`,
                responseTimeMs,
            };
        }
        return {
            source: 'GITHUB',
            url: targetUrl,
            statusCode: res.status,
            success: false,
            errorType: 'UNKNOWN',
            errorMessage: `GitHub API 异常响应: HTTP ${res.status}`,
            responseTimeMs,
        };
    }
    catch (err) {
        clearTimeout(timeoutId);
        const responseTimeMs = Date.now() - startTime;
        if (err.name === 'AbortError') {
            return {
                source: 'GITHUB',
                url: targetUrl,
                statusCode: 0,
                success: false,
                errorType: 'TIMEOUT',
                errorMessage: `请求超时 (${timeoutMs}ms 未响应)`,
                responseTimeMs,
            };
        }
        return {
            source: 'GITHUB',
            url: targetUrl,
            statusCode: 0,
            success: false,
            errorType: 'DNS_ERROR',
            errorMessage: `网络连接异常: ${err.message}`,
            responseTimeMs,
        };
    }
}
/**
 * 真实探测官方下载链接连通性
 */
export async function probeOfficialDownloadLink(targetUrl, timeoutMs = 6000) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SoftBuluoBot/3.1',
                Range: 'bytes=0-10', // 仅拉取前 10 字节，严禁下载整个安装包
            },
            signal: controller.signal,
            redirect: 'follow',
        });
        clearTimeout(timeoutId);
        const responseTimeMs = Date.now() - startTime;
        const statusCode = res.status;
        const isAntiBotBlocked = statusCode === 403;
        const isAlive = (statusCode >= 200 && statusCode < 400) || isAntiBotBlocked;
        return {
            url: targetUrl,
            statusCode,
            isAlive,
            redirectUrl: res.url !== targetUrl ? res.url : undefined,
            isAntiBotBlocked,
            responseTimeMs,
        };
    }
    catch (err) {
        clearTimeout(timeoutId);
        return {
            url: targetUrl,
            statusCode: 0,
            isAlive: false,
            isAntiBotBlocked: false,
            responseTimeMs: Date.now() - startTime,
            error: err.name === 'AbortError' ? '连接超时' : err.message,
        };
    }
}
