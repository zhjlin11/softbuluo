import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';
export type PaymentMode = 'MOCK' | 'WECHAT';

const rawAppEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const validEnvs: AppEnvironment[] = ['development', 'test', 'staging', 'production'];
const appEnv: AppEnvironment = validEnvs.includes(rawAppEnv as AppEnvironment)
  ? (rawAppEnv as AppEnvironment)
  : 'development';

// 商业化支付模式解析 (支持环境变量别名归一化)
const rawPayMock = (process.env.PAY_MOCK_ENABLED || process.env.WECHAT_PAY_MOCK || '').toLowerCase();
const rawPaymentMode = (process.env.PAYMENT_MODE || '').toUpperCase();

let paymentMode: PaymentMode;
if (appEnv === 'production') {
  // 生产环境强制禁止 MOCK
  paymentMode = 'WECHAT';
} else if (rawPaymentMode === 'WECHAT' || rawPayMock === 'false') {
  paymentMode = 'WECHAT';
} else {
  paymentMode = 'MOCK';
}

export const config = {
  appEnv,
  isProd: appEnv === 'production',
  isDev: appEnv === 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/softbuluo?schema=public',
  sessionSecret: process.env.SESSION_SECRET || 'softbuluo_super_secret_session_key_32_chars_min_2026',
  adminInitToken: process.env.ADMIN_INIT_TOKEN || 'softbuluo_admin_setup_2026',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_STORAGE_DIR || './uploads'),
  softwareStorageRoot: path.resolve(process.cwd(), process.env.SOFTWARE_STORAGE_ROOT || './storage/approved_installers'),
  quarantineStorageRoot: path.resolve(process.cwd(), process.env.QUARANTINE_STORAGE_ROOT || './storage/quarantine'),
  clientUrl: process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000',

  // 生产环境规范化 Canonical URL 计算（严格杜绝生产环境出现 localhost）
  getCanonicalUrl(pathname = ''): string {
    const base = this.isProd
      ? (process.env.PUBLIC_SITE_URL || 'https://softbuluo.com').replace(/\/$/, '')
      : (process.env.PUBLIC_SITE_URL || this.clientUrl).replace(/\/$/, '');
    const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${base}${cleanPath}`;
  },

  // 商业化与微信支付严格配置 (已归一化支持所有历史环境变量别名)
  paymentMode,
  wechatAppId: process.env.WECHAT_APP_ID || process.env.WECHAT_PAY_APP_ID || '',
  wechatMchId: process.env.WECHAT_MCH_ID || process.env.WECHAT_PAY_MCH_ID || process.env.WECHAT_PAY_MCHID || '',
  wechatApiV3Key: process.env.WECHAT_API_V3_KEY || process.env.WECHAT_PAY_APIV3_KEY || process.env.WECHAT_PAY_API_V3_KEY || '',
  wechatSerialNo: process.env.WECHAT_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || '',
  wechatPrivateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH || process.env.WECHAT_PAY_PRIVATE_KEY_PATH || '',
  wechatNotifyUrl: process.env.WECHAT_NOTIFY_URL || process.env.WECHAT_PAY_NOTIFY_URL || 'http://localhost:3001/api/v1/payments/notify',
  wechatRefundNotifyUrl: process.env.WECHAT_REFUND_NOTIFY_URL || process.env.WECHAT_PAY_REFUND_NOTIFY_URL || 'http://localhost:3001/api/v1/refunds/notify',

  // 辅助判断方法
  isMockPaymentAllowed(): boolean {
    return this.appEnv !== 'production' && this.paymentMode === 'MOCK';
  },

  hasValidWechatCredentials(): boolean {
    return (
      Boolean(this.wechatMchId) &&
      Boolean(this.wechatApiV3Key) &&
      Boolean(this.wechatAppId) &&
      Boolean(this.wechatSerialNo) &&
      Boolean(this.wechatPrivateKeyPath)
    );
  },
};

/**
 * 生产环境严格启动校验 (P0: 杜绝生产环境 MOCK 支付与弱安全配置)
 */
export function validateEnvironmentSecurity(): void {
  // 1. Session 密钥长度检查
  if (config.sessionSecret.length < 32) {
    throw new Error('FATAL SECURITY ERROR: SESSION_SECRET must be at least 32 characters long.');
  }

  // 2. 生产环境严格支付与协议检查
  if (config.appEnv === 'production') {
    if (config.paymentMode === 'MOCK') {
      throw new Error(
        'FATAL SECURITY ERROR: Production environment strictly forbids PAYMENT_MODE=MOCK! Only WECHAT mode is allowed.'
      );
    }

    if (config.paymentMode !== 'WECHAT') {
      throw new Error('FATAL SECURITY ERROR: In production, PAYMENT_MODE must be WECHAT.');
    }

    // 检查微信商户凭据完整性
    const missing: string[] = [];
    if (!config.wechatAppId) missing.push('WECHAT_APP_ID');
    if (!config.wechatMchId) missing.push('WECHAT_MCH_ID');
    if (!config.wechatApiV3Key) missing.push('WECHAT_API_V3_KEY');
    if (!config.wechatSerialNo) missing.push('WECHAT_SERIAL_NO');
    if (!config.wechatPrivateKeyPath) missing.push('WECHAT_PRIVATE_KEY_PATH');
    if (!config.wechatNotifyUrl) missing.push('WECHAT_NOTIFY_URL');

    if (missing.length > 0) {
      throw new Error(
        `FATAL SECURITY ERROR: Missing required production WeChat Pay credentials: ${missing.join(', ')}`
      );
    }

    // 回调地址必须为公网安全 HTTPS
    if (!config.wechatNotifyUrl.startsWith('https://')) {
      throw new Error('FATAL SECURITY ERROR: WECHAT_NOTIFY_URL must use HTTPS in production.');
    }

    // 生产客户端地址不能是本地调试域名
    if (config.clientUrl.includes('localhost') || config.clientUrl.includes('127.0.0.1')) {
      throw new Error('FATAL SECURITY ERROR: CLIENT_URL cannot be localhost in production.');
    }
  }
}
