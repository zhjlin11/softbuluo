/**
 * 软游部落 P3.1 生产级密码合规与防暴力破解策略
 */

export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

// 常见弱密码与已公开测试密码黑名单
const WEAK_PASSWORD_BLACKLIST = new Set([
  'admin@123456',
  'admin123456',
  'password123',
  '1234567890',
  'adminadmin',
  'softbuluo123',
  'root123456',
  'qwertyuiop',
  '1111111111',
]);

/**
 * 密码强度深度检验
 * 规则：
 * 1. 最小长度 10 位
 * 2. 必须同时包含大写字母、小写字母、数字和特殊字符
 * 3. 不得使用已公开/弱口令黑名单
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || password.length < 10) {
    return { valid: false, reason: '密码长度至少需要 10 位字符' };
  }

  if (password.length > 128) {
    return { valid: false, reason: '密码长度不能超过 128 位字符' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: '密码必须包含至少一个大写英文字母 (A-Z)' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: '密码必须包含至少一个小写英文字母 (a-z)' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: '密码必须包含至少一个数字 (0-9)' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
    return { valid: false, reason: '密码必须包含至少一个特殊符号 (例如 !@#$%^&*)' };
  }

  if (WEAK_PASSWORD_BLACKLIST.has(password.toLowerCase())) {
    return { valid: false, reason: '所选密码属于高风险已知弱口令或历史暴露密码，已被安全策略禁止使用' };
  }

  return { valid: true };
}

/**
 * 内存级管理员登录防暴力破解限制器 (支持 IP + 账号双维度)
 */
interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

class LoginRateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 分钟窗口
  private readonly lockDurationMs = 15 * 60 * 1000; // 锁定 15 分钟

  private getKey(identifier: string, ip: string): string {
    return `${identifier.toLowerCase().trim()}#${ip}`;
  }

  public check(identifier: string, ip: string): { allowed: boolean; remainingLockSeconds?: number } {
    const key = this.getKey(identifier, ip);
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return { allowed: true };
    }

    if (record.lockedUntil > now) {
      const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingLockSeconds: remainingSec };
    }

    // 如果已超出锁定窗口，自动重置
    if (now - record.firstAttemptAt > this.windowMs) {
      this.attempts.delete(key);
      return { allowed: true };
    }

    return { allowed: true };
  }

  public recordFailure(identifier: string, ip: string): { locked: boolean; remainingLockSeconds?: number } {
    const key = this.getKey(identifier, ip);
    const now = Date.now();
    let record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > this.windowMs) {
      record = { count: 1, firstAttemptAt: now, lockedUntil: 0 };
    } else {
      record.count += 1;
    }

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockDurationMs;
      this.attempts.set(key, record);
      return { locked: true, remainingLockSeconds: Math.ceil(this.lockDurationMs / 1000) };
    }

    this.attempts.set(key, record);
    return { locked: false };
  }

  public recordSuccess(identifier: string, ip: string): void {
    const key = this.getKey(identifier, ip);
    this.attempts.delete(key);
  }

  public clearAll(): void {
    this.attempts.clear();
  }
}

export const adminLoginLimiter = new LoginRateLimiter();
