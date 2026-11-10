import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ExternalLink,
  Download,
  Calendar,
  User,
  HardDrive,
  Cpu,
  Layers,
  ArrowLeft,
  Copy,
  Check,
  FileCode,
  Share2,
  Clock,
  Sparkles,
  Bookmark,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { getResourceDetail } from '../services/resourceService';
import { authorizeDownload } from '../services/commerceService';
import { BookmarkService } from '../services/bookmarkService';
import { SoftwareItem, DownloadSource } from '../types/resource';
import { ErrorState } from '../components/common/ErrorState';
import { SoftwareIcon } from '../components/common/SoftwareIcon';
import { ResourceReviewsAndAlternatives } from '../components/common/ResourceReviewsAndAlternatives';
import { SoftwareScreenshotGallery } from '../components/common/SoftwareScreenshotGallery';
import { SoftwareDetailSidebar } from '../components/common/SoftwareDetailSidebar';
import { getResourceScreenshots } from '../config/screenshots';

function getSourceActionInfo(ds?: DownloadSource | null) {
  if (!ds || ds.sourceType === 'UNAVAILABLE' || ds.verificationStatus === 'FAILED' || ds.verificationStatus === 'DISABLED') {
    return {
      buttonText: '暂无可用下载',
      badgeText: '渠道不可用',
      descText: '当前下载源暂不可用或已失效，请使用其他已核验来源',
      isDisabled: true,
      isDirect: false,
    };
  }
  if (ds.sourceType === 'OFFICIAL_DIRECT') {
    return {
      buttonText: '立即下载',
      badgeText: '官方安装包直链',
      descText: ds.fileName ? `直接下载原厂安装文件：${ds.fileName}` : '官方服务器直接安装包链接 · 一键触发下载',
      isDisabled: false,
      isDirect: true,
    };
  }
  if (ds.sourceType === 'OFFICIAL_RELEASE') {
    return {
      buttonText: '立即下载',
      badgeText: '官方 Release 资产',
      descText: ds.fileName ? `官方发行版资产包：${ds.fileName}` : '来自开发者官方 Release 正式编译附件',
      isDisabled: false,
      isDirect: true,
    };
  }
  if (ds.sourceType === 'AUTHORIZED_MIRROR') {
    const approved = ds.mirrorAuthorizationStatus === 'APPROVED';
    return {
      buttonText: approved ? '本站下载' : '镜像待授权',
      badgeText: approved ? '本站授权高速镜像' : '未获授权',
      descText: approved ? '已获合法授权与哈希校验，本站受控高速直传' : '该镜像尚未通过官方授权审查，暂不开放下载',
      isDisabled: !approved,
      isDirect: approved,
    };
  }
  if (ds.sourceType === 'LICENSED_HOSTED') {
    return {
      buttonText: '专线极速下载',
      badgeText: '站内加速专线',
      descText: '软游部落专属高带宽 CDN 加速分发通道',
      isDisabled: false,
      isDirect: false,
    };
  }
  return {
    buttonText: '前往官方下载',
    badgeText: '官方下载页面',
    descText: '官方提供网页引导选择平台版本，点击跳转至官网下载页',
    isDisabled: false,
    isDirect: false,
  };
}

