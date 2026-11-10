import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert';
import { PrismaClient, ResourceStatus, ResourceType, SourceType, VerificationStatus, ScanStatus } from '@prisma/client';
import { config } from '../server/src/config';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const prisma = new PrismaClient();

async function main() {
  const ts = Date.now();
  const slug = `p88-e2e-browser-${ts}`;
  const testFileName = `SoftTribe_Installer_Test_${ts}.zip`;
  const testPayload = Buffer.from(`PK\x03\x04SoftTribe E2E Real Browser Download Test Payload ${ts} Validating SHA256 Streaming Integrity!`);
  const expectedSha256 = crypto.createHash('sha256').update(testPayload).digest('hex').toUpperCase();

  fs.mkdirSync(config.softwareStorageRoot, { recursive: true });
  const storageFilePath = path.join(config.softwareStorageRoot, testFileName);
  fs.writeFileSync(storageFilePath, testPayload);

  const category = await prisma.category.findFirst();
  assert(category, '找不到系统分类');

  const hostedFile = await prisma.hostedFile.create({
    data: {
      storageKey: testFileName,
      originalName: testFileName,
      mimeType: 'application/zip',
      sizeBytes: BigInt(testPayload.length),
      sha256: expectedSha256,
      scanStatus: ScanStatus.CLEAN,
      scanEngine: 'LocalE2EScan',
      uploadedBy: 'e2e-script',
    },
  });

  const sw = await prisma.software.create({
    data: {
      name: 'SoftTribe E2E 直链测试套件',
      slug,
      englishName: 'SoftTribe Direct Package Verifier',
      developer: 'SoftTribe Engineering',
      summary: 'P8.8 Playwright 真实浏览器端到端一键下载与 SHA-256 哈希核验测试件。',
      description: '本资源仅用于隔离环境下验证浏览器真实触发 Download 事件、文件名与校验和一致性。',
      categoryId: category.id,
      type: ResourceType.SOFTWARE,
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
    },
  });

  const ver = await prisma.softwareVersion.create({
    data: {
      softwareId: sw.id,
      version: '8.8.0',
      platform: 'Windows 10/11',
      architecture: 'x64',
      fileSize: '128 B',
      releaseDate: '2026-11-10',
      isLatest: true,
    },
  });

  await prisma.downloadSource.create({
    data: {
      versionId: ver.id,
      sourceName: '软游部落授权镜像通道 (Playwright 验证)',
      sourceType: SourceType.AUTHORIZED_MIRROR,
      url: 'https://softtribe.top/e2e-mirror',
      fileId: hostedFile.id,
      fileName: testFileName,
      fileVersion: '8.8.0',
      platform: 'windows',
      architecture: 'x64',
      sha256: expectedSha256,
      fileSizeLabel: '128 B',
      mirrorAuthorizationStatus: 'APPROVED',
      scanStatus: ScanStatus.CLEAN,
      priority: 1,
      verificationStatus: VerificationStatus.VERIFIED,
      isActive: true,
    },
  });

  await prisma.downloadSource.create({
    data: {
      versionId: ver.id,
      sourceName: '外部网页备用来源',
      sourceType: SourceType.EXTERNAL_DOWNLOAD_PAGE,
      url: 'https://www.7-zip.org/download.html',
      platform: 'linux',
      architecture: 'x64',
      priority: 5,
      verificationStatus: VerificationStatus.VERIFIED,
      isActive: true,
    },
  });

  const browser = await chromium.launch({ headless: true });
  const tempDownloadSavePath = path.join(config.quarantineStorageRoot || './storage', `downloaded_e2e_${ts}.zip`);

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const page = await context.newPage();

    console.log(`🌐 正在打开 E2E 测试软件详情页: http://localhost:3000/software/${slug}`);
    await page.goto(`http://localhost:3000/software/${slug}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_01_detail_page_direct_btn.png') });
    console.log('📸 已截图: p88_01_detail_page_direct_btn.png');

    // 验证页面上按钮文案包含 "本站下载"
    const primaryBtnText = await page.locator('#primary-download-btn').textContent();
    console.log('🔎 主按钮文案:', primaryBtnText?.trim());
    assert(primaryBtnText?.includes('本站下载'), '授权镜像主按钮必须显示"本站下载"');

    // 点击下载按钮并捕获浏览器真实 download 事件
    console.log('⬇️ 触发主按钮点击并监听浏览器真实 Download 事件...');
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.click('#primary-download-btn');
    const download = await downloadPromise;

    const suggestedName = download.suggestedFilename();
    console.log(`✅ 浏览器捕获真实 Download 事件! 建议文件名: ${suggestedName}`);
    assert.strictEqual(suggestedName, testFileName, '下载文件名必须与原文件完全一致');

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_02_download_triggered_feedback.png') });
    console.log('📸 已截图: p88_02_download_triggered_feedback.png');

    // 保存到本地并核验实际文件字节与 SHA-256
    fs.mkdirSync(path.dirname(tempDownloadSavePath), { recursive: true });
    await download.saveAs(tempDownloadSavePath);
    const downloadedBuffer = fs.readFileSync(tempDownloadSavePath);
    const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuffer).digest('hex').toUpperCase();
    console.log(`🔐 浏览器落盘文件校验: 大小=${downloadedBuffer.length} 字节, SHA-256=${downloadedSha256}`);
    assert.strictEqual(downloadedSha256, expectedSha256, '下载落盘文件 SHA-256 必须与源指纹分毫不差');

    // 2. 检验实际官方直链软件 VS Code (多架构切换)
    await page.goto('http://localhost:3000/software/vscode', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    await page.locator('#download-channels').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_03_vscode_multi_arch.png') });
    console.log('📸 已截图: p88_03_vscode_multi_arch.png');

    // 3. 检验实际官方直链软件 7-Zip
    await page.goto('http://localhost:3000/software/7zip', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    const btn7z = await page.locator('#primary-download-btn').textContent();
    console.log('🔎 7-Zip 主按钮文案:', btn7z?.trim());
    assert(btn7z?.includes('立即下载'), '7-Zip 官方直链主按钮必须显示"立即下载"');
    await page.locator('#download-channels').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_04_7zip_direct_channels.png') });
    console.log('📸 已截图: p88_04_7zip_direct_channels.png');

    // 4. 检验外部网页软件 DiskGenius（绝不伪装直链）
    await page.goto('http://localhost:3000/software/diskgenius', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    const btnDg = await page.locator('#primary-download-btn').textContent();
    console.log('🔎 DiskGenius 主按钮文案:', btnDg?.trim());
    assert(btnDg?.includes('前往官方下载'), 'DiskGenius 官方网页源必须诚实显示"前往官方下载"');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_05_diskgenius_webpage_honest.png') });
    console.log('📸 已截图: p88_05_diskgenius_webpage_honest.png');

    // 5. 移动端视口检验 (390px)
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto('http://localhost:3000/software/7zip', { waitUntil: 'networkidle', timeout: 20000 });
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'p88_06_mobile_download_view.png') });
    console.log('📸 已截图: p88_06_mobile_download_view.png');
    await mobileCtx.close();

    console.log('\n🎉 Playwright 真实浏览器端到端下载验收全部通过！');
  } finally {
    await browser.close();
    // 清理测试痕迹
    await prisma.software.deleteMany({ where: { id: sw.id } }).catch(() => {});
    await prisma.hostedFile.deleteMany({ where: { id: hostedFile.id } }).catch(() => {});
    if (fs.existsSync(storageFilePath)) fs.unlinkSync(storageFilePath);
    if (fs.existsSync(tempDownloadSavePath)) fs.unlinkSync(tempDownloadSavePath);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ E2E 验收失败:', err);
  process.exit(1);
});
