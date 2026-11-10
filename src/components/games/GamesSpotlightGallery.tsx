import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Gamepad2,
  Info,
  Maximize2,
  Monitor,
  ShieldCheck,
  X,
} from 'lucide-react';
import { GamePortalItem } from '../../services/channelService';
import { formatLicenseLabel, getSimpleSoftwareName, getSimpleVersion } from '../software/softwareHelpers';

interface GamesSpotlightGalleryProps {
  games: GamePortalItem[];
}

export const GamesSpotlightGallery: React.FC<GamesSpotlightGalleryProps> = ({ games }) => {
  const [activeScreenIdx, setActiveScreenIdx] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  if (!games || games.length === 0) return null;

  return (
    <section aria-label="精选游戏实机截图鉴赏" className="space-y-4 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#1769D2]" />
            实机画面与正版渠道精选
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            点击下方实机缩略图切换高清画面，明确区分官方下载页、开源直链与正规数字商店入口。
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          实有公开精选 {games.length} 款
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {games.map((game) => {
          const idx = activeScreenIdx[game.slug] || 0;
          const activeImg = game.gallery[idx] || game.heroImageUrl || game.coverUrl;
          const versionText = getSimpleVersion(game.latestVersion || undefined);
          const lic = formatLicenseLabel(game.licenseType);

          return (
            <article
              key={game.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/70 transition-all flex flex-col justify-between"
            >
              <div>
                {/* 16:9 实机大图与切换控制 */}
                <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden group">
                  <img
                    src={activeImg}
                    alt={`${getSimpleSoftwareName(game.name)} 实机画面`}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] cursor-pointer"
                    onClick={() =>
                      setLightbox({ url: activeImg, title: getSimpleSoftwareName(game.name) })
                    }
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/85 to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-xs text-white text-[11px] font-semibold border border-white/15">
                      {game.genreName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        lic.tone === 'oss'
                          ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
                          : 'bg-blue-950/85 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      {game.licenseType || lic.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label={`放大查看 ${getSimpleSoftwareName(game.name)} 截图`}
                    onClick={() =>
                      setLightbox({ url: activeImg, title: getSimpleSoftwareName(game.name) })
                    }
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-white flex items-center justify-center border border-white/15 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {game.gallery.length > 1 && (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {game.gallery.slice(0, 3).map((shotUrl, sIdx) => (
                          <button
                            key={shotUrl}
                            type="button"
                            aria-label={`切换截图 ${sIdx + 1}`}
                            onClick={() =>
                              setActiveScreenIdx((prev) => ({ ...prev, [game.slug]: sIdx }))
                            }
                            className={`w-14 h-8 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                              sIdx === idx
                                ? 'border-blue-400 scale-105 shadow-xs'
                                : 'border-white/40 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={shotUrl}
                              alt=""
                              width={56}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-200 bg-slate-950/65 px-2 py-0.5 rounded-md tabular-nums">
                        {idx + 1} / {Math.min(3, game.gallery.length)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 游戏元信息与真实分发标签 */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        <Link
                          to={`/game/${game.slug}`}
                          className="hover:text-[#1769D2] transition-colors"
                        >
                          {game.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        开发团队：{game.developer || '开源社区'}
                        {versionText ? ` · 最新版本 ${versionText}` : ''}
                        {game.fileSize ? ` · ${game.fileSize}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {game.summary}
                  </p>

                  {/* 平台芯片 + 正规渠道芯片 */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#F5F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {game.platformsList.slice(0, 4).join(' / ')}
                    </span>
                    {game.distributionChannels.map((ch) => (
                      <span
                        key={ch}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1769D2] dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  {/* 诚实来源校验提示条 */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      game.verifiedSha256Count > 0 && game.approvedHealthyCount > 0
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      {game.verifiedSha256Count > 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[#1769D2] shrink-0" />
                      )}
                      <span className="truncate">{game.deliveryLabel}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                      浏览 {game.viewCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {game.officialWebsite ? (
                  <a
                    href={game.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-[#1769D2] font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    官方主页
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">开源发行通道</span>
                )}

                <Link
                  to={`/game/${game.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  获取游戏与详情
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* 高清实机画册放大弹窗 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">{lightbox.title} · 高清实机画面</span>
              <button
                type="button"
                aria-label="关闭大图预览"
                onClick={() => setLightbox(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightbox.url}
              alt={lightbox.title}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </section>
  );
};
