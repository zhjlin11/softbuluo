import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  ShieldCheck,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PackagePlus,
  Key,
  Copy,
  Check,
  Loader2,
  Layers
} from 'lucide-react';
import {
  getDeveloperProfile,
  createDeveloperClaim,
  verifyDeveloperClaim,
  submitDeveloperSoftware
} from '../services/developerService';

export const DeveloperDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 认领表单
  const [claimSoftwareId, setClaimSoftwareId] = useState('');
  const [claimMethod, setClaimMethod] = useState('DNS_TXT');
  const [activeClaimResult, setActiveClaimResult] = useState<any>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // 提交新软件表单
  const [submitData, setSubmitData] = useState({
    softwareName: '',
    officialWebsite: '',
    repoUrl: '',
    version: '1.0.0',
    license: 'MIT / 开源',
    releaseDate: new Date().toISOString().slice(0, 10),
    summary: '',
    description: '',
    changelog: '初始版本发布',
    downloadUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    getDeveloperProfile()
      .then((res) => {
        if (res.success) setProfile(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimSoftwareId) return;
    setIsClaiming(true);
    try {
      const res = await createDeveloperClaim(claimSoftwareId, claimMethod);
      if (res.success) {
        setActiveClaimResult(res.data);
        setFeedback({ type: 'success', message: '认领挑战码已生成！请按指引部署后提交凭据' });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '发起认领失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleVerifyClaim = async (claimId: string) => {
    try {
      const res = await verifyDeveloperClaim(claimId, evidenceUrl);
      if (res.success) {
        setFeedback({ type: 'success', message: '凭据已提交！管理员将人工核验 DNS 或项目归属' });
        setIsClaimModalOpen(false);
        setActiveClaimResult(null);
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '提交核验失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSubmitSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitDeveloperSoftware(submitData);
      if (res.success) {
        setFeedback({ type: 'success', message: '软件资料已成功提交审核队列！' });
        setIsSubmitModalOpen(false);
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '提交失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChallenge(true);
    setTimeout(() => setCopiedChallenge(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1769D2] mb-3" />
        <span className="text-xs">加载开发者工作台...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">尚未开通开发者档案</h2>
        <p className="text-xs text-slate-500 mb-6">入驻软游部落开发者中心后，即可认领软件所有权并提交版本资料。</p>
        <Link
          to="/developer/register"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white text-xs font-semibold rounded-xl"
        >
          立即申请认证开发者
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      {/* 顶部开发者身份概要卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile.displayName}</h1>
            {profile.verificationStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#1769D2] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>官方已认证作者</span>
              </span>
            ) : profile.verificationStatus === 'PENDING_REVIEW' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 rounded-full text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>资质审核中</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-medium">
                <span>{profile.verificationStatus}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            组织: {profile.organizationName || '独立开发者'} · 官网: {profile.website || '未设置'} · 标识: /developers/{profile.slug}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {profile.verificationStatus === 'VERIFIED' && (
            <Link
              to={`/developers/${profile.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>查看公开主页</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/developer/api-keys"
            className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 rounded-xl text-xs font-semibold"
          >
            <Key className="w-3.5 h-3.5" />
            <span>API 密钥 ({profile.apiKeys?.length || 0})</span>
          </Link>

          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>认领收录软件</span>
          </button>

          <button
            onClick={() => {
              if (profile.verificationStatus !== 'VERIFIED') {
                alert('您的开发者资质尚在审核中，审核通过后即可提交软件资料！');
                return;
              }
              setIsSubmitModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>提交新软件资料</span>
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {feedback && (
        <div
          className={`p-3.5 mb-6 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* 核心两大看板：我认领的软件 + 我提交的草稿 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 已认领软件 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">已认领的软件主页</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{profile.claims?.length || 0} 款</span>
          </div>

          <div className="space-y-3">
            {profile.claims && profile.claims.length > 0 ? (
              profile.claims.map((claim: any) => (
                <div
                  key={claim.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {claim.software?.name || '软件'}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      验证方式: {claim.claimMethod} · 申请时间: {new Date(claim.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    {claim.status === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded text-[11px] font-semibold">
                        已认证认领
                      </span>
                    ) : claim.status === 'PENDING' ? (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded text-[11px]">
                        凭据核验中
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded text-[11px]">
                        已驳回
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">暂未认领任何已收录的软件</p>
            )}
          </div>
        </div>

        {/* 提交的软件草稿 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">我提交的软件资料草稿</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{profile.submissions?.length || 0} 条</span>
          </div>

          <div className="space-y-3">
            {profile.submissions && profile.submissions.length > 0 ? (
              profile.submissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {sub.softwareName} (v{sub.version})
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{sub.summary}</div>
                  </div>
                  <div>
                    {sub.status === 'APPROVED' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded text-[11px]">
                        审核通过
                      </span>
                    ) : sub.status === 'PENDING_REVIEW' ? (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded text-[11px]">
                        终审排队中
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded text-[11px]">
                        已驳回
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">暂未提交任何软件草稿</p>
            )}
          </div>
        </div>
      </div>

      {/* 认领软件弹窗 */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>发起软件所有权认领</span>
            </h3>

            {!activeClaimResult ? (
              <form onSubmit={handleCreateClaim} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    请输入收录软件的数据库 ID 或 Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={claimSoftwareId}
                    onChange={(e) => setClaimSoftwareId(e.target.value)}
                    placeholder="例如：7-zip 或 cm7..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    验证控制权方式 *
                  </label>
                  <select
                    value={claimMethod}
                    onChange={(e) => setClaimMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="DNS_TXT">DNS TXT 记录解析验证 (推荐企业/官方域名)</option>
                    <option value="WELL_KNOWN_FILE">官方网站根目录文件验证 (/.well-known/softbuluo.txt)</option>
                    <option value="GITHUB_AUTH">GitHub 主仓库所有权核验</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="px-5 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white text-xs font-semibold rounded-xl"
                  >
                    {isClaiming ? '生成中...' : '生成验证挑战码'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">验证指引:</p>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">{activeClaimResult.verificationTarget}</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-200 font-mono text-[11px]">
                    <span className="flex-1 truncate">{activeClaimResult.challengeCode}</span>
                    <button
                      onClick={() => copyToClipboard(activeClaimResult.challengeCode)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      {copiedChallenge ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    完成部署后，请填写公开核验证据 URL (可选):
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://your-domain.com/.well-known/softbuluo.txt"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveClaimResult(null);
                      setIsClaimModalOpen(false);
                    }}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    稍后核验
                  </button>
                  <button
                    onClick={() => handleVerifyClaim(activeClaimResult.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                  >
                    提交审核并核验
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提交软件资料弹窗 */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
              <span>提交软件资料草稿</span>
            </h3>

            <form onSubmit={handleSubmitSoftware} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">软件名称 *</label>
                  <input
                    type="text"
                    required
                    value={submitData.softwareName}
                    onChange={(e) => setSubmitData({ ...submitData, softwareName: e.target.value })}
                    placeholder="例如：Neovim"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">最新稳定版本 *</label>
                  <input
                    type="text"
                    required
                    value={submitData.version}
                    onChange={(e) => setSubmitData({ ...submitData, version: e.target.value })}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">官方主页网址 *</label>
                <input
                  type="url"
                  required
                  value={submitData.officialWebsite}
                  onChange={(e) => setSubmitData({ ...submitData, officialWebsite: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  官方下载直达渠道 (官网 CDN 或 Releases) *
                </label>
                <input
                  type="url"
                  required
                  value={submitData.downloadUrl}
                  onChange={(e) => setSubmitData({ ...submitData, downloadUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">一句话简介 *</label>
                <input
                  type="text"
                  required
                  value={submitData.summary}
                  onChange={(e) => setSubmitData({ ...submitData, summary: e.target.value })}
                  placeholder="简洁概述软件核心能力 (20-60字)"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">更新日志要点</label>
                <textarea
                  rows={2}
                  value={submitData.changelog}
                  onChange={(e) => setSubmitData({ ...submitData, changelog: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  {isSubmitting ? '提交中...' : '提交人工终审'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
