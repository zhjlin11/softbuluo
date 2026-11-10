import http from 'http';
import https from 'https';
import { validateSafeExternalUrl } from './security';
/**
 * 安全检查外部下载链接（带逐跳 SSRF 校验与超时控制）
 */
export async function checkExternalLink(rawUrl, maxRedirects = 3) {
    const startTime = Date.now();
    let currentUrl = rawUrl;
    let redirectsCount = 0;
    while (redirectsCount <= maxRedirects) {
        const safety = await validateSafeExternalUrl(currentUrl);
        if (!safety.valid || !safety.urlObj) {
            return {
                url: rawUrl,
                isReachable: false,
                verificationStatus: 'FAILED',
                error: safety.reason || '安全策略拦截',
                responseTimeMs: Date.now() - startTime,
            };
        }
        try {
            const response = await performHeadOrGet(safety.urlObj);
            const statusCode = response.statusCode || 0;
            // 处理重定向
            if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {
                redirectsCount++;
                if (redirectsCount > maxRedirects) {
                    return {
                        url: rawUrl,
                        isReachable: false,
                        httpStatus: statusCode,
                        verificationStatus: 'FAILED',
                        error: '超出最大重定向次数',
                        responseTimeMs: Date.now() - startTime,
                    };
                }
                currentUrl = new URL(response.headers.location, currentUrl).toString();
                continue;
            }
            const isSuccess = statusCode >= 200 && statusCode < 400;
            return {
                url: rawUrl,
                isReachable: isSuccess,
                httpStatus: statusCode,
                verificationStatus: isSuccess ? 'VERIFIED' : 'FAILED',
                responseTimeMs: Date.now() - startTime,
                error: isSuccess ? undefined : `HTTP 返回错误码 ${statusCode}`,
            };
        }
        catch (err) {
            return {
                url: rawUrl,
                isReachable: false,
                verificationStatus: 'FAILED',
                error: err.message || '网络连接超时或错误',
                responseTimeMs: Date.now() - startTime,
            };
        }
    }
    return {
        url: rawUrl,
        isReachable: false,
        verificationStatus: 'FAILED',
        error: '未知连接异常',
        responseTimeMs: Date.now() - startTime,
    };
}
function performHeadOrGet(urlObj) {
    return new Promise((resolve, reject) => {
        const client = urlObj.protocol === 'https:' ? https : http;
        const req = client.request(urlObj, {
            method: 'HEAD',
            timeout: 5000,
            headers: {
                'User-Agent': 'SoftBuluo-HealthCheck/1.0 (+https://softbuluo.com)',
            },
        }, (res) => {
            resolve(res);
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('请求超时 (5秒)'));
        });
        req.on('error', (err) => {
            // 部分服务器不支持 HEAD，回退试一次 GET（仅读头部）
            const getReq = client.request(urlObj, {
                method: 'GET',
                timeout: 5000,
                headers: {
                    'User-Agent': 'SoftBuluo-HealthCheck/1.0 (+https://softbuluo.com)',
                },
            }, (getRes) => {
                getRes.resume(); // 丢弃 body
                resolve(getRes);
            });
            getReq.on('timeout', () => {
                getReq.destroy();
                reject(new Error('请求超时 (5秒)'));
            });
            getReq.on('error', (getErr) => reject(getErr));
            getReq.end();
        });
        req.end();
    });
}
