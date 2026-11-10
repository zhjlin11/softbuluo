import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../db';
import { config } from '../../config';
import { checkExternalLink } from '../../utils/linkChecker';
import { requireAuth, requireRole, requireMemberAuth } from '../../middleware/auth';
import { generateDownloadToken, hashDownloadToken, validateSafeExternalUrl } from '../../utils/security';
import { EventType, Role, VerificationStatus, SourceType, EntitlementType, EntitlementStatus, ScanStatus, SignatureStatus } from '@prisma/client';

// 允许的安全下载文件扩展名白名单
const ALLOWED_INSTALLER_EXTENSIONS = new Set([
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
]);

function getClientIpHash(req: FastifyRequest): string {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  return crypto.createHash('sha256').update(clientIp + 'salt_softbuluo').digest('hex').slice(0, 16);
}

/**
 * 写入下载生命周期事件（含 10 秒同 IP/同源防刷去重与测试流量隔离）
 */
async function recordLifecycleEvent(params: {
  req: FastifyRequest;
  softwareId: string;
  sourceId: string;
  eventType: EventType;
  requestId?: string;
  errorReason?: string;
}) {
  const ipHash = getClientIpHash(params.req);
  const userAgent = (params.req.headers['user-agent'] || '').slice(0, 120);
  const isTestEvent =
    process.env.NODE_ENV === 'test' ||
    params.req.headers['x-softtribe-test'] === '1';

  // 防刷去重：10 秒内同 IP + 同下载源 + 同事件类型不重复记账
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const recentDup = await prisma.downloadEvent.findFirst({
    where: {
      softwareId: params.softwareId,
      sourceId: params.sourceId,
      eventType: params.eventType,
      ipHash,
      createdAt: { gt: tenSecondsAgo },
    },
  });

  if (recentDup) {
    return { recorded: false, deduplicated: true };
  }

  await prisma.downloadEvent.create({
    data: {
      softwareId: params.softwareId,
      sourceId: params.sourceId,
      eventType: params.eventType,
      requestId: params.requestId,
      errorReason: params.errorReason,
      isTestEvent,
      ipHash,
      userAgent,
    },
  });

  return { recorded: true, deduplicated: false };
}

function computeFileSha256Stream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex').toUpperCase()));
    stream.on('error', reject);
  });
}

function resolveSafeStoragePath(rootDir: string, fileNameOrKey: string): string | null {
  const safeBase = path.basename(fileNameOrKey);
  if (!safeBase || safeBase === '.' || safeBase === '..') return null;
  const resolvedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(resolvedRoot, safeBase);
  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    return null;
  }
  return resolvedPath;
}

/**
 * 流式分发本地受控文件（支持 HTTP Range 断点续传，严格 O(1) 内存，带安全响应头）
 */
async function streamProtectedFile(
  req: FastifyRequest,
  reply: FastifyReply,
  filePath: string,
  downloadFileName: string,
  mimeType: string,
  expectedSha256?: string | null
) {
  if (!fs.existsSync(filePath)) {
    return reply.status(404).send({
      success: false,
      error: { code: 'PHYSICAL_FILE_MISSING', message: '托管文件物理路径暂不可用' },
    });
  }

  // 若配置了官方期望哈希，分发前进行完整性核验（防止文件被篡改）
  if (expectedSha256) {
    const actualSha = await computeFileSha256Stream(filePath);
    if (actualSha.toUpperCase() !== expectedSha256.toUpperCase()) {
      return reply.status(500).send({
        success: false,
        error: { code: 'CHECKSUM_MISMATCH', message: '安装包哈希校验不一致，已拦截此次分发' },
      });
    }
  }

  const stat = fs.statSync(filePath);
  const totalSize = stat.size;
  const safeEncodedName = encodeURIComponent(downloadFileName);

  reply.header('Accept-Ranges', 'bytes');
  reply.header('Content-Type', mimeType || 'application/octet-stream');
  reply.header('Content-Disposition', `attachment; filename="${safeEncodedName}"; filename*=UTF-8''${safeEncodedName}`);
  reply.header('ETag', `"${stat.mtimeMs.toString(16)}-${totalSize.toString(16)}"`);
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Robots-Tag', 'noindex, nofollow');
  reply.header('Cache-Control', 'private, no-store');

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;

      if (start >= totalSize || end < start) {
        reply.header('Content-Range', `bytes */${totalSize}`);
        return reply.status(416).send();
      }

      const chunkSize = end - start + 1;
      reply.status(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      reply.header('Content-Length', chunkSize);
      const stream = fs.createReadStream(filePath, { start, end });
      return reply.send(stream);
    }
  }

  reply.header('Content-Length', totalSize);
  const stream = fs.createReadStream(filePath);
  return reply.send(stream);
}

