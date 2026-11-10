import { FastifyInstance } from 'fastify';
import { checkDatabaseConnection } from '../../db';

export async function healthRoutes(server: FastifyInstance) {
  // 1. K8s / 云原生 Liveness 存活探针 (进程级别)
  server.get('/health/liveness', async (_req, reply) => {
    return reply.status(200).send({
      status: 'UP',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. K8s / 云原生 Readiness 就绪探针 (数据库依赖级别)
  server.get('/health/readiness', async (_req, reply) => {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      return reply.status(503).send({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: dbStatus.error,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.status(200).send({
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  });

  // 3. 运维详细健康指标接口
  server.get('/api/v1/health', async (_req, reply) => {
    const dbStatus = await checkDatabaseConnection();
    const mem = process.memoryUsage();

    return reply.status(dbStatus.connected ? 200 : 503).send({
      status: dbStatus.connected ? 'HEALTHY' : 'DEGRADED',
      database: dbStatus.connected ? 'CONNECTED' : 'DISCONNECTED',
      uptimeSec: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });
}
