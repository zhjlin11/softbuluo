import { FastifyInstance } from 'fastify';
import { DeveloperService } from './developerService';
import { requireMemberAuth, requireRole } from '../../middleware/auth';
import { Role, DeveloperVerificationStatus, ClaimStatus, ResourceStatus, ClaimMethod } from '@prisma/client';
import { prisma } from '../../db';

export async function developerRoutes(server: FastifyInstance) {
  /**
   * ==========================================
   * 开发者中心 (会员已登录操作)
   * ==========================================
   */

  // 获取当前会员的开发者资料
  server.get('/api/v1/developer/profile', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const profile = await DeveloperService.getDeveloperProfile(memberId);
    return reply.send({ success: true, data: profile });
  });

  // 申请成为认证开发者
  server.post('/api/v1/developer/register', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { displayName, organizationName, website, githubUsername, bio } = req.body as any;

    if (!displayName || displayName.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_NAME', message: '开发者昵称至少需要 2 个字符' }
      });
    }

    try {
      const profile = await DeveloperService.registerDeveloper(memberId, {
        displayName: displayName.trim(),
        organizationName,
        website,
        githubUsername,
        bio
      });
      return reply.send({ success: true, data: profile });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 获取我提交的软件列表
  server.get('/api/v1/developer/submissions', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const profile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });
    if (!profile) {
      return reply.send({ success: true, data: [] });
    }

    const submissions = await prisma.developerSubmission.findMany({
      where: { developerId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ success: true, data: submissions });
  });

  // 提交软件草稿 (仅限认证开发者)
  server.post('/api/v1/developer/submissions', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const profile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });

    if (!profile || profile.verificationStatus !== DeveloperVerificationStatus.VERIFIED) {
      return reply.status(403).send({
        success: false,
        error: { code: 'NOT_VERIFIED', message: '只有已通过官方审核认证的开发者才可提交软件资料' }
      });
    }

    const body = req.body as any;
    if (!body.softwareName || !body.officialWebsite || !body.version || !body.downloadUrl) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_FIELDS', message: '请完整填写软件名称、官方网站、最新版本与下载直链' }
      });
    }

    const slug = body.slug || body.softwareName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    try {
      const submission = await DeveloperService.submitSoftware(profile.id, {
        softwareName: body.softwareName,
        slug,
        officialWebsite: body.officialWebsite,
        repoUrl: body.repoUrl,
        version: body.version,
        license: body.license,
        releaseDate: body.releaseDate,
        summary: body.summary || '开发者提交的软件',
        description: body.description || body.summary || '软件详细介绍',
        changelog: body.changelog,
        iconUrl: body.iconUrl,
        downloadUrl: body.downloadUrl
      });
      return reply.send({ success: true, data: submission });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 获取我申请认领的软件列表
  server.get('/api/v1/developer/claims', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const profile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });
    if (!profile) {
      return reply.send({ success: true, data: [] });
    }

    const claims = await prisma.softwareClaim.findMany({
      where: { developerId: profile.id },
      include: { software: true },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ success: true, data: claims });
  });

  // 申请认领已收录的软件
  server.post('/api/v1/developer/claims', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const profile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });

    if (!profile) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_PROFILE', message: '请先申请开发者资料后再进行软件认领' }
      });
    }

    const { softwareId, claimMethod } = req.body as any;
    if (!softwareId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_SOFTWARE_ID', message: '缺少认领的目标软件 ID' }
      });
    }

    try {
      const claim = await DeveloperService.createSoftwareClaim(
        profile.id,
        softwareId,
        claimMethod || ClaimMethod.DNS_TXT
      );
      return reply.send({ success: true, data: claim });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 提交认领凭据
  server.post('/api/v1/developer/claims/:id/verify', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { evidenceUrl } = req.body as any;

    try {
      const updated = await DeveloperService.verifySoftwareClaim(id, evidenceUrl);
      return reply.send({ success: true, data: updated, message: '凭据已提交，等待管理员终审核实' });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  /**
   * ==========================================
   * 公开 API：已认证开发者主页 (/developers/:slug)
   * ==========================================
   */
  // 公开 API：已认证开发者主页 (/developers/:slug)
  const getDeveloperHandler = async (req: any, reply: any) => {
    const { slug } = req.params as { slug: string };
    const profile = await DeveloperService.getPublicDeveloperProfile(slug);
    if (!profile) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '该开发者不存在或尚未通过官方认证' }
      });
    }
    return reply.send({ success: true, data: profile });
  };

  server.get('/api/public/v1/developers/:slug', getDeveloperHandler);
  server.get('/api/v1/developers/:slug', getDeveloperHandler);

  /**
   * ==========================================
   * 管理员后台：开发者审核与认领治理
   * ==========================================
   */

  // 管理员获取开发者入驻申请列表
  server.get(
    '/api/v1/admin/developer/profiles',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { status } = req.query as { status?: string };
      const where: any = {};
      if (status) where.verificationStatus = status;

      const profiles = await prisma.developerProfile.findMany({
        where,
        include: {
          member: { select: { id: true, email: true, username: true } },
          _count: { select: { claims: true, submissions: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send({ success: true, data: profiles });
    }
  );

  // 管理员审核开发者认证
  server.post(
    '/api/v1/admin/developer/profiles/:id/review',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status, adminNotes } = req.body as any;

      if (!status || !Object.values(DeveloperVerificationStatus).includes(status)) {
        return reply.status(400).send({ success: false, error: { message: '审核状态参数无效' } });
      }

      const updated = await DeveloperService.adminReviewDeveloper(
        id,
        status,
        adminNotes || '',
        req.adminUser!.username
      );

      return reply.send({ success: true, data: updated });
    }
  );

  // 管理员获取软件认领申请列表
  server.get(
    '/api/v1/admin/developer/claims',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { status } = req.query as { status?: string };
      const where: any = {};
      if (status) where.status = status;

      const claims = await prisma.softwareClaim.findMany({
        where,
        include: {
          software: true,
          developer: {
            include: {
              member: { select: { id: true, email: true, username: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send({ success: true, data: claims });
    }
  );

  // 管理员审核认领
  server.post(
    '/api/v1/admin/developer/claims/:id/review',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status, rejectionReason } = req.body as any;

      if (!status || !Object.values(ClaimStatus).includes(status)) {
        return reply.status(400).send({ success: false, error: { message: '认领状态参数无效' } });
      }

      const updated = await DeveloperService.adminReviewClaim(
        id,
        status,
        rejectionReason || null,
        req.adminUser!.username
      );

      return reply.send({ success: true, data: updated });
    }
  );

  // 管理员获取开发者提交的软件资料列表
  server.get(
    '/api/v1/admin/developer/submissions',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const submissions = await prisma.developerSubmission.findMany({
        include: {
          developer: {
            include: {
              member: { select: { id: true, email: true, username: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send({ success: true, data: submissions });
    }
  );

  // 管理员审核开发者提交的软件
  server.post(
    '/api/v1/admin/developer/submissions/:id/review',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status, adminNotes } = req.body as any;

      const updated = await DeveloperService.adminReviewSubmission(
        id,
        status,
        adminNotes || '',
        req.adminUser!.username
      );

      return reply.send({ success: true, data: updated });
    }
  );
}
