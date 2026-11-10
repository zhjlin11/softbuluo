import { PrismaClient } from '@prisma/client';
import { config } from './config';
export const prisma = new PrismaClient({
    log: config.isProd ? ['error'] : ['error', 'warn'],
});
export async function checkDatabaseConnection() {
    try {
        // 运行轻量级原生查询测试数据库连接可用性
        await prisma.$queryRaw `SELECT 1`;
        return { connected: true };
    }
    catch (err) {
        const errorMsg = `PostgreSQL 数据库连接失败: ${err.message || '未知错误'}\n连接串: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`;
        return { connected: false, error: errorMsg };
    }
}