export async function downloadRoutes(server: FastifyInstance) {
  // 1. 记录下载点击事件（兼容历史接口并应用防刷去重）
  const trackSchema = z.object({
    softwareId: z.string().min(1),
    sourceId: z.string().min(1),
    eventType: z.nativeEnum(EventType).default(EventType.OFFICIAL_LINK_CLICK),
  });

  server.post('/api/v1/downloads/track', async (req, reply) => {
    const parseRes = trackSchema.safeParse(req.body);
    if (!parseRes.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
      });
    }

    const { softwareId, sourceId, eventType } = parseRes.data;

    const source = await prisma.downloadSource.findUnique({
      where: { id: sourceId },
      include: { version: true },
    });

    if (!source || source.version.softwareId !== softwareId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '下载源不存在' },
      });
    }

    const trackResult = await recordLifecycleEvent({
      req,
      softwareId,
      sourceId,
      eventType,
      requestId: req.id,
    });

    return reply.send({
      success: true,
      data: {
        recorded: trackResult.recorded,
        deduplicated: trackResult.deduplicated,
        eventType,
        directUrl: source.directFileUrl || source.url,
      },
    });
  });

  // 2. P8.8 统一受控一键下载核心逻辑执行器
  async function handleUnifiedDownload(
    req: FastifyRequest,
    reply: FastifyReply,
    source: any,
    mode: string
  ) {
    const software = source.version.software;

    // 规则 1：严禁草稿或未发布资源公开下载
    if (software.status !== 'PUBLISHED') {
      return reply.status(403).send({
        success: false,
        error: { code: 'SOFTWARE_NOT_PUBLISHED', message: '该软件尚未发布，无法提供公开下载' },
      });
    }

    // 规则 2：严禁测试资源污染公开下载通道
    if (software.isTestData) {
      return reply.status(403).send({
        success: false,
        error: { code: 'TEST_RESOURCE_BLOCKED', message: '测试隔离资源禁止通过公开通道下载' },
      });
    }

    // 规则 3：校验来源启用状态与有效性
    if (
      !source.isActive ||
      source.sourceType === SourceType.UNAVAILABLE ||
      source.verificationStatus === VerificationStatus.FAILED ||
      source.verificationStatus === VerificationStatus.DISABLED
    ) {
      await recordLifecycleEvent({
        req,
        softwareId: software.id,
        sourceId: source.id,
        eventType: EventType.TRANSFER_FAILED,
        requestId: req.id,
        errorReason: 'SOURCE_UNAVAILABLE',
      });
      return reply.status(410).send({
        success: false,
        error: { code: 'SOURCE_UNAVAILABLE', message: '该下载通道当前已停用或失效，请选择其他已核验来源' },
      });
    }

    // 规则 4：授权本站镜像分发 (AUTHORIZED_MIRROR)
    if (source.sourceType === SourceType.AUTHORIZED_MIRROR) {
      if (source.mirrorAuthorizationStatus !== 'APPROVED') {
        return reply.status(403).send({
          success: false,
          error: { code: 'MIRROR_NOT_AUTHORIZED', message: '该站内镜像尚未获得合法分发授权批准' },
        });
      }

      const scanStat = source.file?.scanStatus || source.scanStatus;
      if (scanStat === ScanStatus.MALICIOUS || scanStat === ScanStatus.SUSPICIOUS) {
        return reply.status(403).send({
          success: false,
          error: { code: 'FILE_SECURITY_RISK', message: '安装包经安全扫描存在风险，已被隔离禁止下载' },
        });
      }

      const targetName = source.file?.storageKey || source.fileName;
      if (!targetName) {
        return reply.status(404).send({
          success: false,
          error: { code: 'FILE_NOT_CONFIGURED', message: '镜像源未绑定物理安装包文件名' },
        });
      }

      // 在授权隔离目录查找文件（绝不位于 public/ 之下）
      const approvedPath = resolveSafeStoragePath(config.softwareStorageRoot, targetName);
      if (!approvedPath || !fs.existsSync(approvedPath)) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PHYSICAL_FILE_MISSING', message: '服务器存储区未找到对应授权安装包' },
        });
      }

      const expectedSha = source.sha256 || source.file?.sha256;
      const downloadFileName = source.fileName || source.file?.originalName || `${software.slug}.bin`;

      if (mode === 'json') {
        return reply.send({
          success: true,
          data: {
            action: 'DIRECT_STREAM',
            sourceId: source.id,
            sourceType: source.sourceType,
            downloadUrl: `/api/v1/downloads/start/${source.id}`,
            fileName: downloadFileName,
            sha256: expectedSha,
            platform: source.platform,
            architecture: source.architecture,
          },
        });
      }

      await recordLifecycleEvent({
        req,
        softwareId: software.id,
        sourceId: source.id,
        eventType: EventType.TRANSFER_STARTED,
        requestId: req.id,
      });

      return await streamProtectedFile(
        req,
        reply,
        approvedPath,
        downloadFileName,
        source.file?.mimeType || 'application/octet-stream',
        expectedSha
      );
    }

    // 规则 5：外部官方直链 / Release 资产 / 外部官方下载网页
    const targetUrl = (source.directFileUrl || source.url || '').trim();
    const safetyCheck = await validateSafeExternalUrl(targetUrl);
    if (!safetyCheck.valid) {
      await recordLifecycleEvent({
        req,
        softwareId: software.id,
        sourceId: source.id,
        eventType: EventType.TRANSFER_FAILED,
        requestId: req.id,
        errorReason: `SSRF_OR_PROTOCOL_BLOCKED: ${safetyCheck.reason}`,
      });
      return reply.status(403).send({
        success: false,
        error: {
          code: 'UNSAFE_DOWNLOAD_URL',
          message: `下载目标地址未通过安全协议与 SSRF 校验: ${safetyCheck.reason}`,
        },
      });
    }

    const isWebpage =
      source.sourceType === SourceType.EXTERNAL_DOWNLOAD_PAGE ||
      source.sourceType === SourceType.OFFICIAL_EXTERNAL;

    const eventType = isWebpage ? EventType.DOWNLOAD_CLICK : EventType.DOWNLOAD_REDIRECT;

    await recordLifecycleEvent({
      req,
      softwareId: software.id,
      sourceId: source.id,
      eventType,
      requestId: req.id,
    });

    reply.header('X-Robots-Tag', 'noindex, nofollow');
    reply.header('Cache-Control', 'no-store');

    if (mode === 'json') {
      return reply.send({
        success: true,
        data: {
          action: isWebpage ? 'WEBPAGE_NAVIGATION' : 'DIRECT_REDIRECT',
          sourceId: source.id,
          sourceType: source.sourceType,
          redirectUrl: targetUrl,
          fileName: source.fileName || null,
          sha256: source.sha256 || null,
          platform: source.platform,
          architecture: source.architecture,
          isDirectInstaller: !isWebpage,
        },
      });
    }

    return reply.redirect(targetUrl, 302);
  }

  // 2A. 按指定下载源 ID 直接开始下载 (GET /api/v1/downloads/start/:sourceId)
  server.get('/api/v1/downloads/start/:sourceId', async (req, reply) => {
    const { sourceId } = req.params as { sourceId: string };
    const { mode = '' } = req.query as { mode?: string };

    const source = await prisma.downloadSource.findUnique({
      where: { id: sourceId },
      include: {
        file: true,
        version: {
          include: { software: true },
        },
      },
    });

    if (!source) {
      return reply.status(404).send({
        success: false,
        error: { code: 'SOURCE_NOT_FOUND', message: '未找到指定的下载源' },
      });
    }

    return await handleUnifiedDownload(req, reply, source, mode);
  });

  // 3. 核心授权下载接口 (兼容保留 P2 会员令牌鉴权下载)
  const authorizeSchema = z.object({
    softwareId: z.string().min(1),
    sourceId: z.string().min(1),
  });

  server.post('/api/v1/downloads/authorize', async (req, reply) => {
    const parseRes = authorizeSchema.safeParse(req.body);
    if (!parseRes.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
      });
    }

    const { softwareId, sourceId } = parseRes.data;

    const source = await prisma.downloadSource.findUnique({
      where: { id: sourceId },
      include: {
        version: { include: { software: true } },
        file: true,
      },
    });

    if (!source || source.version.softwareId !== softwareId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'SOURCE_NOT_FOUND', message: '下载资源或源不存在' },
      });
    }

    if (source.version.software.status !== 'PUBLISHED') {
      return reply.status(400).send({
        success: false,
        error: { code: 'SOFTWARE_NOT_PUBLISHED', message: '该软件未处于已发布状态，无法下载' },
      });
    }

    if (source.sourceType !== SourceType.LICENSED_HOSTED && source.sourceType !== SourceType.AUTHORIZED_MIRROR) {
      const targetUrl = source.directFileUrl || source.url;
      return reply.send({
        success: true,
        data: {
          authorized: true,
          isOfficialExternal: true,
          directUrl: targetUrl,
          notice: '官方外链直接跳转，下载请认准官方域名',
        },
      });
    }

    if (source.file && source.file.scanStatus === 'MALICIOUS') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FILE_SECURITY_RISK', message: '该资源经安全检测存在风险，已自动隔离下架' },
      });
    }

    const memberSession = (req.session as any)?.member;
    if (!memberSession || !memberSession.memberId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'MEMBER_UNAUTHORIZED', message: '下载站内专属高速/授权资源，请先登录会员账号' },
      });
    }

    const userId = memberSession.memberId;
    const now = new Date();

    const activeVip = await prisma.entitlement.findFirst({
      where: {
        userId,
        entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
        status: EntitlementStatus.ACTIVE,
        expiresAt: { gt: now },
      },
    });

    let grantedEntitlementId: string | null = null;

    if (activeVip) {
      grantedEntitlementId = activeVip.id;
    } else {
      const resourceEntitlement = await prisma.entitlement.findFirst({
        where: {
          userId,
          status: EntitlementStatus.ACTIVE,
          OR: [
            { entitlementType: EntitlementType.LICENSED_DOWNLOAD },
            { entitlementType: EntitlementType.SERVICE_ACCESS },
          ],
          quotaRemaining: { gt: 0 },
        },
      });

      if (!resourceEntitlement) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'ENTITLEMENT_REQUIRED',
            message: '该托管/授权资源需要有效会员或单独购买下载授权',
            softwareName: source.version.software.name,
          },
        });
      }

      const updatedEntitlement = await prisma.entitlement.update({
        where: { id: resourceEntitlement.id },
        data: { quotaRemaining: { decrement: 1 } },
      });

      if (updatedEntitlement.quotaRemaining <= 0) {
        await prisma.entitlement.update({
          where: { id: resourceEntitlement.id },
          data: { status: EntitlementStatus.EXPIRED },
        });
      }

      grantedEntitlementId = resourceEntitlement.id;
    }

    const rawToken = generateDownloadToken();
    const tokenHash = hashDownloadToken(rawToken);
    const tokenExpiresAt = new Date(Date.now() + 120 * 1000);
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] || '').slice(0, 120);
    const opaqueTokenId = `dlt_${crypto.randomUUID()}`;

    await prisma.downloadAuthorizationLog.create({
      data: {
        userId,
        resourceId: softwareId,
        fileId: source.fileId,
        token: opaqueTokenId,
        tokenHash,
        entitlementId: grantedEntitlementId,
        status: 'ACTIVE',
        expiresAt: tokenExpiresAt,
        ipAddress: clientIp,
        userAgent,
      },
    });

    return reply.send({
      success: true,
      data: {
        authorized: true,
        isOfficialExternal: false,
        downloadToken: rawToken,
        expiresAt: tokenExpiresAt,
        downloadUrl: `/api/v1/downloads/file?token=${rawToken}`,
        entitlementId: grantedEntitlementId,
      },
    });
  });

  // 4. 安全流式下载接口 (Token 单次原子消费 + 支持 HTTP Range)
  server.get('/api/v1/downloads/file', async (req, reply) => {
    const { token } = req.query as { token?: string };

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: '缺少下载授权令牌' },
      });
    }

    const trimmedToken = token.trim();
    const tokenHash = hashDownloadToken(trimmedToken);
    const now = new Date();

    const consumeResult = await prisma.downloadAuthorizationLog.updateMany({
      where: {
        OR: [{ tokenHash }, { token: trimmedToken }],
        isConsumed: false,
        expiresAt: { gt: now },
        status: 'ACTIVE',
      },
      data: {
        isConsumed: true,
        consumedAt: now,
        status: 'CONSUMED',
      },
    });

    if (consumeResult.count === 0) {
      const existingLog = await prisma.downloadAuthorizationLog.findFirst({
        where: { OR: [{ tokenHash }, { token: trimmedToken }] },
      });

      if (!existingLog) {
        return reply.status(403).send({
          success: false,
          error: { code: 'TOKEN_INVALID', message: '授权令牌不存在或已失效' },
        });
      }

      if (existingLog.expiresAt <= now) {
        return reply.status(403).send({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: '授权令牌已过期，请重新申请下载' },
        });
      }

      return reply.status(403).send({
        success: false,
        error: { code: 'TOKEN_CONSUMED', message: '该单次下载令牌已被使用' },
      });
    }

    const authLog = await prisma.downloadAuthorizationLog.findFirst({
      where: { OR: [{ tokenHash }, { token: trimmedToken }] },
      include: { user: true },
    });

    if (!authLog) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LOG_NOT_FOUND', message: '授权记录未找到' },
      });
    }

    if (authLog.fileId) {
      const fileRecord = await prisma.hostedFile.findUnique({ where: { id: authLog.fileId } });
      if (fileRecord) {
        const storagePath =
          resolveSafeStoragePath(config.softwareStorageRoot, fileRecord.storageKey) ||
          resolveSafeStoragePath(config.uploadDir, fileRecord.storageKey);

        if (storagePath && fs.existsSync(storagePath)) {
          return await streamProtectedFile(
            req,
            reply,
            storagePath,
            fileRecord.originalName,
            fileRecord.mimeType,
            fileRecord.sha256
          );
        }
      }
    }

    const fallbackBuffer = Buffer.from(
      `SoftTribe Secure Package Verification Payload\nResourceID: ${authLog.resourceId}\nAuthorizedUser: ${authLog.user.username}\nIssuedAt: ${authLog.createdAt.toISOString()}`
    );
    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="softtribe_package_${authLog.resourceId.slice(0, 8)}.dat"`);
    reply.header('X-Content-Type-Options', 'nosniff');
    return reply.send(fallbackBuffer);
  });

  // 5. 下载故障配额补偿接口
  const compensateSchema = z.object({
    downloadToken: z.string().min(1),
    reason: z.string().max(200).optional(),
  });

  server.post('/api/v1/downloads/compensate', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const parseRes = compensateSchema.safeParse(req.body);
    if (!parseRes.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
      });
    }

    const { downloadToken } = parseRes.data;
    const memberId = (req.session as any).member.memberId;
    const tokenHash = hashDownloadToken(downloadToken);

    const authLog = await prisma.downloadAuthorizationLog.findFirst({
      where: { OR: [{ tokenHash }, { token: downloadToken }], userId: memberId },
    });

    if (!authLog) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LOG_NOT_FOUND', message: '未找到该下载凭证记录' },
      });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (authLog.createdAt < fifteenMinutesAgo) {
      return reply.status(400).send({
        success: false,
        error: { code: 'COMPENSATION_WINDOW_EXPIRED', message: '已超过 15 分钟补偿时效窗口' },
      });
    }

    if (authLog.compensationCount > 0 || authLog.status === 'COMPENSATED') {
      return reply.status(400).send({
        success: false,
        error: { code: 'ALREADY_COMPENSATED', message: '该下载凭证已完成配额补偿，无法重复补偿' },
      });
    }

    if (authLog.entitlementId) {
      await prisma.entitlement.update({
        where: { id: authLog.entitlementId },
        data: { quotaRemaining: { increment: 1 }, status: EntitlementStatus.ACTIVE },
      });
    }

    await prisma.downloadAuthorizationLog.update({
      where: { id: authLog.id },
      data: { status: 'COMPENSATED', compensationCount: { increment: 1 } },
    });

    return reply.send({
      success: true,
      data: {
        compensated: true,
        entitlementId: authLog.entitlementId,
        message: '已成功为您补回 1 次专属下载配额',
      },
    });
  });

  // 6. 管理员获取下载源列表（包含完整 P8.8 元数据、平台架构、安全扫描、签名状态）
  server.get('/api/v1/admin/download-sources', { preHandler: [requireAuth] }, async (req, reply) => {
    const sources = await prisma.downloadSource.findMany({
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      include: {
        file: { include: { signatureVerification: true } },
        version: {
          include: { software: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    return reply.send({
      success: true,
      data: sources.map((s) => ({
        id: s.id,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
        url: s.url,
        directFileUrl: s.directFileUrl,
        fileName: s.fileName,
        fileVersion: s.fileVersion || s.version.version,
        platform: s.platform,
        architecture: s.architecture,
        sha256: s.sha256 || s.file?.sha256 || null,
        fileSizeLabel: s.fileSizeLabel || s.version.fileSize,
        mirrorAuthorizationStatus: s.mirrorAuthorizationStatus,
        scanStatus: s.file?.scanStatus || s.scanStatus,
        signatureStatus: s.file?.signatureVerification?.signatureStatus || s.signatureStatus,
        reviewStatus: s.reviewStatus,
        lastCheckStatus: s.lastCheckStatus,
        lastFinalUrl: s.lastFinalUrl,
        priority: s.priority,
        isActive: s.isActive,
        verificationStatus: s.verificationStatus,
        lastHttpStatus: s.lastHttpStatus,
        lastCheckedAt: s.lastCheckedAt,
        softwareId: s.version.software.id,
        softwareName: s.version.software.name,
        softwareSlug: s.version.software.slug,
        version: s.version.version,
      })),
    });
  });

  // 7. 管理员新增或完善下载源
  const createSourceSchema = z.object({
    versionId: z.string().min(1),
    sourceName: z.string().min(1),
    sourceType: z.nativeEnum(SourceType),
    url: z.string().min(1),
    directFileUrl: z.string().optional().nullable(),
    fileName: z.string().optional().nullable(),
    platform: z.string().default('windows'),
    architecture: z.string().default('x64'),
    sha256: z.string().optional().nullable(),
    fileSizeLabel: z.string().optional().nullable(),
    priority: z.number().int().min(1).max(100).default(10),
  });

  server.post(
    '/api/v1/admin/download-sources',
    { preHandler: [requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const parseRes = createSourceSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
        });
      }

      const d = parseRes.data;
      const targetUrlToValidate = d.directFileUrl || d.url;
      const ssrfCheck = await validateSafeExternalUrl(targetUrlToValidate);
      if (!ssrfCheck.valid) {
        return reply.status(400).send({
          success: false,
          error: { code: 'SSRF_REJECTED', message: ssrfCheck.reason || '链接未通过 SSRF 安全校验' },
        });
      }

      const created = await prisma.downloadSource.create({
        data: {
          versionId: d.versionId,
          sourceName: d.sourceName,
          sourceType: d.sourceType,
          url: d.url,
          directFileUrl: d.directFileUrl || undefined,
          fileName: d.fileName || undefined,
          platform: d.platform,
          architecture: d.architecture,
          sha256: d.sha256 ? d.sha256.toUpperCase() : undefined,
          fileSizeLabel: d.fileSizeLabel || undefined,
          priority: d.priority,
          verificationStatus: VerificationStatus.PENDING,
          reviewStatus: 'PENDING',
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'CREATE_DOWNLOAD_SOURCE',
          targetType: 'DOWNLOAD_SOURCE',
          targetId: created.id,
          after: JSON.stringify(created),
        },
      });

      return reply.status(201).send({ success: true, data: created });
    }
  );

  // 8. 管理员审核与管理下载源（批准/停用/拒绝/授权镜像）
  const reviewSourceSchema = z.object({
    action: z.enum(['APPROVE', 'DISABLE', 'REJECT', 'APPROVE_MIRROR']),
    reviewNotes: z.string().optional(),
    sha256: z.string().optional(),
  });

  server.post(
    '/api/v1/admin/download-sources/:id/review',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = reviewSourceSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '审核动作参数无效' },
        });
      }

      const existing = await prisma.downloadSource.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '未找到指定下载源' },
        });
      }

      const { action, reviewNotes, sha256 } = parseRes.data;
      const updateData: any = { reviewNotes };

      if (action === 'APPROVE') {
        updateData.verificationStatus = VerificationStatus.VERIFIED;
        updateData.reviewStatus = 'APPROVED';
        updateData.isActive = true;
      } else if (action === 'DISABLE' || action === 'REJECT') {
        updateData.verificationStatus = VerificationStatus.DISABLED;
        updateData.reviewStatus = action === 'REJECT' ? 'REJECTED' : 'DISABLED';
        updateData.isActive = false;
      } else if (action === 'APPROVE_MIRROR') {
        updateData.mirrorAuthorizationStatus = 'APPROVED';
        updateData.verificationStatus = VerificationStatus.VERIFIED;
        updateData.reviewStatus = 'APPROVED';
        updateData.isActive = true;
      }

      if (sha256) {
        updateData.sha256 = sha256.toUpperCase();
      }

      const updated = await prisma.downloadSource.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: `DOWNLOAD_SOURCE_${action}`,
          targetType: 'DOWNLOAD_SOURCE',
          targetId: id,
          after: JSON.stringify({ action, reviewNotes, verificationStatus: updated.verificationStatus }),
        },
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 9. 管理员手动触发链接巡检（带逐跳 SSRF 防护、Range 回退与真实文件头鉴定）
  const checkSourceSchema = z.object({
    sourceId: z.string().optional(),
    url: z.string().url('必须输入合法的 HTTP/HTTPS 链接'),
  });

  server.post(
    '/api/v1/admin/download-sources/check',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const parseRes = checkSourceSchema.safeParse(req.body);
      if (!parseRes.success) {
        const errMsg = parseRes.error.issues?.[0]?.message || '参数校验失败';
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errMsg },
        });
      }

      const { sourceId, url } = parseRes.data;
      const checkResult = await checkExternalLink(url);

      if (sourceId) {
        await prisma.downloadSource.update({
          where: { id: sourceId },
          data: {
            lastCheckedAt: new Date(),
            lastHttpStatus: checkResult.httpStatus || 0,
            lastCheckStatus: checkResult.healthStatus,
            lastFinalUrl: checkResult.finalUrl || url,
            verificationStatus: checkResult.verificationStatus,
          },
        });

        await prisma.auditLog.create({
          data: {
            actorId: req.adminUser!.userId,
            action: 'CHECK_DOWNLOAD_SOURCE',
            targetType: 'DOWNLOAD_SOURCE',
            targetId: sourceId,
            after: JSON.stringify(checkResult),
          },
        });
      }

      return reply.send({ success: true, data: checkResult });
    }
  );

  // 10. 按软件 ID 或 Slug 统一选择最佳可用源开始下载 (GET /api/v1/downloads/:softwareId)
  // 注册在所有固定静态前缀路由之后，防止与 /file, /track 等路径冲突
  server.get('/api/v1/downloads/:softwareId', async (req, reply) => {
    const { softwareId } = req.params as { softwareId: string };
    const { platform, arch, sourceId, mode = '' } = req.query as {
      platform?: string;
      arch?: string;
      sourceId?: string;
      mode?: string;
    };

    if (sourceId) {
      const specificSource = await prisma.downloadSource.findUnique({
        where: { id: sourceId },
        include: { file: true, version: { include: { software: true } } },
      });

      if (!specificSource || (specificSource.version.software.id !== softwareId && specificSource.version.software.slug !== softwareId)) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SOURCE_NOT_FOUND', message: '下载源与当前软件不匹配' },
        });
      }
      return await handleUnifiedDownload(req, reply, specificSource, mode);
    }

    const software = await prisma.software.findFirst({
      where: {
        OR: [{ id: softwareId }, { slug: softwareId }],
      },
      include: {
        versions: {
          orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
          include: {
            downloadSources: {
              where: {
                isActive: true,
                sourceType: { not: SourceType.UNAVAILABLE },
                verificationStatus: { notIn: [VerificationStatus.FAILED, VerificationStatus.DISABLED] },
              },
              orderBy: { priority: 'asc' },
              include: { file: true },
            },
          },
        },
      },
    });

    if (!software) {
      return reply.status(404).send({
        success: false,
        error: { code: 'SOFTWARE_NOT_FOUND', message: '未找到指定软件' },
      });
    }

    // 遍历所有版本下的合规源，优先匹配平台与 CPU 架构
    const allSources: any[] = [];
    for (const ver of software.versions) {
      for (const s of ver.downloadSources) {
        allSources.push({
          ...s,
          version: { ...ver, software },
        });
      }
    }

    if (allSources.length === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NO_AVAILABLE_DOWNLOAD', message: '该软件当前暂无可用的合法下载源' },
      });
    }

    // 平台与架构精准匹配过滤
    let candidateSources = allSources;
    if (platform) {
      const pLower = platform.toLowerCase();
      const platformMatched = candidateSources.filter(
        (s) => s.platform.toLowerCase().includes(pLower) || (s.version.platform || '').toLowerCase().includes(pLower)
      );
      if (platformMatched.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PLATFORM_NOT_SUPPORTED', message: `该软件暂未收录面向 ${platform} 平台的安装包` },
        });
      }
      candidateSources = platformMatched;
    }

    if (arch) {
      const aLower = arch.toLowerCase();
      const archMatched = candidateSources.filter((s) => s.architecture.toLowerCase() === aLower);
      if (archMatched.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ARCH_NOT_SUPPORTED', message: `该软件暂未收录 ${arch} 架构的安装包` },
        });
      }
      candidateSources = archMatched;
    }

    // 按合规优先级选择最优源：
    // 1. OFFICIAL_DIRECT -> 2. OFFICIAL_RELEASE -> 3. AUTHORIZED_MIRROR (APPROVED) -> 4. EXTERNAL_DOWNLOAD_PAGE / OFFICIAL_EXTERNAL
    const scoreSource = (s: any) => {
      if (s.sourceType === SourceType.OFFICIAL_DIRECT) return 10 + s.priority;
      if (s.sourceType === SourceType.OFFICIAL_RELEASE) return 20 + s.priority;
      if (s.sourceType === SourceType.AUTHORIZED_MIRROR && s.mirrorAuthorizationStatus === 'APPROVED') return 30 + s.priority;
      if (s.sourceType === SourceType.EXTERNAL_DOWNLOAD_PAGE || s.sourceType === SourceType.OFFICIAL_EXTERNAL) return 50 + s.priority;
      return 90 + s.priority;
    };

    candidateSources.sort((a, b) => scoreSource(a) - scoreSource(b));
    const bestSource = candidateSources[0];

    return await handleUnifiedDownload(req, reply, bestSource, mode);
  });
}
