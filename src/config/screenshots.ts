/**
 * 软游部落官方实机截图与高清画廊配置
 * 所有截图均采自原厂官方渠道或开源社区公共领域授权，杜绝模糊与广告水印
 */

export interface ScreenshotItem {
  url: string;
  caption: string;
  isCover?: boolean;
}

export const SOFTWARE_SCREENSHOTS: Record<string, ScreenshotItem[]> = {
  vscode: [
    {
      url: '/images/software/vscode-screen-1.png',
      caption: 'Visual Studio Code 现代化代码编辑与调试工作区',
      isCover: true,
    },
    {
      url: '/images/software/vscode-screen-2.png',
      caption: '内置智能终端、Git 变更与语言服务器协同工作流',
      isCover: false,
    },
  ],
  blender: [
    {
      url: '/images/software/blender-screen-1.png',
      caption: 'Blender 4.x Cycles 实时光线追踪视口与材质着色器',
      isCover: true,
    },
    {
      url: '/images/software/blender-screen-2.png',
      caption: '几何节点 (Geometry Nodes) 与全流程三维建模工作台',
      isCover: false,
    },
  ],
  'obs-studio': [
    {
      url: '/images/software/obs-studio-screen-1.png',
      caption: 'OBS Studio 行业级多通道音频混音器与导播台控制',
      isCover: true,
    },
    {
      url: '/images/software/obs-studio-screen-2.png',
      caption: 'Windows 11 多场景无缝平滑转场与低延迟推流预设',
      isCover: false,
    },
  ],
  'windows-11': [
    {
      url: '/images/software/windows-11-screen-1.png',
      caption: 'Windows 11 Fluent Design 现代化桌面居中开始菜单与文件资源管理器',
      isCover: true,
    },
  ],
  chrome: [
    {
      url: '/images/software/chrome-screen-1.png',
      caption: 'Google Chrome 极速 Blink 内核与多标签组高效浏览界面',
      isCover: true,
    },
  ],
  '7zip': [
    {
      url: '/images/software/7zip-screen-1.png',
      caption: '7-Zip 高压缩比文件管理器与 LZMA 算法基准测试',
      isCover: true,
    },
  ],
  peazip: [
    {
      url: '/images/software/peazip-screen-1.png',
      caption: 'PeaZip 暗色模式现代化压缩包解压与加密管理',
      isCover: true,
    },
    {
      url: '/images/software/peazip-screen-2.png',
      caption: '全能算法极限压缩率对比与文件完整性哈希校验',
      isCover: false,
    },
  ],
  rufus: [
    {
      url: '/images/software/rufus-screen-1.png',
      caption: 'Rufus 官方纯净系统启动 U 盘制作与写入配置主面板',
      isCover: true,
    },
  ],
  wireshark: [
    {
      url: '/images/software/wireshark-screen-2.png',
      caption: 'Wireshark 深度网络封包协议解析与抓包时间线',
      isCover: true,
    },
  ],
  filezilla: [
    {
      url: '/images/software/filezilla-screen-1.png',
      caption: 'FileZilla 跨平台 FTP/SFTP 双栏本地与远程高速传输',
      isCover: true,
    },
  ],
  'sublime-text': [
    {
      url: '/images/software/sublime-text-screen-1.png',
      caption: 'Sublime Text 4 毫秒级极速响应与现代化代码排版',
      isCover: true,
    },
  ],
  vlc: [
    {
      url: '/images/software/vlc-screen-1.png',
      caption: 'VLC Media Player 4K 全格式解码与纯净流媒体播放',
      isCover: true,
    },
  ],
  git: [
    {
      url: '/images/software/git-screen-1.png',
      caption: 'Git for Windows 图形化分支树与差异比对面板',
      isCover: true,
    },
  ],
  'office-2024': [
    {
      url: '/images/software/office-screen-1.png',
      caption: 'Microsoft Office 2024 专业增强版经典单机原厂套件',
      isCover: true,
    },
  ],
  'office-2021': [
    {
      url: '/images/software/office-screen-1.png',
      caption: 'Microsoft Office 2021 专业增强版办公排版环境',
      isCover: true,
    },
  ],
  'microsoft-365': [
    {
      url: '/images/software/office-screen-1.png',
      caption: 'Microsoft 365 智能云端协作与现代生产力套件',
      isCover: true,
    },
  ],
};

export const GAME_SCREENSHOTS: Record<string, ScreenshotItem[]> = {
  mindustry: [
    {
      url: '/images/games/mindustry-screen-1.jpg',
      caption: '宏大工业流水线建造与资源传送网络',
      isCover: true,
    },
    {
      url: '/images/games/mindustry-screen-2.jpg',
      caption: '多兵种机甲塔防与敌潮密集防御战',
      isCover: false,
    },
    {
      url: '/images/games/mindustry-screen-3.jpg',
      caption: '深空科技树研究与高阶自动化开采',
      isCover: false,
    },
  ],
  supertuxkart: [
    {
      url: '/images/games/supertuxkart-screen-1.jpg',
      caption: '3D 奇幻赛道极速漂移与卡丁车竞速',
      isCover: true,
    },
    {
      url: '/images/games/supertuxkart-screen-2.jpg',
      caption: '全能道具大奖赛多人联机对决',
      isCover: false,
    },
  ],
};

/**
 * 获取指定软件或游戏的截图列表
 */
export function getResourceScreenshots(slug: string): ScreenshotItem[] {
  if (SOFTWARE_SCREENSHOTS[slug]) {
    return SOFTWARE_SCREENSHOTS[slug];
  }
  if (GAME_SCREENSHOTS[slug]) {
    return GAME_SCREENSHOTS[slug];
  }
  return [];
}
