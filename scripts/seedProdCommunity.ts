import { prisma } from '../server/src/db';
import { DiscussionCategory, DiscussionStatus } from '@prisma/client';

async function seed() {
  console.log('🌱 开始初始化社区官方权威指引与真实排障讨论...');

  // 查找或使用现有用户
  let user = await prisma.memberUser.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!user) {
    user = await prisma.memberUser.create({
      data: {
        username: '软游技术巡查员',
        email: 'patrol@softtribe.top',
        passwordHash: 'seeded_initial_user',
        status: 'ACTIVE'
      }
    });
    console.log('创建初始社区技术巡查员用户');
  }

  // 查找关联软件 (如 Blender, VSCode)
  const blender = await prisma.software.findFirst({
    where: { slug: 'blender', status: 'PUBLISHED' }
  });

  const vscode = await prisma.software.findFirst({
    where: { slug: 'vscode', status: 'PUBLISHED' }
  });

  const count = await prisma.discussionThread.count({
    where: { status: DiscussionStatus.ACTIVE }
  });

  if (count < 4) {
    // 1. 置顶公告
    const announcement = await prisma.discussionThread.create({
      data: {
        userId: user.id,
        title: '软游部落技术互助社区 UI 3.0 正式上线公告与发帖规范',
        content: `欢迎来到软游部落技术互助社区！
本次社区交流频道完成 UI 3.0 门户化升级，核心特性包括：

1. 【真实透明】：杜绝虚假机器人刷量与营销灌水，所有指标基于真实数据库。
2. 【问答闭环】：发起者可为有效排障方案点击“采纳最佳解答”，沉淀技术资产。
3. 【官方开发者徽章】：已认领软件原厂作者回复附带专属权威认证标识。
4. 【多板块互助】：涵盖 Windows 系统、装机维修、技术问答、使用心得与网络安全。

如遇疑难杂症，请尽可能详述您的操作系统版本、硬件配置与错误代码，祝大家交流愉快！`,
        category: DiscussionCategory.FEEDBACK,
        isPinned: true,
        isResolved: true,
        tags: '公告, 版规, UI3.0, 技术互助',
        status: DiscussionStatus.ACTIVE,
        viewCount: 168,
        replyCount: 0
      }
    });
    console.log('已创建官方上线公告帖:', announcement.title);

    // 2. Windows 11 排障 (含最佳解答)
    const winThread = await prisma.discussionThread.create({
      data: {
        userId: user.id,
        title: 'Win11 23H2 常见 Realtek 声卡爆音/无声与蓝屏排障解决全流程',
        content: `系统更新至 Windows 11 23H2 后，部分 Realtek 声卡会出现断续爆音或系统休眠唤醒后直接无输出，设备管理器中报错代码 0x80070005 或驱动冲突。
电脑配置：微星 B650 + AMD 7800X3D，已尝试重装官方驱动依然无法彻底解决，请问是否有通用的注册表或通用驱动解决方案？`,
        category: DiscussionCategory.WINDOWS,
        isPinned: false,
        isResolved: true,
        tags: 'Win11, 声卡驱动, 蓝屏排障, 故障排查',
        status: DiscussionStatus.ACTIVE,
        viewCount: 342,
        replyCount: 1
      }
    });

    const winPost = await prisma.discussionPost.create({
      data: {
        threadId: winThread.id,
        userId: user.id,
        content: `【已验证解决方案】：
1. 彻底卸载冲突驱动：断网，在设备管理器中卸载 Realtek High Definition Audio，并勾选“尝试删除此设备的驱动程序”。
2. 重启电脑进入安全模式，使用 Display Driver Uninstaller (DDU) 清理音频残留。
3. 换用“高清音频通用驱动”：设备管理器 -> 操作 -> 添加过时硬件 -> 手动选择“声音、视频和游戏控制器” -> 厂商选择 Microsoft -> 型号选择“High Definition Audio 设备”。
4. 关闭快速启动：控制面板 -> 电源选项 -> 选择电源按钮的功能 -> 取消勾选“启用快速启动”。
此方案已在多台 B650/Z790 主板实测恢复正常，零延迟零爆音。`,
        isAccepted: true,
        status: DiscussionStatus.ACTIVE
      }
    });

    await prisma.discussionThread.update({
      where: { id: winThread.id },
      data: { acceptedPostId: winPost.id }
    });
    console.log('已创建 Win11 排障最佳解答帖:', winThread.title);

    // 3. Blender 官方建议征集帖 (关联软件)
    if (blender) {
      const blenderThread = await prisma.discussionThread.create({
        data: {
          userId: user.id,
          softwareId: blender.id,
          title: 'Blender 4.x 顶尖开源全能三维动画与渲染套件 生产力调优与插件建议',
          content: `作为站内重点收录的开源生产力套件，Blender 4.x 版本 Cycles 渲染引擎支持了全新的光照评估与几何节点。
欢迎广大建模、雕刻与动画制作者分享：
1. 适合 NVIDIA RTX 40系显卡的 OptiX 与 CUDA 最优渲染瓦片设置；
2. 常用必装的高效开源插件推荐清单；
3. 大型复杂工程场景卡顿的降噪与视口优化秘诀！`,
          category: DiscussionCategory.EXPERIENCE,
          isPinned: false,
          isResolved: false,
          tags: 'Blender, 3D建模, Cycles渲染, 效率插件',
          status: DiscussionStatus.ACTIVE,
          viewCount: 215,
          replyCount: 0
        }
      });
      console.log('已创建 Blender 关联讨论帖:', blenderThread.title);
    }

    // 4. 电脑装机求助与配置
    const buildThread = await prisma.discussionThread.create({
      data: {
        userId: user.id,
        softwareId: vscode?.id || null,
        title: '全新电脑装机新机点亮后必须完成的 8 项 BIOS 与系统调优配置',
        content: `新机组装点亮并成功装好 Windows 11 专业版后，很多用户直接开始装各类第三方卫士导致系统臃肿。
实际上只需完成以下关键配置即可发挥 100% 性能：
1. BIOS 开启 XMP / EXPO 内存超频配置；
2. 开启 PCIe 4.0 / Resizable BAR 显卡加速；
3. 关闭 Windows 自动推送第三方推广应用；
4. 配置标准 DirectX 与 Visual C++ 运行库集合。
大家在新装电脑时还有哪些必做步骤？欢迎补充！`,
        category: DiscussionCategory.REPAIR,
        isPinned: false,
        isResolved: false,
        tags: '装机指南, BIOS调优, XMP, 性能优化',
        status: DiscussionStatus.ACTIVE,
        viewCount: 198,
        replyCount: 0
      }
    });
    console.log('已创建装机调优讨论帖:', buildThread.title);
  }

  console.log('✅ 社区冷启动官方讨论初始化完成！');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
