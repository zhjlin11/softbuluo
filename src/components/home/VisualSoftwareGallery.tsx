import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  Sparkles,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  X,
} from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface GalleryItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  version: string;
  imageUrl: string;
  caption: string;
  tag: string;
  tagColor: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'blender',
    name: 'Blender',
    slug: 'blender',
    categoryName: '图像与三维',
    version: 'v4.3.2',
    imageUrl: '/images/software/blender-screen-1.png',
    caption: 'Cycles 实时光线追踪视口渲染、节点着色器与全流程三维建模工作台',
    tag: '开源三维旗舰',
    tagColor: 'bg-amber-500 text-white',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    slug: 'vscode',
    categoryName: '编程开发',
    version: 'v1.99.2',
    imageUrl: '/images/software/vscode-screen-1.png',
    caption: '现代化极客代码编辑、智能集成终端与智能语法高亮工作区',
    tag: '极客开发标杆',
    tagColor: 'bg-blue-600 text-white',
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    slug: 'obs-studio',
    categoryName: '影音制作',
    version: 'v31.0.1',
    imageUrl: '/images/software/obs-studio-screen-1.png',
    caption: '行业级专业多通道音频混音器、多机位导播控制与超低延迟推流预设',
    tag: '专业导播录屏',
    tagColor: 'bg-purple-600 text-white',
  },
  {
    id: 'windows-11',
    name: 'Windows 11',
    slug: 'windows-11-consumer-24h2',
    categoryName: '操作系统',
    version: '24H2',
    imageUrl: '/images/software/windows-11-screen-1.png',
    caption: 'Fluent Design 居中任务栏开始菜单、多标签文件资源管理器与现代化系统体验',
    tag: '官方原版镜像',
    tagColor: 'bg-sky-600 text-white',
  },
  {
    id: 'peazip',
    name: 'PeaZip',
    slug: 'peazip',
    categoryName: '系统工具',
    version: 'v10.1.0',
    imageUrl: '/images/software/peazip-screen-1.png',
    caption: '现代化暗色高颜值压缩管理器、全格式归档解压与哈希完整性安全校验',
    tag: '开源解压神器',
    tagColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'wireshark',
    name: 'Wireshark',
    slug: 'wireshark',
    categoryName: '网络工具',
    version: 'v4.4.2',
    imageUrl: '/images/software/wireshark-screen-2.png',
    caption: '深度网络微秒级封包协议解析、抓包过滤流水线与全景通信时间线',
    tag: '网络封包诊断',
    tagColor: 'bg-indigo-600 text-white',
  },
];

export const VisualSoftwareGallery: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; caption: string } | null>(null);

  const current = GALLERY_ITEMS[activeIndex] || GALLERY_ITEMS[0];

  return (
    <section id="gallery" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 scroll-mt-20">
      <div className="bg-white dark:bg-[#141F33] rounded-2xl border border-[#E5E9F0] dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        {/* 顶部标题栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-5 border-b border-[#EDF0F4] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Image className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100">
                  热门软件实机画廊与视觉专题
                </h2>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                  真实 4K 实机抓图
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                原厂官方与开源社区高清视口实录，拒绝模糊宣传画，点进即可纵览真实 UI 与交互细节
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto font-mono">
            <span>收录 {GALLERY_ITEMS.length} 套核心视觉专题</span>
          </div>
        </div>

        {/* 核心主视觉画廊布局：左侧 16:9 特大主展示区 + 右侧 5 款缩略切换卡 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 左侧大图展位 (7 栏) */}
          <div className="lg:col-span-8 flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group">
            {/* 16:9 高清实机大图 */}
            <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
              <img
                src={current.imageUrl}
                alt={current.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103 cursor-pointer"
                onClick={() =>
                  setLightboxImg({
                    url: current.imageUrl,
                    title: current.name,
                    caption: current.caption,
                  })
                }
              />

              {/* 顶部标签 */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md ${current.tagColor}`}>
                  {current.tag}
                </span>
                <span className="text-[10px] font-mono bg-black/70 text-slate-200 px-2 py-0.5 rounded backdrop-blur-xs">
                  {current.version}
                </span>
              </div>

              {/* 右上角放大按钮 */}
              <button
                type="button"
                onClick={() =>
                  setLightboxImg({
                    url: current.imageUrl,
                    title: current.name,
                    caption: current.caption,
                  })
                }
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title="全屏查看超清原图"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* 底部渐变半透明信息栏 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <SoftwareIcon
                      name={current.name}
                      slug={current.slug}
                      size="md"
                      className="shrink-0 shadow-md"
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                        {current.name}
                      </h3>
                      <span className="text-[11px] text-slate-300 font-mono">
                        {current.categoryName} · 官方渠道原厂核验
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200/90 line-clamp-1 max-w-xl">
                    {current.caption}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/software/${current.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1258B5] rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <span>详情与下载</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧交互画廊缩略卡片网格 (4 栏) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-2.5">
            {GALLERY_ITEMS.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-[#E5E9F0] dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* 小缩略图 */}
                    <div className="w-14 h-10 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-200/60 dark:border-slate-700">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#202938] dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.version}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#667085] dark:text-slate-400 truncate block mt-0.5">
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                      isSelected
                        ? 'bg-[#1769D2] text-white'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSelected ? '正在预览' : '切换'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 全屏高清大图查看模态框 */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">{lightboxImg.title} 超清实机视口鉴赏</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-black/90 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.title}
                className="max-h-[72vh] max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span className="truncate">{lightboxImg.caption}</span>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">100% 官方正版视口采样</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
