import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import { GrowthService, SoftwareAlternativeItem } from '../../services/growthService';
import { SoftwareIcon } from './SoftwareIcon';
import { getSimpleSoftwareName } from '../../utils/softwareName';

interface Props {
  softwareId: string;
  softwareSlug: string;
  softwareName: string;
}

export const ResourceReviewsAndAlternatives: React.FC<Props> = ({
  softwareId,
  softwareSlug,
  softwareName,
}) => {
  // 替代方案状态
  const [alternatives, setAlternatives] = useState<SoftwareAlternativeItem[]>([]);

  // 纠错报错模态框 (保留失效链接与信息纠错上报，不展示用户评价打分)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionType, setCorrectionType] = useState('BROKEN_LINK');
  const [correctionDetails, setCorrectionDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null);

  // 加载替代方案数据
  useEffect(() => {
    GrowthService.getSoftwareAlternatives(softwareSlug)
      .then((res) => {
        if (res.success && res.data) {
          setAlternatives(res.data);
        }
      })
      .catch(console.error);
  }, [softwareSlug]);

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCorrection(true);
    setCorrectionFeedback(null);

    try {
      const res = await GrowthService.submitCorrection(softwareId, {
        correctionType,
        details: correctionDetails,
        contactEmail,
      });

      if (res.success) {
        setCorrectionFeedback('感谢您的纠错反馈！编辑团队将尽快复核更新。');
        setCorrectionDetails('');
        setTimeout(() => {
          setShowCorrectionModal(false);
          setCorrectionFeedback(null);
        }, 1500);
      } else {
        setCorrectionFeedback(res.error || '反馈提交失败');
      }
    } catch (err: any) {
      setCorrectionFeedback(err.message || '请求失败');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const relationLabels: Record<string, { label: string; color: string }> = {
    FREE_ALTERNATIVE: { label: '免费替代方案', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    OPEN_SOURCE_ALTERNATIVE: { label: '自由开源替代', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    LIGHTWEIGHT_OPTION: { label: '轻量低开销选择', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    CROSS_PLATFORM: { label: '多平台兼容方案', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    SIMILAR_FUNCTION: { label: '同类功能参考', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  };

  return (
    <div className="mt-8 space-y-6">
      {/* 软件替代品与类似方案关联模块 */}
      {alternatives.length > 0 && (
        <section className="bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {softwareName} 的替代方案与类似软件
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                title="发现下载失效或信息错误时反馈"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>报告失效与纠错</span>
              </button>
              <Link
                to="/compare"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看深度横向对比评测
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-3">
                      <SoftwareIcon
                        iconUrl={alt.alternative.iconUrl}
                        name={alt.alternative.name}
                        slug={alt.alternative.slug}
                        size="md"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          <Link to={`/software/${alt.alternative.slug}`} className="hover:text-blue-600">
                            {getSimpleSoftwareName(alt.alternative.name)}
                          </Link>
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {alt.alternative.latestVersion ? `最新版本 v${alt.alternative.latestVersion}` : '官方渠道已核验'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${relationLabels[alt.relationType]?.color || 'bg-slate-100 text-slate-700'}`}>
                      {relationLabels[alt.relationType]?.label || '同类推荐'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200">推荐理由：</strong>
                    {alt.reason}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">{alt.alternative.summary?.slice(0, 36)}...</span>
                  <Link
                    to={`/software/${alt.alternative.slug}`}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    前往查看 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 如果没有替代方案，仍提供轻量的纠错入口 */}
      {alternatives.length === 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>发现链接失效或版本有误？向编辑部反馈纠错</span>
          </button>
        </div>
      )}

      {/* 纠错反馈模态框 */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              向编辑团队反馈纠错
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              发现下载链接失效、官方已有新版本或信息参数有误？请告诉我们。
            </p>

            {correctionFeedback && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs">
                {correctionFeedback}
              </div>
            )}

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  问题类型
                </label>
                <select
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="BROKEN_LINK">下载链接失效 / 404 / 无法打开</option>
                  <option value="OUTDATED_VERSION">官方已有更新的正式版本</option>
                  <option value="WRONG_INFO">软件描述、开发商或授权信息有误</option>
                  <option value="SECURITY_ISSUE">存在潜在安全告警或哈希不符</option>
                  <option value="OTHER">其他优化建议</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  详细情况描述
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="请提供失效链接、官方最新版本号或正确的参考页面地址..."
                  value={correctionDetails}
                  onChange={(e) => setCorrectionDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  您的联系邮箱 (选填，便于核实后同步您)
                </label>
                <input
                  type="email"
                  placeholder="your-email@domain.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-5 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCorrection ? '提交中...' : '提交纠错反馈'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