export const ResourceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [resource, setResource] = useState<(SoftwareItem & { historyVersions?: any[]; viewCount?: number }) | null>(null);
  const [related, setRelated] = useState<SoftwareItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [bookmarkId, setBookmarkId] = useState<string | undefined>(undefined);
  const [isBookmarking, setIsBookmarking] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [downloadStatus, setDownloadStatus] = useState<{ state: 'idle' | 'preparing' | 'started' | 'error'; message?: string }>({
    state: 'idle',
  });

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    getResourceDetail(slug)
      .then((data) => {
        setResource(data.resource);
        setRelated(data.related || []);

        // 检查当前登录用户是否已收藏
        BookmarkService.checkIsBookmarked(data.resource.id).then((b) => {
          setIsBookmarked(b.isBookmarked);
          setBookmarkId(b.bookmarkId);
        });

        // 动态更新页面 SEO Title 与 Meta
        document.title = `${data.resource.name} 官方正版下载 - 软游部落`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', `${data.resource.name} 最新版本 v${data.resource.latestVersion?.version} 官方下载渠道。${data.resource.summary}`);
        }

        // 注入 Schema.org SoftwareApplication JSON-LD
        let script = document.getElementById('software-jsonld') as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = 'software-jsonld';
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': data.resource.name,
          'operatingSystem': 'Windows 10, Windows 11',
          'applicationCategory': data.resource.categoryName,
          'softwareVersion': data.resource.latestVersion?.version,
          'author': {
            '@type': 'Organization',
            'name': data.resource.developer,
          },
          'description': data.resource.summary,
        });
      })
      .catch((err) => {
        setError(err.message || '资源加载失败');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      document.title = '软游部落 - 发现好软件，畅玩好游戏';
    };
  }, [slug]);

  const handleDownload = async (source: any) => {
    if (!resource || !source) return;
    const actionInfo = getSourceActionInfo(source);
    if (actionInfo.isDisabled) {
      setDownloadStatus({ state: 'error', message: '该下载源当前不可用，请选用下方其他已核验来源。' });
      return;
    }

    // 兼容历史 VIP 专属加速通道 (LICENSED_HOSTED)
    if (source.sourceType === 'LICENSED_HOSTED') {
      try {
        setDownloadStatus({ state: 'preparing', message: '正在验证高带宽授权令牌...' });
        const auth = await authorizeDownload(resource.id, source.id);
        if (auth.authorized && auth.downloadUrl) {
          setDownloadStatus({ state: 'started', message: '授权通过，正在拉起下载流...' });
          window.location.assign(auth.downloadUrl);
        } else if (auth.directUrl) {
          setDownloadStatus({ state: 'started', message: '已跳转至授权下载源...' });
          window.open(auth.directUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (err: any) {
        setDownloadStatus({ state: 'error', message: err.message || '获取下载授权失败' });
        if (err.code === 'MEMBER_UNAUTHORIZED') {
          alert('下载站内专属高速资源，请先登录会员账号');
        } else if (err.code === 'ENTITLEMENT_REQUIRED') {
          if (window.confirm('该专属资源需要 VIP 会员或单独购买下载授权，是否前往会员中心选购？')) {
            window.location.href = '/membership';
          }
        }
      }
      return;
    }

    const startUrl = source.startDownloadUrl || `/api/v1/downloads/start/${source.id}`;

    // P8.8 直接安装包流（官方直链 / 官方 Release 资产 / 授权镜像）：在受控入口直接发起下载
    if (
      source.sourceType === 'OFFICIAL_DIRECT' ||
      source.sourceType === 'OFFICIAL_RELEASE' ||
      source.sourceType === 'AUTHORIZED_MIRROR'
    ) {
      setDownloadStatus({
        state: 'started',
        message: `正在准备下载${source.fileName ? `：${source.fileName}` : ''}... 若浏览器未自动拉起下载，请点击下方备用直链。`,
      });
      const anchor = document.createElement('a');
      anchor.href = startUrl;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return;
    }

    // 外部官方下载页面（仅提供网页入口，绝不伪装成一键直链）
    setDownloadStatus({
      state: 'started',
      message: '已为您打开官方下载页面，请在官方网页确认对应系统版本与架构后下载。',
    });
    window.open(startUrl, '_blank', 'noopener,noreferrer');
  };

  const copySha256 = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleToggleBookmark = async () => {
    if (!resource) return;
    setIsBookmarking(true);
    try {
      if (isBookmarked && bookmarkId) {
        const res = await BookmarkService.removeBookmark(bookmarkId);
        if (res.success) {
          setIsBookmarked(false);
          setBookmarkId(undefined);
        } else {
          alert(res.message || '取消收藏失败');
        }
      } else {
        const res = await BookmarkService.addBookmark('SOFTWARE', resource.id);
        if (res.success) {
          setIsBookmarked(true);
          const check = await BookmarkService.checkIsBookmarked(resource.id);
          setBookmarkId(check.bookmarkId);
        } else {
          alert(res.message || '请先登录会员账号后收藏');
        }
      }
    } catch {
      alert('请先登录会员账号后收藏');
    } finally {
      setIsBookmarking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-24 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#1769D2] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">正在加载软件详情档案...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16">
        <ErrorState
          message={error || '未找到对应软件资源，该资源可能已被下架或链接已失效。'}
          onRetry={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  const latestVer = resource.latestVersion;
  const allSources: DownloadSource[] = latestVer?.downloadSources || [];
  const filteredSources =
    selectedPlatform === 'all'
      ? allSources
      : allSources.filter((s) => `${s.platform || 'windows'}/${s.architecture || 'x64'}` === selectedPlatform);
  const primarySource = filteredSources[0] || allSources[0];
  const primaryActionInfo = getSourceActionInfo(primarySource);
  const sha256 = primarySource?.sha256 || primarySource?.fileSha256 || resource.fileSha256 || null;
  const screenshots = getResourceScreenshots(resource.slug);

  // 提取多平台与多架构选项
  const platformOptions = Array.from(
    new Set(allSources.map((s) => `${s.platform || 'windows'}/${s.architecture || 'x64'}`))
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-16">
      {/* 门户紧凑面包屑导航 */}
      <nav aria-label="面包屑" className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
        <Link to="/" className="hover:text-[#1769D2] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>首页</span>
        </Link>
        <span>/</span>
        <Link to={`/?category=${resource.categorySlug}`} className="hover:text-[#1769D2] text-slate-600 dark:text-slate-400">
          {resource.categoryName}
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#202938] dark:text-slate-200">{resource.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* 左侧主体内容区 (宽屏占据约 72%) */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* 软件主信息卡片 (专业门户信息密度，克制阴影) */}
          <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-[#EDF0F4] dark:border-slate-800">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <SoftwareIcon
              iconUrl={resource.iconUrl}
              name={resource.name}
              slug={resource.slug}
              categorySlug={resource.categorySlug}
              size="2xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#202938] dark:text-slate-50">
                  {resource.name}
                </h1>
                <span className="text-xs text-[#667085] dark:text-slate-400">
                  {resource.englishName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#667085] dark:text-slate-400 mb-2">
                <span>{resource.categoryName}</span>
                <span>·</span>
                <span className="font-mono">版本 v{latestVer?.version}</span>
                <span>·</span>
                <span className="text-[#1769D2] dark:text-blue-400 font-semibold">{resource.licenseLabel}</span>
                <span>·</span>
                <span>累计安全获取 {resource.downloadCount.toLocaleString()} 次</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded font-medium border border-emerald-200/60 dark:border-emerald-900/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{resource.sourceVerified ? '官方来源已核验' : '来源待人工核验'}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border text-xs ${
                  resource.scanStatus === 'CLEAN'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>{resource.scanStatus === 'CLEAN' ? '安全无毒认证 (已扫描)' : '未执行病毒扫描 (仅核验官方来源)'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                  <span>签名: {resource.signatureStatus === 'VALID' ? '有效数字签名' : resource.signatureStatus === 'UNSIGNED' ? '原厂无签名' : '尚未检测'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 顶部右侧直达主按钮 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            {primarySource ? (
              <button
                id="primary-download-btn"
                type="button"
                disabled={primaryActionInfo.isDisabled}
                onClick={() => handleDownload(primarySource)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-md shadow-2xs transition-all text-xs sm:text-sm ${
                  primaryActionInfo.isDisabled
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1769D2] hover:bg-[#1258B5] text-white cursor-pointer'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{primaryActionInfo.buttonText}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 font-semibold rounded-md text-xs sm:text-sm cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>暂无可用下载</span>
              </button>
            )}
            <a
              href={resource.officialSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-md transition-colors text-xs cursor-pointer"
            >
              <span>开发者官网</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* 收藏 / 已收藏 按钮 */}
            <button
              onClick={handleToggleBookmark}
              disabled={isBookmarking}
              title={isBookmarked ? '点击取消收藏' : '收藏此软件'}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md transition-colors text-xs font-medium cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-500' : ''}`} />
              <span>{isBookmarked ? '已收藏' : '收藏'}</span>
            </button>
          </div>
        </div>

        {/* 6 栏规格参数矩阵 (借鉴高利用率参数矩阵，规整清爽) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-5 border-b border-[#EDF0F4] dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>开发方 / 著作权</span>
            </div>
            <div className="font-semibold text-[#202938] dark:text-slate-200 truncate" title={resource.developer}>
              {resource.developer}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>发布 / 更新日期</span>
            </div>
            <div className="font-semibold text-[#202938] dark:text-slate-200 tabular-nums">
              {latestVer?.releaseDate || '2025-01-20'}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span>安装包体积</span>
            </div>
            <div className="font-semibold text-[#202938] dark:text-slate-200 tabular-nums">
              {latestVer?.fileSize || '原厂原包'}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>适用操作系统</span>
            </div>
            <div className="font-semibold text-[#202938] dark:text-slate-200 truncate" title={latestVer?.platform?.join(' / ')}>
              {latestVer?.platform?.join(' / ') || 'Windows 10/11 64位'}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-rose-500" />
              <span>授权协议类型</span>
            </div>
            <div className="font-semibold text-[#1769D2] dark:text-blue-400 truncate">
              {resource.licenseLabel || '开源 / 免费正版'}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div className="text-slate-400 mb-1 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-teal-500" />
              <span>数字签名状态</span>
            </div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
              {resource.signatureStatus === 'VALID'
                ? '有效官方签名'
                : resource.signatureStatus === 'UNSIGNED'
                ? '原厂纯净无签名'
                : '人工已核验'}
            </div>
          </div>
        </div>

        {/* SHA-256 安全完整性指纹认证盒 (只展示真实已收录哈希，不造假) */}
        <div className="py-3 px-4 bg-slate-50/90 dark:bg-[#0F172A]/70 rounded-lg mt-5 border border-slate-200 dark:border-slate-800/80">
          {sha256 ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1769D2]/10 dark:bg-blue-900/40 text-[#1769D2] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  算法 SHA-256
                </span>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                  原厂安装包哈希指纹:
                </span>
                <code className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] break-all select-all shadow-2xs">
                  {sha256}
                </code>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <span className="text-[11px] text-slate-400 hidden xl:inline">
                  支持 CertUtil / PowerShell 原厂哈希校验
                </span>
                <button
                  type="button"
                  onClick={() => copySha256(sha256)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded text-xs font-semibold text-[#1769D2] dark:text-blue-400 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedSha ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">已复制哈希值</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制 SHA-256</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  SHA-256 待核验
                </span>
                <span>该源直接指向原厂发行渠道（暂未收录离线二进制 SHA-256 哈希，安装时请核查发布者数字签名证书）。</span>
              </div>
            </div>
          )}
        </div>

        {/* 实机运行截图与界面大图预览画廊 (高清原图 + 沉浸式 Lightbox) */}
        {screenshots.length > 0 && (
          <div className="mt-7 pt-6 border-t border-[#EDF0F4] dark:border-slate-800">
            <SoftwareScreenshotGallery
              screenshots={screenshots}
              softwareName={resource.name}
            />
          </div>
        )}

        {/* 软件介绍与更新详情 */}
        <div className="mt-7 space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#202938] dark:text-slate-100 mb-2.5">
              功能与使用概览
            </h2>
            <p className="text-xs sm:text-sm text-[#202938] dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {resource.description}
            </p>
          </div>

          {latestVer?.changelog && (
            <div>
              <h2 className="text-base font-bold text-[#202938] dark:text-slate-100 mb-2">
                最新版本更新日志 (v{latestVer.version})
              </h2>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                {latestVer.changelog}
              </div>
            </div>
          )}

          {/* 官方下载通道列表 */}
          <div id="download-channels">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-bold text-[#202938] dark:text-slate-100 flex items-center gap-2">
                <span>官方正规下载通道</span>
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                  受控安全分发 · 原厂零捆绑
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                支持主流浏览器直接下载与断点续传
              </span>
            </div>

            {/* 平台与架构选择器（当存在多个平台/架构时展示） */}
            {platformOptions.length > 1 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">选择目标平台:</span>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedPlatform === 'all'
                      ? 'bg-[#1769D2] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  全部平台 ({allSources.length})
                </button>
                {platformOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedPlatform(opt)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      selectedPlatform === opt
                        ? 'bg-[#1769D2] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* 下载状态交互反馈条 */}
            {downloadStatus.state !== 'idle' && (
              <div
                className={`mb-3 p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  downloadStatus.state === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#1769D2] dark:text-blue-300'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{downloadStatus.message}</span>
              </div>
            )}

            {/* 通道列表渲染 */}
            {filteredSources.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500">
                当前未找到可用的合规下载源，请联系管理员进行渠道巡检。
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSources.map((ds: DownloadSource) => {
                  const info = getSourceActionInfo(ds);
                  return (
                    <div
                      key={ds.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#10192A] rounded-lg border border-[#E5E9F0] dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600/60 transition-all gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#1769D2] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {ds.label || '官方正规获取源'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                info.isDirect
                                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50'
                                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                              }`}
                            >
                              {info.badgeText}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {(ds.platform || 'windows').toUpperCase()} / {(ds.architecture || 'x64').toUpperCase()}
                            </span>
                            {ds.fileSizeLabel && (
                              <span className="text-[10px] text-slate-400 font-mono">{ds.fileSizeLabel}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {info.descText}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={info.isDisabled}
                        onClick={() => handleDownload(ds)}
                        className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-xs font-semibold transition-all shadow-2xs shrink-0 ${
                          info.isDisabled
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-[#1769D2] hover:bg-[#1258B5] text-white cursor-pointer'
                        }`}
                      >
                        <span>{info.buttonText}</span>
                        {info.isDirect ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 纯净下载安全承诺警示条 */}
            <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">软游部落绿色下载守则：</span>
                本站所有资源均严禁伪装为“高速下载器”或诱导安装无关全家桶插件。下载后建议使用上方 SHA-256 完整性指纹或数字签名进行原厂校验。
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 软件同类与升级替代方案关联模块 */}
      {resource && (
        <ResourceReviewsAndAlternatives
          softwareId={resource.id}
          softwareSlug={resource.slug}
          softwareName={resource.name}
        />
      )}

          {/* 同分类其他推荐 */}
          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-bold text-[#202938] dark:text-slate-100 mb-3.5">
                同分类其他软件推荐
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/software/${item.slug}`}
                    className="p-3.5 bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 hover:border-blue-400 transition-all group flex flex-col justify-between hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <SoftwareIcon
                          iconUrl={item.iconUrl}
                          name={item.name}
                          slug={item.slug}
                          categorySlug={item.categorySlug}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-bold text-[#202938] dark:text-slate-100 truncate group-hover:text-[#1769D2] transition-colors">
                            {item.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.developer}</div>
                          <div className="text-[10px] text-[#1769D2] dark:text-blue-400 font-mono mt-0.5">
                            v{item.latestVersion?.version}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2.5 mt-2.5 border-t border-[#EDF0F4] dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-[#1769D2] dark:text-blue-400 font-medium">查看详情 →</span>
                      <span className="text-slate-400 font-mono">v{item.latestVersion?.version}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 右侧热门推荐、广告推广与装机必备侧边栏 (宽屏 320px ~ 340px) */}
        <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0">
          <SoftwareDetailSidebar currentSlug={resource.slug} />
        </div>
      </div>
    </div>
  );
};
