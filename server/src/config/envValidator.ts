/**
 * 软游部落 P3.1 生产环境配置深度安全校验器
 */

export interface EnvValidationReport {
  isProd: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductionEnvironment(): EnvValidationReport {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Session Secret 强度检查
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProd) {
      errors.push('生产环境必须配置 SESSION_SECRET 环境变量');
    } else {
      warnings.push('未配置 SESSION_SECRET，开发环境将使用默认密钥');
    }
  } else if (sessionSecret.length < 32) {
    errors.push('SESSION_SECRET 密钥长度不足 32 字符，存在会话伪造风险');
  } else if (sessionSecret.includes('default') || sessionSecret.includes('123456') || sessionSecret.includes('softbuluo-secret')) {
    errors.push('SESSION_SECRET 包含常见或默认测试关键词，严禁在生产环境使用');
  }

  // 2. 数据库连接串检查
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('未配置 DATABASE_URL 数据库连接字符串');
  } else if (isProd && (dbUrl.includes(':postgres@') || dbUrl.includes(':root@') || dbUrl.includes(':123456@'))) {
    warnings.push('生产环境数据库使用了默认用户或弱口令，建议立即更换为专属受限业务账号');
  }

  // 3. 商业支付环境检查 (核心防线：生产环境严格禁止 MOCK 支付)
  const paymentMode = (process.env.PAYMENT_MODE || 'mock').toLowerCase();
  if (isProd) {
    if (paymentMode === 'mock') {
      errors.push('致命安全拦截：生产环境 (NODE_ENV=production) 严禁启用 MOCK 模拟支付！必须配置为 wechat');
    }

    const mchId = process.env.WECHAT_MCH_ID || process.env.WECHAT_PAY_MCH_ID || process.env.WECHAT_PAY_MCHID;
    const apiKey = process.env.WECHAT_API_V3_KEY || process.env.WECHAT_PAY_APIV3_KEY || process.env.WECHAT_PAY_API_V3_KEY;
    if (paymentMode === 'wechat') {
      if (!mchId || !apiKey) {
        errors.push('生产环境启用了微信支付但缺少商户号或 APIv3 密钥配置');
      }
    }
  }

  // 4. 公网域名与 HTTPS 检查
  const clientUrl = process.env.CLIENT_URL;
  if (isProd && (!clientUrl || clientUrl.startsWith('http://localhost'))) {
    errors.push('生产环境 CLIENT_URL 不得为 localhost，必须配置为正式生产 HTTPS 域名');
  }

  return {
    isProd,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
