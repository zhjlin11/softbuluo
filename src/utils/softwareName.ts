/**
 * 软件简写与纯净名称转换器
 * 过滤长串的“官方原版镜像/强力卸载工具/全功能开源神器”等冗长后缀
 * 呈现如同 App Store / 应用商店般纯净利落的软件品牌名称
 */
export function getSimpleSoftwareName(name: string, englishName?: string): string {
  if (!name) return '';

  const clean = name.trim();

  // 1. 微软操作系统与核心组件特判
  if (/^Windows\s+11/i.test(clean)) return 'Windows 11';
  if (/^Windows\s+(10\s*\/\s*11\s+)?(Enterprise\s+)?LTSC/i.test(clean)) return 'Windows LTSC';
  if (/^Windows\s+10/i.test(clean)) return 'Windows 10';
  if (/^Windows\s+7/i.test(clean)) return 'Windows 7 SP1';
  if (/^Windows\s+Server/i.test(clean)) return 'Windows Server';
  if (/^Windows\s+Terminal/i.test(clean)) return 'Windows Terminal';

  // 2. 微软 Office 全系列
  if (/^Microsoft\s+365/i.test(clean)) return 'Microsoft 365';
  if (/^Microsoft\s+Office\s+2024/i.test(clean)) return 'Office 2024';
  if (/^Microsoft\s+Office\s+2021/i.test(clean)) return 'Office 2021';
  if (/^Microsoft\s+Office\s+for\s+Mac/i.test(clean)) return 'Office for Mac';

  // 3. 常见开发与常用系统工具
  if (/^Visual\s+Studio\s+Code|^VS\s*Code/i.test(clean)) return 'VS Code';
  if (/^Sublime\s+Text/i.test(clean)) return 'Sublime Text';
  if (/^Notepad\+\+/i.test(clean)) return 'Notepad++';
  if (/^Docker\s+Desktop/i.test(clean)) return 'Docker Desktop';
  if (/^Google\s+Chrome/i.test(clean)) return 'Chrome';
  if (/^VLC/i.test(clean)) return 'VLC';
  if (/^Geek\s+Uninstaller/i.test(clean)) return 'Geek Uninstaller';
  if (/^AB\s+Download\s+Manager/i.test(clean)) return 'AB Download';
  if (/^Advanced\s+IP\s+Scanner/i.test(clean)) return 'Advanced IP Scanner';
  if (/^Angry\s+IP\s+Scanner/i.test(clean)) return 'Angry IP Scanner';
  if (/^AIDA64/i.test(clean)) return 'AIDA64 Extreme';
  if (/^Core\s+Temp/i.test(clean)) return 'Core Temp';
  if (/^CrystalDiskInfo/i.test(clean)) return 'CrystalDiskInfo';
  if (/^CrystalDiskMark/i.test(clean)) return 'CrystalDiskMark';
  if (/^TechPowerUp\s+GPU-Z|^GPU-Z/i.test(clean)) return 'GPU-Z';
  if (/^CPU-Z/i.test(clean)) return 'CPU-Z';
  if (/^HWiNFO/i.test(clean)) return 'HWiNFO64';
  if (/^Sysinternals\s+Autoruns/i.test(clean)) return 'Autoruns';
  if (/^Sysinternals\s+Process\s+Explorer/i.test(clean)) return 'Process Explorer';
  if (/^Sysinternals\s+TCPView/i.test(clean)) return 'TCPView';
  if (/^Go\s+语言/i.test(clean)) return 'Go (Golang)';
  if (/^Node\.js/i.test(clean)) return 'Node.js';
  if (/^Draw\.io/i.test(clean)) return 'Draw.io';
  if (/^ScreenToGif/i.test(clean)) return 'ScreenToGif';
  if (/^QuickLook/i.test(clean)) return 'QuickLook';
  if (/^FastCopy/i.test(clean)) return 'FastCopy';
  if (/^Shattered\s+Pixel\s+Dungeon/i.test(clean)) return '破碎的像素地牢';
  if (/^Luanti/i.test(clean)) return 'Luanti (Minetest)';
  if (/^Mindustry/i.test(clean)) return 'Mindustry';
  if (/^0\s*A\.D\./i.test(clean)) return '0 A.D.';
  if (/^Battle\s+for\s+Wesnoth/i.test(clean)) return 'Battle for Wesnoth';
  if (/^Warzone\s+2100/i.test(clean)) return 'Warzone 2100';
  if (/^Endless\s+Sky/i.test(clean)) return 'Endless Sky';
  if (/^OpenRA/i.test(clean)) return 'OpenRA';
  if (/^OpenTTD/i.test(clean)) return 'OpenTTD';
  if (/^SuperTuxKart/i.test(clean)) return 'SuperTuxKart';
  if (/^Mozilla\s+Thunderbird/i.test(clean)) return 'Thunderbird';
  if (/^Git\s+for\s+Windows/i.test(clean)) return 'Git';
  if (/^TortoiseGit/i.test(clean)) return 'TortoiseGit';

  // 4. 英文名称很短且不带说明的直接采用
  if (englishName && englishName.length < 20 && !/(genuine|installation|media|official|edition)/i.test(englishName)) {
    return englishName;
  }

  // 5. 通用中文解释剥离 (例如 "Bandizip 高颜值高速解压缩软件" -> "Bandizip")
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    const second = parts[1];
    // 包含两截英文品牌 (如 "OBS Studio", "Sublime Text")
    if (/^[A-Za-z0-9+#.-]+$/.test(first) && /^(Studio|Text|Desktop|Manager|Extreme|Pro|Uninstaller|Scanner|Temp|Plus|Player|Viewer)$/i.test(second)) {
      return `${first} ${second}`;
    }
    // 第二截是中文说明，则只保留首截英文名
    if (/[\u4e00-\u9fa5]/.test(second)) {
      return first;
    }
    // 首截如果是 "OBS" "7-Zip" 等
    if (/^[A-Za-z0-9+#.-]+$/.test(first) && parts.length > 2 && /[\u4e00-\u9fa5]/.test(parts[2])) {
      return `${first} ${second}`;
    }
  }

  // 兜底返回截取的前 15 个字或直接原名
  return clean.split(/\s+/)[0];
}

/**
 * 软件版本号精简化
 * 剔除“完整离线镜像 (x32/x64 简体中文)”等长后缀，保留简洁的版本标识 (如 24H2 / 2024 / v1.5.4)
 */
export function getSimpleVersion(version?: string): string {
  if (!version) return '';
  let v = version.trim();

  // 避免出现 vv1.5.4 等重复前缀
  if (v.startsWith('v') || v.startsWith('V')) {
    v = v.slice(1).trim();
  }

  // 1. 常见系统版本标记
  if (/24H2/i.test(v)) return '24H2';
  if (/23H2/i.test(v)) return '23H2';
  if (/22H2/i.test(v)) return '22H2';
  if (/21H2/i.test(v)) return '21H2';
  if (/SP1/i.test(v)) return 'SP1';
  if (/2025/i.test(v)) return '2025';
  if (/2024/i.test(v)) return '2024';
  if (/2021/i.test(v)) return '2021';
  if (/2019/i.test(v)) return '2019';
  if (/2016/i.test(v)) return '2016';
  if (/365/i.test(v)) return 'M365';

  // 2. 匹配标准三段式/四段式软件版本号 (如 1.5.4, 1.99.218, 132.0.6834)
  const semverMatch = v.match(/\d+(\.\d+){1,3}(-\w+)?/);
  if (semverMatch) {
    return `v${semverMatch[0]}`;
  }

  // 3. 匹配构建号 (如 Build 4180)
  const buildMatch = v.match(/Build\s+\d+/i);
  if (buildMatch) {
    return buildMatch[0];
  }

  // 4. 去除括号和中文说明后提取首个词
  const firstToken = v.split(/[\s(（]/)[0];
  if (firstToken && firstToken.length <= 10) {
    return firstToken.startsWith('v') ? firstToken : `v${firstToken}`;
  }

  return v.length > 8 ? v.slice(0, 8) : v;
}

