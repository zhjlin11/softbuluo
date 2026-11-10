import { buildApp } from './app';
import { config } from './config';
import { checkDatabaseConnection } from './db';
async function main() {
    const server = await buildApp();
    try {
        // 检查数据库
        const dbStatus = await checkDatabaseConnection();
        if (dbStatus.connected) {
            server.log.info('✅ PostgreSQL 数据库连接成功');
        }
        else {
            server.log.warn(`⚠️  数据库未连接或尚未初始化: ${dbStatus.error}`);
        }
        await server.listen({
            port: config.port,
            host: config.host,
        });
        server.log.info(`🚀 软游部落后端服务已启动: http://localhost:${config.port}`);
    }
    catch (err) {
        server.log.error(err, '后端启动异常退出');
        process.exit(1);
    }
}
main();
