import { prisma } from '../server/src/db';
import { ResourceStatus, ResourceType } from '@prisma/client';

async function seedGames() {
  const gameCategory = await prisma.category.findUnique({
    where: { slug: 'games' },
  });

  if (!gameCategory) {
    console.error('游戏分类不存在');
    return;
  }

  const candidateGames = [
    {
      name: 'SuperTuxKart',
      slug: 'supertuxkart',
      englishName: 'SuperTuxKart',
      developer: 'SuperTuxKart Team',
      publisher: 'SuperTuxKart Team',
      genre: '3D卡丁车竞速',
      supportedPlatforms: 'Windows 10/11, macOS, Linux, Android',
      summary: '3D 开源卡丁车竞速游戏，包含多样化赛道、单机大奖赛与在线多人联机对战',
      description: 'SuperTuxKart 是一款风靡全球的经典 3D 开源卡丁车竞速游戏，以吉祥物 Tux 为主角。游戏提供丰富的单人故事战役模式、大奖赛、时间竞速、足球模式与多人在线联机对战。游戏引擎基于严谨物理模型打造，完全免费开源且不包含任何商业内购。',
      officialWebsite: 'https://supertuxkart.net',
      distributionPlatform: 'Official Website / Steam / Itch.io',
      priceType: 'OPEN_SOURCE',
      licenseType: 'GPLv3',
      version: '1.4',
      status: ResourceStatus.DRAFT, // 严格作为候选资源待审核
    },
    {
      name: '0 A.D.',
      slug: '0ad',
      englishName: '0 A.D. Empires Ascendant',
      developer: 'Wildfire Games',
      publisher: 'Wildfire Games',
      genre: '历史即时战略 (RTS)',
      supportedPlatforms: 'Windows 10/11, macOS, Linux',
      summary: '跨平台古代战争即时战略游戏，再现公元前 500 年至公元 500 年古代文明战争',
      description: '0 A.D. 由 Wildfire Games 独立开发的开源历史 RTS 游戏。玩家将带领迦太基、凯尔特、希腊、波斯、罗马等十三大古代文明，建立城邦、采集资源、训练军队与发展科技。游戏具备全 3D 渲染画面、自定义随机地图与多人联网对局能力。',
      officialWebsite: 'https://play0ad.com',
      distributionPlatform: 'Official Website / OpenSource',
      priceType: 'OPEN_SOURCE',
      licenseType: 'GPLv2',
      version: 'Alpha 26',
      status: ResourceStatus.DRAFT,
    },
    {
      name: 'OpenTTD',
      slug: 'openttd',
      englishName: 'OpenTTD',
      developer: 'OpenTTD Team',
      publisher: 'OpenTTD Team',
      genre: '运输大亨模拟经营',
      supportedPlatforms: 'Windows 10/11, macOS, Linux',
      summary: '经典商业模拟游戏《运输大亨豪华版》的开源重制版，支持复杂铁路路网规划',
      description: 'OpenTTD 是一款以陆运、航运、海运物流网络规划为核心的开源商业经营模拟游戏。玩家扮演运输公司总裁，建设庞大而高效的铁路信号系统、公路网络与空港系统。游戏支持高分辨率高清重制材质包与最多 255 名玩家同时在线联机。',
      officialWebsite: 'https://www.openttd.org',
      distributionPlatform: 'Steam / GOG / Official Website',
      priceType: 'OPEN_SOURCE',
      licenseType: 'GPLv2',
      version: '14.1',
      status: ResourceStatus.DRAFT,
    },
    {
      name: 'Battle for Wesnoth',
      slug: 'battle-for-wesnoth',
      englishName: 'The Battle for Wesnoth',
      developer: 'Wesnoth Community',
      publisher: 'Wesnoth Community',
      genre: '奇幻回合制战棋 (SLG)',
      supportedPlatforms: 'Windows 10/11, macOS, Linux, iOS, Android',
      summary: '高深度开源奇幻回合制战棋游戏，包含 16 部官方史诗战役与丰富的玩家自制模组',
      description: '《韦诺之战》(The Battle for Wesnoth) 是一款具备 20 年开源社区底蕴的奇幻策略战棋。包含人类、精灵、兽人、亡灵等 6 大核心阵营与数百种进阶兵种。游戏强调地形收益与战术克制，内置强大地图与剧情编辑器，支持全球玩家联机。',
      officialWebsite: 'https://www.wesnoth.org',
      distributionPlatform: 'Steam / Official Website / Itch.io',
      priceType: 'OPEN_SOURCE',
      licenseType: 'GPLv2',
      version: '1.18.2',
      status: ResourceStatus.DRAFT,
    },
    {
      name: 'Luanti (原 Minetest)',
      slug: 'luanti-minetest',
      englishName: 'Luanti',
      developer: 'Luanti Developers',
      publisher: 'Luanti Team',
      genre: '体素沙盒构建 / 游戏引擎',
      supportedPlatforms: 'Windows 10/11, macOS, Linux, Android',
      summary: '近无限体素沙盒构建与轻量化游戏引擎，支持 Lua 脚本深度扩展与无限可能',
      description: 'Luanti（原名 Minetest）是一款用 C++ 编写的高性能轻量体素沙盒游戏引擎。其特点是超轻量、低配置要求、原生支持海量 Lua Mod 与游戏包。玩家不仅可以自由挖掘建造，还可以直接体验由社区构建的 RPG、生存、空岛等多样化完整游戏体系。',
      officialWebsite: 'https://www.luanti.org',
      distributionPlatform: 'Official Website / GitHub Releases',
      priceType: 'OPEN_SOURCE',
      licenseType: 'LGPLv2.1',
      version: '5.10.0',
      status: ResourceStatus.DRAFT,
    },
  ];

  for (const game of candidateGames) {
    const { version, ...data } = game;
    const existing = await prisma.software.findUnique({ where: { slug: game.slug } });
    if (!existing) {
      const created = await prisma.software.create({
        data: {
          ...data,
          type: ResourceType.GAME,
          categoryId: gameCategory.id,
          aliases: '[]',
        },
      });

      // 创建初始版本
      await prisma.softwareVersion.create({
        data: {
          softwareId: created.id,
          version,
          platform: 'Windows 10/11',
          architecture: 'x64',
          fileSize: '约 100-800MB',
          releaseDate: '2024-2025',
          changelog: '官方开源稳定发行版',
          isLatest: true,
          reviewStatus: 'PENDING',
        },
      });

      console.log(`成功录入候选开源游戏: ${game.name} (DRAFT)`);
    } else {
      console.log(`候选游戏已存在: ${game.name}`);
    }
  }

  // 同时更新已有的 Mindustry 扩展字段
  await prisma.software.updateMany({
    where: { slug: 'mindustry' },
    data: {
      publisher: 'Anuken',
      genre: '塔防与自动化工厂建造',
      supportedPlatforms: 'Windows 10/11, macOS, Linux, Android, iOS',
      officialWebsite: 'https://mindustrygame.github.io',
      distributionPlatform: 'Steam / Itch.io / GitHub Releases',
      priceType: 'OPEN_SOURCE',
      licenseType: 'GPLv3',
    },
  });

  console.log('开源游戏候选录入完成');
}

seedGames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
