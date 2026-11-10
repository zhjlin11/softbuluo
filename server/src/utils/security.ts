import crypto from 'crypto';
import dns from 'dns/promises';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

/**
 * 安全密码哈希（基于 Node.js 原生 scrypt + 加盐 + 恒定时间比对，无需编译二进制包）
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * 判断 IP 地址是否属于私有/保留/内网/回环地址（反 SSRF 核心）
 */
export function isPrivateIp(ip: string): boolean {
  // IPv4 Loopback (127.0.0.0/8)
  if (/^127\./.test(ip)) return true;
  // RFC 1918 Private (10.0.0.0/8)
  if (/^10\./.test(ip)) return true;
  // RFC 1918 Private (172.16.0.0/12)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // RFC 1918 Private (192.168.0.0/16)
  if (/^192\.168\./.test(ip)) return true;
  // Carrier-grade NAT (100.64.0.0/10)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true;
  // Link-Local (169.254.0.0/16, 包括云元数据 169.254.169.254)
  if (/^169\.254\./.test(ip)) return true;
  // 0.0.0.0/8
  if (/^0\./.test(ip)) return true;

  // IPv6 check
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true;
  if (normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.')) return true;

  return false;
}

/**
 * 校验外部链接是否安全且不属于内网目标（严格拦截 SSRF）
 */
export async function validateSafeExternalUrl(targetUrl: string): Promise<{ valid: boolean; reason?: string; urlObj?: URL }> {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: '仅允许 HTTP 或 HTTPS 协议' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 拦截直接的 localhost 与明显保留域名
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      return { valid: false, reason: '禁止探测本地或保留域名' };
    }

    // DNS 解析并检查 IP 地址
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          return { valid: false, reason: `目标域名解析到受限私网 IP (${addr.address})，已拦截` };
        }
      }
    } catch (dnsErr) {
      return { valid: false, reason: '域名 DNS 解析失败或不可达' };
    }

    return { valid: true, urlObj: parsed };
  } catch (err: any) {
    return { valid: false, reason: 'URL 格式无效' };
  }
}

/**
 * 生成业务防碰撞订单号 (ORD + 年月日时分秒毫秒 + 4位大写随机)
 */
export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD${dateStr}${rand}`;
}

/**
 * 生成退款编号 (REF + 年月日时分秒毫秒 + 4位大写随机)
 */
export function generateRefundNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `REF${dateStr}${rand}`;
}

/**
 * 生成短时安全授权下载 Token (32 字节高强度随机十六进制)
 */
export function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 计算下载 Token 的 SHA-256 哈希值（用于数据库安全检索与防泄漏）
 */
export function hashDownloadToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}


