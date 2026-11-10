import http from 'http';
import https from 'https';
import { validateSafeExternalUrl } from './security';

export interface LinkCheckResult {
  url: string;
  finalUrl: string;
  finalDomain: string;
  redirectCount: number;
  isReachable: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  contentType?: string;
  contentDisposition?: string;
  contentLength?: number;
  lastModified?: string;
  etag?: string;
  isHtmlPage: boolean;
  isDirectInstaller: boolean;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  verificationStatus: 'VERIFIED' | 'FAILED' | 'DISABLED';
  error?: string;
}

const BINARY_EXTENSIONS = [
  '.exe',
  '.msi',
  '.zip',
  '.7z',
  '.dmg',
  '.pkg',
  '.appimage',
  '.deb',
  '.rpm',
  '.tar.gz',
  '.tgz',
  '.apk',
];

function looksLikeInstallerUrl(urlStr: string): boolean {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    return BINARY_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * 安全检查外部下载链接（带逐跳 SSRF 校验、HEAD + Range GET 智能回退、文件/网页识别）
 */
export async function checkExternalLink(rawUrl: string, maxRedirects = 5): Promise<LinkCheckResult> {
  const startTime = Date.now();
  let currentUrl = rawUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const safety = await validateSafeExternalUrl(currentUrl);
    if (!safety.valid || !safety.urlObj) {
      return {
        url: rawUrl,
        finalUrl: currentUrl,
        finalDomain: '',
        redirectCount: redirectsCount,
        isReachable: false,
        isHtmlPage: false,
        isDirectInstaller: false,
        healthStatus: 'FAILED',
        verificationStatus: 'FAILED',
        error: safety.reason || '安全策略拦截',
        responseTimeMs: Date.now() - startTime,
      };
    }

    try {
      const response = await performHeadWithRangeFallback(safety.urlObj);
      const statusCode = response.statusCode || 0;

      // 逐跳处理重定向，下一跳依然必须经过 SSRF 安全校验
      if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          return {
            url: rawUrl,
            finalUrl: currentUrl,
            finalDomain: safety.urlObj.hostname,
            redirectCount: redirectsCount,
            isReachable: false,
            httpStatus: statusCode,
            isHtmlPage: false,
            isDirectInstaller: false,
            healthStatus: 'FAILED',
            verificationStatus: 'FAILED',
            error: `超出最大重定向次数 (${maxRedirects})`,
            responseTimeMs: Date.now() - startTime,
          };
        }
        currentUrl = new URL(response.headers.location, currentUrl).toString();
        continue;
      }

      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      const contentDisposition = String(response.headers['content-disposition'] || '');
      const rawLength = response.headers['content-length'];
      const contentLength = rawLength ? parseInt(String(rawLength), 10) : undefined;
      const lastModified = response.headers['last-modified'] ? String(response.headers['last-modified']) : undefined;
      const etag = response.headers['etag'] ? String(response.headers['etag']) : undefined;

      const isHtmlPage = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
      const hasAttachmentHeader = contentDisposition.toLowerCase().includes('attachment') || contentDisposition.toLowerCase().includes('filename=');
      const hasBinaryMime =
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/x-msdownload') ||
        contentType.includes('application/x-msi') ||
        contentType.includes('application/zip') ||
        contentType.includes('application/x-7z-compressed') ||
        contentType.includes('application/x-apple-diskimage');

      const isDirectInstaller = !isHtmlPage && (hasAttachmentHeader || hasBinaryMime || looksLikeInstallerUrl(currentUrl));
      const isSuccess = statusCode >= 200 && statusCode < 400;

      let healthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN' = 'FAILED';
      if (isSuccess) {
        healthStatus = isHtmlPage && looksLikeInstallerUrl(rawUrl) ? 'DEGRADED' : 'HEALTHY';
      }

      return {
        url: rawUrl,
        finalUrl: currentUrl,
        finalDomain: safety.urlObj.hostname,
        redirectCount: redirectsCount,
        isReachable: isSuccess,
        httpStatus: statusCode,
        responseTimeMs: Date.now() - startTime,
        contentType,
        contentDisposition,
        contentLength: Number.isNaN(contentLength) ? undefined : contentLength,
        lastModified,
        etag,
        isHtmlPage,
        isDirectInstaller,
        healthStatus,
        verificationStatus: isSuccess ? 'VERIFIED' : 'FAILED',
        error: isSuccess ? undefined : `HTTP 返回错误码 ${statusCode}`,
      };
    } catch (err: any) {
      return {
        url: rawUrl,
        finalUrl: currentUrl,
        finalDomain: safety.urlObj.hostname,
        redirectCount: redirectsCount,
        isReachable: false,
        isHtmlPage: false,
        isDirectInstaller: false,
        healthStatus: 'FAILED',
        verificationStatus: 'FAILED',
        error: err.message || '网络连接超时或错误',
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  return {
    url: rawUrl,
    finalUrl: currentUrl,
    finalDomain: '',
    redirectCount: redirectsCount,
    isReachable: false,
    isHtmlPage: false,
    isDirectInstaller: false,
    healthStatus: 'FAILED',
    verificationStatus: 'FAILED',
    error: '未知连接异常',
    responseTimeMs: Date.now() - startTime,
  };
}

/**
 * 优先使用 HEAD 请求；遇到不支持 HEAD 的服务器（返回 403/405/501 或连接断开），安全回退使用 1KB Range GET 探测
 */
async function performHeadWithRangeFallback(urlObj: URL): Promise<http.IncomingMessage> {
  try {
    const headRes = await sendSingleRequest(urlObj, 'HEAD');
    const code = headRes.statusCode || 0;
    if (code === 405 || code === 403 || code === 501) {
      headRes.resume();
      return await sendSingleRequest(urlObj, 'GET', { Range: 'bytes=0-1023' });
    }
    return headRes;
  } catch {
    return await sendSingleRequest(urlObj, 'GET', { Range: 'bytes=0-1023' });
  }
}

function sendSingleRequest(
  urlObj: URL,
  method: 'HEAD' | 'GET',
  extraHeaders: Record<string, string> = {}
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(
      urlObj,
      {
        method,
        timeout: 6000,
        headers: {
          'User-Agent': 'SoftTribe-HealthCheck/1.2 (+https://softtribe.top)',
          Accept: '*/*',
          ...extraHeaders,
        },
      },
      (res) => {
        // 如果是 GET 且立即拿到响应头，只读很少或销毁主体防止带宽浪费
        if (method === 'GET' && !(res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode))) {
          res.destroy();
        } else {
          res.resume();
        }
        resolve(res);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('探测请求超时 (6秒)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}
