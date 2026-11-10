import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../db';
import { config } from '../../config';
import { requireRole } from '../../middleware/auth';
import { Role, ScanStatus } from '@prisma/client';

export async function uploadRoutes(server: FastifyInstance) {
  // 管理员文件上传（受控存储与安全哈希计算）
  server.post(
    '/api/v1/admin/uploads',
    { preHandler: [requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: { code: 'NO_FILE', message: '未收到上传文件' }
        });
      }

      // 确保私有存储目录存在
      await fs.mkdir(config.uploadDir, { recursive: true });

      // 生成安全的随机存储 key（严禁使用原始文件名直接作为存储路径）
      const storageKey = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}_${path.extname(data.filename)}`;
      const targetFilePath = path.join(config.uploadDir, storageKey);

      // 流式计算 SHA-256 并写入磁盘
      const hash = crypto.createHash('sha256');
      const buffer = await data.toBuffer();
      hash.update(buffer);
      const sha256 = hash.digest('hex');

      await fs.writeFile(targetFilePath, buffer);

      // 记录托管文件元数据，状态严格置为 PENDING（待扫描），不冒充假安全
      const fileRecord = await prisma.hostedFile.create({
        data: {
          storageKey,
          originalName: data.filename,
          mimeType: data.mimetype,
          sizeBytes: BigInt(buffer.length),
          sha256,
          scanStatus: ScanStatus.PENDING,
          uploadedBy: req.adminUser!.userId,
        }
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          sizeBytes: fileRecord.sizeBytes.toString(),
          sha256: fileRecord.sha256,
          scanStatus: fileRecord.scanStatus,
          message: '文件已安全存入隔离存储区，等待防病毒引擎扫描',
        }
      });
    }
  );
}
