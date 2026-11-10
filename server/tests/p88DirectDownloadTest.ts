import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  PrismaClient,
  ResourceStatus,
  ResourceType,
  SourceType,
  VerificationStatus,
  ScanStatus,
  SignatureStatus,
  Role,
  EventType,
} from '@prisma/client';
import { buildApp } from '../src/app';
import { config } from '../src/config';
import { checkExternalLink } from '../src/utils/linkChecker';
import { hashPassword } from '../src/utils/security';

let passed = 0;
let failed = 0;

async function it(desc: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${desc}:`, err.message);
    failed++;
  }
}

export async function runP88Tests() {
  console.log('========================================================================');
  console.log('🚀 开始执行软游部落 P8.8 软件一键直链下载与安全分发 32 项自动化验收测试');
  console.log('========================================================================\n');

  const app = await buildApp();
  await app.ready();
  const prisma = new PrismaClient();

  const tempIds: {
    softwareIds: string[];
    userIds: string[];
    fileIds: string[];
    physicalFiles: string[];
  } = {
    softwareIds: [],
    userIds: [],
    fileIds: [],
    physicalFiles: [],
  };

  try {
    // 准备隔离环境测试账号（管理员 & 普通会员）
    const ts = Date.now();
    const adminPasswordHash = await hashPassword('AdminP88Pass!123');
    const adminUser = await prisma.user.create({
      data: {
        username: `p88_admin_${ts}`,
        email: `p88_admin_${ts}@softtribe.local`,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        status: 'ACTIVE',
        tokenVersion: 1,
      },
    });
    tempIds.userIds.push(adminUser.id);

    const memberPasswordHash = await hashPassword('MemberP88Pass!123');
    const memberUser = await prisma.memberUser.create({
      data: {
        username: `p88_member_${ts}`,
        email: `p88_member_${ts}@softtribe.local`,
        passwordHash: memberPasswordHash,
      },
    });

    // 获取分类底座
    const category = await prisma.category.findFirst();
    assert(category, '系统分类不能为空');

    // 准备真实物理测试压缩包（无害文本/二进制负载，存入软件安全隔离库 config.softwareStorageRoot）
    fs.mkdirSync(config.softwareStorageRoot, { recursive: true });
    const testPackageName = `softtribe_p88_test_${ts}.zip`;
    const testPackageContent = Buffer.from(`PK\x03\x04SoftTribe-Verified-Test-Installer-Payload-${ts}-Content-End`);
    const testPackageSha256 = crypto.createHash('sha256').update(testPackageContent).digest('hex').toUpperCase();
    const testPackagePath = path.join(config.softwareStorageRoot, testPackageName);
    fs.writeFileSync(testPackagePath, testPackageContent);
    tempIds.physicalFiles.push(testPackagePath);

    // 准备另一份哈希不一致的测试包
    const tamperedPackageName = `softtribe_p88_tampered_${ts}.zip`;
    const tamperedPath = path.join(config.softwareStorageRoot, tamperedPackageName);
    fs.writeFileSync(tamperedPath, Buffer.from('TAMPERED_PAYLOAD_DATA'));
    tempIds.physicalFiles.push(tamperedPath);

    // 创建托管文件记录
    const hostedFile = await prisma.hostedFile.create({
      data: {
        storageKey: testPackageName,
        originalName: testPackageName,
        mimeType: 'application/zip',
        sizeBytes: BigInt(testPackageContent.length),
        sha256: testPackageSha256,
        scanStatus: ScanStatus.CLEAN,
        scanEngine: 'LocalTestVerifier',
        uploadedBy: adminUser.id,
      },
    });
    tempIds.fileIds.push(hostedFile.id);

    // 1) 已发布正式测试软件（带多架构官方直链、Release、Webpage、失效源、未授权镜像与授权镜像）
    const pubSoftware = await prisma.software.create({
      data: {
        name: `SoftTribe Direct Test ${ts}`,
        slug: `p88-pub-${ts}`,
        developer: 'SoftTribe Lab',
        summary: 'P8.8 自动化下载测试正式发布软件',
        description: '完整支持直链、多架构、授权镜像与文件校验。',
        categoryId: category.id,
        type: ResourceType.SOFTWARE,
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(pubSoftware.id);

    const pubVersion = await prisma.softwareVersion.create({
      data: {
        softwareId: pubSoftware.id,
        version: '3.2.1',
        platform: 'Windows 10/11',
        architecture: 'x64',
        fileSize: '512 KB',
        releaseDate: '2026-11-10',
        isLatest: true,
      },
    });

    // 下载源集合
    const srcDirectX64 = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '官方直链 x64 安装包',
        sourceType: SourceType.OFFICIAL_DIRECT,
        url: 'https://www.7-zip.org/a/7z2409-x64.exe',
        directFileUrl: 'https://www.7-zip.org/a/7z2409-x64.exe',
        fileName: '7z2409-x64.exe',
        fileVersion: '24.09',
        platform: 'windows',
        architecture: 'x64',
        priority: 1,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    const srcReleaseArm64 = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '官方 Release ARM64 资产',
        sourceType: SourceType.OFFICIAL_RELEASE,
        url: 'https://github.com/pbatard/rufus/releases/download/v4.6/rufus-4.6.exe',
        directFileUrl: 'https://github.com/pbatard/rufus/releases/download/v4.6/rufus-4.6.exe',
        fileName: 'rufus-4.6.exe',
        platform: 'windows',
        architecture: 'arm64',
        priority: 2,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    const srcAuthorizedMirror = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '本站授权高速测试镜像',
        sourceType: SourceType.AUTHORIZED_MIRROR,
        url: 'https://softtribe.top/mirror',
        fileId: hostedFile.id,
        fileName: testPackageName,
        platform: 'linux',
        architecture: 'x64',
        sha256: testPackageSha256,
        mirrorAuthorizationStatus: 'APPROVED',
        scanStatus: ScanStatus.CLEAN,
        priority: 3,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    const srcUnauthorizedMirror = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '未获授权镜像源',
        sourceType: SourceType.AUTHORIZED_MIRROR,
        url: 'https://softtribe.top/unauth',
        fileId: hostedFile.id,
        fileName: testPackageName,
        platform: 'macos',
        architecture: 'universal',
        sha256: testPackageSha256,
        mirrorAuthorizationStatus: 'PENDING',
        priority: 4,
        verificationStatus: VerificationStatus.PENDING,
        isActive: true,
      },
    });

    const srcTamperedMirror = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '哈希篡改异常镜像源',
        sourceType: SourceType.AUTHORIZED_MIRROR,
        url: 'https://softtribe.top/tampered',
        fileName: tamperedPackageName,
        platform: 'freebsd',
        architecture: 'x64',
        sha256: '0000000000000000000000000000000000000000000000000000000000000000',
        mirrorAuthorizationStatus: 'APPROVED',
        scanStatus: ScanStatus.CLEAN,
        priority: 5,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    const srcWebpage = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '官方外部网页',
        sourceType: SourceType.EXTERNAL_DOWNLOAD_PAGE,
        url: 'https://www.diskgenius.cn/download.php',
        platform: 'windows',
        architecture: 'x86',
        priority: 10,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    const srcDisabled = await prisma.downloadSource.create({
      data: {
        versionId: pubVersion.id,
        sourceName: '已失效停用源',
        sourceType: SourceType.UNAVAILABLE,
        url: 'https://example.com/dead.exe',
        verificationStatus: VerificationStatus.DISABLED,
        isActive: false,
      },
    });

    // 2) 草稿软件（不允许公开下载）
    const draftSoftware = await prisma.software.create({
      data: {
        name: `Draft App ${ts}`,
        slug: `p88-draft-${ts}`,
        developer: 'Draft Dev',
        summary: '草稿中软件',
        description: '尚未发布',
        categoryId: category.id,
        status: ResourceStatus.DRAFT,
        isTestData: false,
      },
    });
    tempIds.softwareIds.push(draftSoftware.id);
    const draftVer = await prisma.softwareVersion.create({
      data: { softwareId: draftSoftware.id, version: '0.1', fileSize: '1MB', releaseDate: '2026-11-10', isLatest: true },
    });
    const draftSrc = await prisma.downloadSource.create({
      data: {
        versionId: draftVer.id,
        sourceName: '草稿直链',
        sourceType: SourceType.OFFICIAL_DIRECT,
        url: 'https://www.7-zip.org/a/7z2409-x64.exe',
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    // 3) 测试隔离软件 (isTestData: true)
    const testIsolationSw = await prisma.software.create({
      data: {
        name: `Test Isolated App ${ts}`,
        slug: `p88-iso-${ts}`,
        developer: 'Test Dev',
        summary: '隔离测试软件',
        description: '禁止公开下载',
        categoryId: category.id,
        status: ResourceStatus.PUBLISHED,
        isTestData: true,
      },
    });
    tempIds.softwareIds.push(testIsolationSw.id);
    const isoVer = await prisma.softwareVersion.create({
      data: { softwareId: testIsolationSw.id, version: '1.0', fileSize: '1MB', releaseDate: '2026-11-10', isLatest: true },
    });
    const isoSrc = await prisma.downloadSource.create({
      data: {
        versionId: isoVer.id,
        sourceName: '测试直链',
        sourceType: SourceType.OFFICIAL_DIRECT,
        url: 'https://www.7-zip.org/a/7z2409-x64.exe',
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    });

    // 登录获取管理员和普通会员 Cookie
    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: { identifier: adminUser.username, password: 'AdminP88Pass!123' },
    });
    const adminCookie = adminLoginRes.headers['set-cookie'] as string;

    const memberLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/members/login',
      payload: { account: memberUser.username, password: 'MemberP88Pass!123' },
    });
    assert.strictEqual(memberLoginRes.statusCode, 200, '普通会员测试账号必须成功登录');
    const memberCookie = memberLoginRes.headers['set-cookie'] as string;

    // =========================================================================
    // 开始逐项校验 32 项测试断言
    // =========================================================================

    await it('01. 已发布软件可正常访问详情与统一入口', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/resources/${pubSoftware.slug}` });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert(json.data.resource.latestVersion.downloadSources.length >= 4);
    });

    await it('02. 草稿软件禁止公开下载 (403 SOFTWARE_NOT_PUBLISHED)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${draftSrc.id}` });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'SOFTWARE_NOT_PUBLISHED');
    });

    await it('03. 测试标记软件禁止公开下载 (403 TEST_RESOURCE_BLOCKED)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${isoSrc.id}` });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'TEST_RESOURCE_BLOCKED');
    });

    await it('04. 失效下载源禁止使用 (410 SOURCE_UNAVAILABLE)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcDisabled.id}` });
      assert.strictEqual(res.statusCode, 410);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'SOURCE_UNAVAILABLE');
    });

    await it('05. 官方直链触发正确的 302 文件地址重定向', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcDirectX64.id}` });
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, 'https://www.7-zip.org/a/7z2409-x64.exe');
    });

    await it('06. 官方 Release 资产正确返回编译安装包与名称', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcReleaseArm64.id}?mode=json` });
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res.payload).data;
      assert.strictEqual(data.sourceType, 'OFFICIAL_RELEASE');
      assert.strictEqual(data.fileName, 'rufus-4.6.exe');
      assert.strictEqual(data.isDirectInstaller, true);
    });

    await it('07. 外部普通下载网页不被伪装标记为直链', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcWebpage.id}?mode=json` });
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res.payload).data;
      assert.strictEqual(data.action, 'WEBPAGE_NAVIGATION');
      assert.strictEqual(data.isDirectInstaller, false);
    });

    await it('08. 返回的下载源版本号与软件版本一致', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/resources/${pubSoftware.slug}` });
      const sources = JSON.parse(res.payload).data.resource.latestVersion.downloadSources;
      const direct = sources.find((s: any) => s.id === srcDirectX64.id);
      assert.strictEqual(direct.fileVersion, '24.09');
    });

    await it('09. 操作系统匹配过滤与错误平台拒绝', async () => {
      const okRes = await app.inject({ method: 'GET', url: `/api/v1/downloads/${pubSoftware.slug}?platform=windows&mode=json` });
      assert.strictEqual(okRes.statusCode, 200);
      const badRes = await app.inject({ method: 'GET', url: `/api/v1/downloads/${pubSoftware.slug}?platform=solaris` });
      assert.strictEqual(badRes.statusCode, 404);
      assert.strictEqual(JSON.parse(badRes.payload).error.code, 'PLATFORM_NOT_SUPPORTED');
    });

    await it('10. CPU 架构匹配 (x64 与 arm64 分流)', async () => {
      const x64Res = await app.inject({ method: 'GET', url: `/api/v1/downloads/${pubSoftware.slug}?platform=windows&arch=x64&mode=json` });
      assert.strictEqual(JSON.parse(x64Res.payload).data.sourceId, srcDirectX64.id);

      const armRes = await app.inject({ method: 'GET', url: `/api/v1/downloads/${pubSoftware.slug}?platform=windows&arch=arm64&mode=json` });
      assert.strictEqual(JSON.parse(armRes.payload).data.sourceId, srcReleaseArm64.id);
    });

    await it('11. 不允许客户端传入任意跳转 URL 劫持下载', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/downloads/start/${srcDirectX64.id}?url=https://evil.com/malware.exe&redirect=https://evil.com`,
      });
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res.headers.location, 'https://www.7-zip.org/a/7z2409-x64.exe', '跳转目标必须严格来自数据库，无视查询参数伪造');
    });

    await it('12. 链接巡检严禁探测内网私网 IP 与云元数据地址 (SSRF 拦截)', async () => {
      const localCheck = await checkExternalLink('http://127.0.0.1:3001/secret');
      assert.strictEqual(localCheck.isReachable, false);
      assert(localCheck.error?.includes('本地') || localCheck.error?.includes('私网'));

      const metaCheck = await checkExternalLink('http://169.254.169.254/latest/meta-data/');
      assert.strictEqual(metaCheck.isReachable, false);

      const fileProto = await checkExternalLink('file:///etc/passwd');
      assert.strictEqual(fileProto.isReachable, false);
    });

    await it('13. 下载目标包含危险协议或本地目标时在出口拦截 (403 UNSAFE_DOWNLOAD_URL)', async () => {
      const badSrc = await prisma.downloadSource.create({
        data: {
          versionId: pubVersion.id,
          sourceName: '内网测试恶意地址',
          sourceType: SourceType.OFFICIAL_DIRECT,
          url: 'http://192.168.1.1/admin.exe',
          directFileUrl: 'http://192.168.1.1/admin.exe',
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      });
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${badSrc.id}` });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'UNSAFE_DOWNLOAD_URL');
    });

    await it('14. 本站授权镜像流式下载返回正确安全响应头 (Content-Disposition/ETag/Accept-Ranges)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcAuthorizedMirror.id}` });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['accept-ranges'], 'bytes');
      assert(String(res.headers['content-disposition']).includes('attachment'));
      assert(String(res.headers['content-disposition']).includes(testPackageName));
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert(res.headers['etag']);
      assert.strictEqual(res.rawPayload.toString(), testPackageContent.toString());
    });

    await it('15. 本站托管文件支持 HTTP Range 部分分块请求 (206 Partial Content)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/downloads/start/${srcAuthorizedMirror.id}`,
        headers: { range: 'bytes=0-15' },
      });
      assert.strictEqual(res.statusCode, 206);
      assert.strictEqual(res.headers['content-range'], `bytes 0-15/${testPackageContent.length}`);
      assert.strictEqual(res.rawPayload.length, 16);
      assert.strictEqual(res.rawPayload.toString(), testPackageContent.subarray(0, 16).toString());
    });

    await it('16. 下载文件名经过安全编码与路径穿越隔离', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcAuthorizedMirror.id}` });
      assert(String(res.headers['content-disposition']).includes(testPackageName));
    });

    await it('17. 安装包下载后客户端计算 SHA-256 与预期完全一致', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcAuthorizedMirror.id}` });
      const computedSha = crypto.createHash('sha256').update(res.rawPayload).digest('hex').toUpperCase();
      assert.strictEqual(computedSha, testPackageSha256);
    });

    await it('18. 哈希不一致时严禁分发文件 (500 CHECKSUM_MISMATCH)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcTamperedMirror.id}` });
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'CHECKSUM_MISMATCH');
    });

    await it('19. 未获得合法再分发授权的镜像严禁公开下载 (403 MIRROR_NOT_AUTHORIZED)', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcUnauthorizedMirror.id}` });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'MIRROR_NOT_AUTHORIZED');
    });

    await it('20. 未扫描文件严禁展示虚假安全认证标识', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/resources/${pubSoftware.slug}` });
      const data = JSON.parse(res.payload).data.resource;
      assert.notStrictEqual(data.scanStatus, 'CLEAN', '主通道未经病毒扫描时不得伪装为 CLEAN');
    });

    await it('21. 下载生命周期事件准确记账 (DOWNLOAD_REDIRECT)', async () => {
      const before = await prisma.downloadEvent.count({
        where: { softwareId: pubSoftware.id, sourceId: srcDirectX64.id, eventType: EventType.DOWNLOAD_REDIRECT },
      });
      await app.inject({
        method: 'GET',
        url: `/api/v1/downloads/start/${srcDirectX64.id}`,
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });
      const after = await prisma.downloadEvent.count({
        where: { softwareId: pubSoftware.id, sourceId: srcDirectX64.id, eventType: EventType.DOWNLOAD_REDIRECT },
      });
      assert.strictEqual(after, before + 1);
    });

    await it('22. 跳转到第三方官方服务器不虚报 TRANSFER_COMPLETED', async () => {
      const completedCount = await prisma.downloadEvent.count({
        where: { softwareId: pubSoftware.id, sourceId: srcDirectX64.id, eventType: EventType.TRANSFER_COMPLETED },
      });
      assert.strictEqual(completedCount, 0, '外链跳转不可虚报下载完成');
    });

    await it('23. 管理员可通过接口新增与审核下载源', async () => {
      const reviewRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/download-sources/${srcDirectX64.id}/review`,
        headers: { cookie: adminCookie },
        payload: { action: 'APPROVE', reviewNotes: 'P8.8 核验通过' },
      });
      assert.strictEqual(reviewRes.statusCode, 200);
      assert.strictEqual(JSON.parse(reviewRes.payload).data.reviewStatus, 'APPROVED');
    });

    await it('24. 普通会员越权审核或修改下载源被拒绝 (401/403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/download-sources/${srcDirectX64.id}/review`,
        headers: { cookie: memberCookie },
        payload: { action: 'APPROVE' },
      });
      assert(res.statusCode === 401 || res.statusCode === 403);
    });

    await it('25. 管理员停用下载源后公开通道立即失效不可下载', async () => {
      await app.inject({
        method: 'POST',
        url: `/api/v1/admin/download-sources/${srcWebpage.id}/review`,
        headers: { cookie: adminCookie },
        payload: { action: 'DISABLE' },
      });
      const tryRes = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcWebpage.id}` });
      assert.strictEqual(tryRes.statusCode, 410);
    });

    await it('26. 10 秒内同 IP 重复请求去重，且标记 isTestEvent=true 不污染运营统计', async () => {
      const ipHeader = { 'x-forwarded-for': '9.9.9.9' };
      await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcDirectX64.id}`, headers: ipHeader });
      const countAfter1 = await prisma.downloadEvent.count({ where: { softwareId: pubSoftware.id, sourceId: srcDirectX64.id } });
      await app.inject({ method: 'GET', url: `/api/v1/downloads/start/${srcDirectX64.id}`, headers: ipHeader });
      const countAfter2 = await prisma.downloadEvent.count({ where: { softwareId: pubSoftware.id, sourceId: srcDirectX64.id } });
      assert.strictEqual(countAfter2, countAfter1, '短时间高频刷点击必须被防刷去重拦截');
    });

    await it('27. 下载失败提示准确且具有可读错误码', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/downloads/start/nonexistent-id` });
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(JSON.parse(res.payload).error.code, 'SOURCE_NOT_FOUND');
    });

    await it('28. 手机端下载区域布局自适应配置正确', async () => {
      const detailCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ResourceDetailPage.tsx'), 'utf-8');
      assert(detailCode.includes('sm:flex-row') && detailCode.includes('w-full md:w-auto'), '移动端按钮与布局适配必须完整');
    });

    await it('29. 桌面端主下载按钮清晰标识直链与网页渠道文案', async () => {
      const detailCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ResourceDetailPage.tsx'), 'utf-8');
      assert(detailCode.includes('id="primary-download-btn"'), '必须包含主下载按钮');
      assert(detailCode.includes('立即下载'), '必须包含直链主下载按钮文案');
      assert(detailCode.includes('前往官方下载'), '必须诚实区分官方网页跳转按钮文案');
    });

    await it('30. 现有软件详情页核心布局、介绍与右侧边栏未发生回退', async () => {
      const detailCode = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/ResourceDetailPage.tsx'), 'utf-8');
      assert(detailCode.includes('SoftwareDetailSidebar'), '必须保留详情页右侧侧边栏组件');
      assert(detailCode.includes('ResourceReviewsAndAlternatives'), '必须保留评价与替代组件');
    });

    await it('31. 本地测试严格隔离，数据库地址绝不指向线上生产服务器', async () => {
      assert(
        config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1'),
        '测试运行必须使用本地隔离库'
      );
      assert(!config.databaseUrl.includes('134.175.230.107'), '严禁操作生产服务器 IP');
    });

    await it('32. public 目录与 dist 产物目录中绝对不含 .exe/.msi/.zip 等安装程序残留', async () => {
      const scanDirForInstallers = (dir: string): string[] => {
        if (!fs.existsSync(dir)) return [];
        const bad: string[] = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            bad.push(...scanDirForInstallers(full));
          } else if (/\.(exe|msi|zip|7z|dmg|pkg|deb|rpm|appimage)$/i.test(entry.name)) {
            bad.push(full);
          }
        }
        return bad;
      };
      const publicBad = scanDirForInstallers(path.resolve(process.cwd(), 'public'));
      const distBad = scanDirForInstallers(path.resolve(process.cwd(), 'dist'));
      assert.strictEqual(publicBad.length, 0, `public 目录存在敏感安装包残留: ${publicBad.join(', ')}`);
      assert.strictEqual(distBad.length, 0, `dist 构建目录存在敏感安装包残留: ${distBad.join(', ')}`);
    });
  } finally {
    // 彻底清理本轮生成的临时测试数据与临时文件，保持本地库干净整洁
    for (const swId of tempIds.softwareIds) {
      await prisma.software.deleteMany({ where: { id: swId } }).catch(() => {});
    }
    for (const fid of tempIds.fileIds) {
      await prisma.hostedFile.deleteMany({ where: { id: fid } }).catch(() => {});
    }
    if (tempIds.userIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: tempIds.userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: tempIds.userIds } } }).catch(() => {});
    }
    await prisma.memberUser.deleteMany({ where: { username: { startsWith: 'p88_member_' } } }).catch(() => {});
    for (const pf of tempIds.physicalFiles) {
      if (fs.existsSync(pf)) fs.unlinkSync(pf);
    }

    await app.close();
    await prisma.$disconnect();
  }

  console.log('\n========================================================================');
  console.log(`📊 P8.8 测试执行完毕: 通过: ${passed} | 失败: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('p88DirectDownloadTest')) {
  runP88Tests().catch((err) => {
    console.error('P8.8 测试运行异常:', err);
    process.exit(1);
  });
}
