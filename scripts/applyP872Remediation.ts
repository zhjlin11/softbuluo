import { PrismaClient, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('▶ 开始执行 P8.7.2 本地数据源真实性、文案合规与官方开源图标治理...');

  // 1. 暂停无法核验授权与 SHA-256 完整性的第三方网盘直链（ZeroFS / Buzzheavier），不删除历史记录
  const thirdPartySources = await prisma.downloadSource.findMany({
    where: {
      OR: [
        { url: { contains: 'zerofs.link', mode: 'insensitive' } },
        { url: { contains: 'buzzheavier.com', mode: 'insensitive' } },
      ],
    },
    select: { id: true, url: true, sourceName: true },
  });

  for (const src of thirdPartySources) {
    const provider = src.url.includes('zerofs.link') ? 'ZeroFS' : 'Buzzheavier';
    await prisma.downloadSource.update({
      where: { id: src.id },
      data: {
        isActive: false,
        verificationStatus: VerificationStatus.PENDING,
        sourceName: `第三方托管镜像 (${provider} · 暂未验证哈希，已暂停直链)`,
        reviewNotes:
          'P8.7.2 来源治理：第三方文件托管链接缺少微软原厂发布授权证明与实测 SHA-256 校验记录，已暂停公开直链推荐并保留历史记录。',
      },
    });
  }
  console.log(`  - 已安全暂停 ${thirdPartySources.length} 条未验证第三方网盘来源（保留历史数据）`);

  // 2. 修正专题：Windows 与 Office 安装资源及原版镜像校验指南（移除 Massgrave 官方认证误导）
  const msTopic = await prisma.topic.findUnique({ where: { slug: 'genuine-microsoft-installation-media' } });
  if (msTopic) {
    await prisma.topic.update({
      where: { id: msTopic.id },
      data: {
        title: 'Windows 与 Office 安装资源及原版镜像校验指南',
        description:
          '整理微软官方发布渠道（Microsoft 官网下载站与 OfficeCDN）及常用 SHA-256 文件校验方法。Windows 与 Office 均属商业授权软件，下载安装文件不代表取得合法使用许可；本站不将第三方索引站称为官方认证主体。',
        seoTitle: 'Windows 与 Office 安装资源及原版镜像校验指南 - 软游部落',
        seoDescription:
          '整理微软官方下载渠道与 PowerShell/CertUtil 文件完整性校验指南。商业软件下载前请核实实际来源与合法使用许可，具体校验状态以来源审核记录为准。',
        seoKeywords: 'Windows安装指南,Office官方下载渠道,SHA-256校验教程,Microsoft官网,系统安装介质校验',
      },
    });

    const trList = await prisma.topicResource.findMany({
      where: { topicId: msTopic.id },
      include: { software: { select: { slug: true } } },
    });
    for (const tr of trList) {
      const slug = tr.software.slug;
      let note = '已登记发布渠道 · 下载前请核实来源与授权许可';
      if (slug.startsWith('office') || slug === 'microsoft-365') {
        note = '微软官方 CDN/安装引导整理 · 商业软件需合法使用许可';
      } else if (slug.startsWith('windows')) {
        note = '微软官方渠道与镜像校验参考 · 商业授权软件';
      } else if (slug === 'ab-download-manager') {
        note = '开源多线程下载工具 · 请核实 GitHub 发布页校验信息';
      }
      await prisma.topicResource.update({
        where: { id: tr.id },
        data: { customNote: note },
      });
    }
    console.log(`  - 已修正专题 genuine-microsoft-installation-media 及 ${trList.length} 条关联备注`);
  }

  // 3. 修正软件条目的误导措辞（移除 Massgrave 官方 / 未核验原厂认证声明，补充商业授权提示）
  const softwareUpdates: Array<{
    slug: string;
    name?: string;
    summary: string;
    descriptionAppend: string;
  }> = [
    {
      slug: 'windows-11',
      name: 'Windows 11 安装介质与官网获取引导',
      summary:
        '整理 Windows 11 微软官方下载渠道与镜像 SHA-256 校验方法（商业授权软件：获取安装文件不代表拥有使用许可）。',
      descriptionAppend:
        '【来源与授权声明】Windows 11 属于微软商业授权操作系统，下载安装介质不代表获得正版使用授权。请通过微软官方网站渠道获取并自行比对 SHA-256 校验值；具体来源审核与文件扫描状态以本页下载来源明细为准。',
    },
    {
      slug: 'windows-10',
      name: 'Windows 10 安装介质与官网获取引导',
      summary:
        '整理 Windows 10 22H2 微软官网安装工具引导与完整性校验教程（商业授权软件，需自备正版许可）。',
      descriptionAppend:
        '【来源与授权声明】Windows 10 属于微软商业授权系统，本站仅整理微软官方下载渠道及通用 SHA-256 校验方法，不提供未经授权的激活工具或绕过方式。',
    },
    {
      slug: 'windows-ltsc',
      name: 'Windows 10 / 11 Enterprise LTSC 说明指南',
      summary:
        '介绍 Windows 企业长期服务通道（LTSC）版本特性、适用范围与官方评估渠道指引（商业企业授权，暂不提供直链文件）。',
      descriptionAppend:
        '【来源与授权声明】Enterprise LTSC 面向微软批量授权企业客户发行。因缺少公开可核验的原厂直链与哈希记录，本站已暂停第三方托管镜像直链推荐，请通过微软企业评估中心或官方 VLSC 渠道获取。',
    },
    {
      slug: 'windows-server',
      name: 'Windows Server 发行版本与渠道说明',
      summary:
        '介绍 Windows Server 服务器操作系统版本规格及微软评估中心获取途径（商业授权产品，暂不提供第三方镜像直链）。',
      descriptionAppend:
        '【来源与授权声明】Windows Server 属微软商业授权产品。出于来源真实性与完整性审慎要求，本站已暂停未核验的第三方网盘镜像直链，建议直接前往 Microsoft Evaluation Center 下载评估或使用商业授权介质。',
    },
    {
      slug: 'windows-7',
      name: 'Windows 7 SP1 历史版本归档说明',
      summary:
        '记录 Windows 7 Service Pack 1 系统版本信息及镜像校验参考（系统已停止官方支持，暂不提供未核验第三方直链）。',
      descriptionAppend:
        '【安全与授权提示】Windows 7 已结束微软官方扩展安全更新支持，且属于商业授权系统。本站已暂停第三方文件托管站点镜像直链，历史归档信息仅供校验参考。',
    },
    {
      slug: 'office-2024',
      summary:
        'Microsoft Office 2024 零售买断版官方 CDN 通道整理，包含 Word、Excel 等桌面组件（商业授权软件，下载不含许可）。',
      descriptionAppend:
        '【授权提示】Office 2024 为微软商业付费软件，通过微软 CDN 下载安装器或离线镜像后仍需合法正版账户或密钥激活，具体文件校验请以页面来源状态为准。',
    },
    {
      slug: 'office-2021',
      summary:
        'Microsoft Office 2021 官方 OfficeCDN 安装通道整理（商业授权软件，下载安装文件不代表取得使用许可）。',
      descriptionAppend:
        '【授权提示】Office 2021 属于微软商业授权办公套件，请配合合法许可使用；本站登记链接源自微软官方 OfficeCDN 或 C2R 安装入口，下载后建议核查微软数字签名证书。',
    },
    {
      slug: 'microsoft-365',
      name: 'Microsoft 365 官方安装通道指引',
      summary:
        '整理微软官方 Microsoft 365 在线部署入口与离线映像通道（订阅制商业软件，需自备有效 Microsoft 365 订阅）。',
      descriptionAppend:
        '【授权提示】Microsoft 365 为订阅制商业软件，下载并安装客户端后需登录已购买相应订阅的微软账号方可完整启用功能。',
    },
    {
      slug: 'office-mac',
      name: 'Microsoft Office for Mac 官方安装引导',
      summary:
        '整理适用于 macOS（Apple Silicon / Intel）的微软官方 PKG 安装通道指引（商业授权软件，不含激活许可）。',
      descriptionAppend:
        '【授权提示】Office for Mac 属于微软商业软件，本站所列连接转向微软官方 CDN，安装后请使用合法商业许可登录激活并校验 PKG 开发者签名证书。',
    },
    {
      slug: 'ab-download-manager',
      summary:
        '开源免费的跨平台多线程桌面下载工具，支持断点续传、队列调度与浏览器接管扩展（Apache-2.0 协议）。',
      descriptionAppend:
        '【开源渠道提示】本项目托管于 GitHub 开源仓库，下载时请核对官方 Releases 页面发布信息。',
    },
  ];

  for (const item of softwareUpdates) {
    const existing = await prisma.software.findUnique({ where: { slug: item.slug } });
    if (!existing) continue;
    const cleanedDesc = existing.description
      .replace(/massgrave\.dev\s*(官方认证|严格核验|认证)?/gi, '社区索引参考')
      .replace(/Massgrave\s*官方[^。]*。?/gi, '')
      .replace(/所有直链均严格比对微软官方\s*SHA-256\s*原厂指纹。?/g, '提供 SHA-256 校验方法与渠道说明。');
    const nextDesc = cleanedDesc.includes('【来源与授权声明】') || cleanedDesc.includes('【授权提示】') || cleanedDesc.includes('【安全与授权提示】') || cleanedDesc.includes('【开源渠道提示】')
      ? cleanedDesc
      : `${cleanedDesc}\n\n${item.descriptionAppend}`;

    await prisma.software.update({
      where: { id: existing.id },
      data: {
        ...(item.name ? { name: item.name } : {}),
        summary: item.summary,
        description: nextDesc,
      },
    });
  }
  console.log(`  - 已整改 ${softwareUpdates.length} 款软件的来源描述与商业授权声明`);

  // 4. 修正教程 how-to-verify-genuine-iso-checksums
  await prisma.tutorial.updateMany({
    where: { slug: 'how-to-verify-genuine-iso-checksums' },
    data: {
      title: '如何使用系统工具验证 Windows 与 Office 安装文件 SHA-256 完整性',
      summary:
        '详解如何通过 7-Zip、PowerShell Get-FileHash 与 CertUtil 计算本地安装镜像哈希并核查数字签名，具体校验结论以官方签名与实际比对为准。',
      seoTitle: 'Windows 与 Office 安装文件 SHA-256 校验与数字签名核查教程 - 软游部落',
      seoDescription:
        '手把手教你使用 Windows 内置 PowerShell、CertUtil 与 7-Zip 核验安装文件 SHA-256 哈希和开发者数字签名，识别第三方篡改风险。',
      content: `# 如何使用系统工具验证 Windows 与 Office 安装文件完整性

从互联网下载操作系统或大型办公套件时，核对**文件完整哈希**与**厂商数字签名**是防范传输损坏和第三方捆绑的关键步骤。

> **重要声明**：Windows 与 Office 属于微软商业授权软件，下载安装文件及完成完整性校验，均**不代表获得软件合法使用许可证**，请遵守对应软件许可协议。

---

## 一、优先从厂商官方渠道获取并核查数字签名

1. Windows 安装工具与镜像建议优先前往微软官方网站或合法商业授权后台获取；
2. 对于 \`.exe\` / \`.msi\` / \`.pkg\` 等可签名安装程序，下载后右键文件 **属性 -> 数字签名**，确认签名方为 \`Microsoft Corporation\` 且证书有效。

---

## 二、使用 Windows 内置 PowerShell / CertUtil 计算 SHA-256

无需安装额外工具，即可计算本地文件的 SHA-256 摘要：

\`\`\`powershell
Get-FileHash "D:\\Downloads\\installer.iso" -Algorithm SHA256
\`\`\`

或使用 \`certutil\`：

\`\`\`cmd
certutil -hashfile "D:\\Downloads\\installer.iso" SHA256
\`\`\`

若已安装开源软件 [7-Zip](/software/7zip)，也可右键文件选择 **7-Zip -> CRC SHA -> SHA-256** 快速比对。

---

## 三、区分微软官方渠道与第三方公共指纹索引

部分开发者社区索引数据库（如 files.rg-adguard、awuctl MVS 公开归档或社区整理列表）仅用于辅助检索历史哈希参考值，**并非微软官方认证发布机构**。具体资源校验状态请以对应软件页登记来源记录及厂商数字签名为准。`,
    },
  });
  console.log('  - 已规范化校验教程文案');

  // 5. 为具备真实官方开源图标资产的软件挂载本地 /logo/software/ 资源（覆盖空值或 dicebear 占位图）
  const officialIconMap: Record<string, string> = {
    '7zip': '/logo/software/7zip.png',
    filezilla: '/logo/software/filezilla.ico',
    rufus: '/logo/software/rufus.png',
    blender: '/logo/software/blender.svg',
    vlc: '/logo/software/vlc.png',
    git: '/logo/software/git.png',
    'obs-studio': '/logo/software/obs-studio.png',
    libreoffice: '/logo/software/libreoffice.ico',
    wireshark: '/logo/software/wireshark.png',
  };

  for (const [slug, iconUrl] of Object.entries(officialIconMap)) {
    await prisma.software.updateMany({
      where: { slug },
      data: { iconUrl },
    });
  }
  console.log(`  - 已更新 ${Object.keys(officialIconMap).length} 款开源软件真实官方本地图标路径`);

  // 6. 写入系统审计日志
  const anyAdmin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  if (anyAdmin) {
    await prisma.auditLog.create({
      data: {
        actorId: anyAdmin.id,
        action: 'P872_CONTENT_AND_SOURCE_GOVERNANCE',
        targetType: 'CHANNEL',
        targetId: 'SOFTWARE',
        after: JSON.stringify({
          pausedThirdPartyMirrors: thirdPartySources.length,
          updatedSoftwares: softwareUpdates.length,
          updatedOssIcons: Object.keys(officialIconMap).length,
          topicSlug: 'genuine-microsoft-installation-media',
        }),
      },
    });
  }

  console.log('✅ P8.7.2 本地数据库与来源合规治理完成。');
}

main()
  .catch((err) => {
    console.error('执行 P8.7.2 治理失败:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
