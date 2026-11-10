import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  Send,
  ExternalLink,
  X,
  AlertCircle,
  Loader2,
  Filter,
  ShieldCheck,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  adminGetResources,
  adminCreateResource,
  adminSubmitResource,
  adminApproveResource,
  adminRejectResource,
  adminArchiveResource,
  adminToggleTestData,
  adminGetCategories,
  adminGetNextPendingResource,
  adminNeedsCorrection,
} from '../../services/resourceService';

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [testDataFilter, setTestDataFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // P6 审核工作台状态
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');

  // 新增表单状态
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    englishName: '',
    aliases: '',
    developer: '',
    summary: '',
    description: '',
    type: 'SOFTWARE',
    categoryId: '',
    isFeatured: false,
    version: '1.0.0',
    platform: 'Windows 10/11 64位',
    fileSize: '官方原包',
    officialUrl: '',
    sourceName: '原厂官方下载通道',
    licenseType: 'FREE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params: any = { status: statusFilter, search: searchQuery };
      if (testDataFilter !== '') params.isTestData = testDataFilter;
      const [resData, catsData] = await Promise.all([
        adminGetResources(params),
        adminGetCategories(),
      ]);

      if (resData.success) {
        setResources(resData.data.items || []);
      }
      if (catsData.success) {
        setCategories(catsData.data || []);
        if (catsData.data?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: catsData.data[0].id }));
        }
      }
    } catch (err) {
      console.error('加载资源列表失败', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, testDataFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        ...formData,
        aliases: formData.aliases ? formData.aliases.split(',').map((s) => s.trim()) : [],
      };
      const res = await adminCreateResource(payload);
      if (res.success) {
        setFeedback({ type: 'success', message: `新资源 "${formData.name}" 已成功创建为草稿状态！` });
        setIsModalOpen(false);
        // 重置表单
        setFormData({
          name: '',
          slug: '',
          englishName: '',
          aliases: '',
          developer: '',
          summary: '',
          description: '',
          type: 'SOFTWARE',
          categoryId: categories[0]?.id || '',
          isFeatured: false,
          version: '1.0.0',
          platform: 'Windows 10/11 64位',
          fileSize: '官方原包',
          officialUrl: '',
          sourceName: '原厂官方下载通道',
          licenseType: 'FREE',
        });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '创建失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '网络连接异常' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async (id: string, name: string) => {
    if (!confirm(`确认将软件 "${name}" 提交审核？`)) return;
    try {
      const res = await adminSubmitResource(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 已提交审核状态！` });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '提交审核失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`确认审核通过并正式发布 "${name}"？`)) return;
    try {
      const res = await adminApproveResource(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 审核通过，已正式对外发布！` });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '发布失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`请输入驳回 "${name}" 的原因：`, '官方来源不明确或信息缺失');
    if (reason === null) return;
    try {
      const res = await adminRejectResource(id, reason);
      if (res.success) {
        setFeedback({ type: 'success', message: `已驳回 "${name}"。` });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '驳回操作失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`确定下架并归档 "${name}"？下架后前台将无法检索与访问。`)) return;
    try {
      const res = await adminArchiveResource(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 已安全下架并归档。` });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '下架失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleToggleTestData = async (id: string, name: string) => {
    try {
      const res = await adminToggleTestData(id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `"${name}" 已${res.data.isTestData ? '标记并隔离为测试数据（前台不再公开展示）' : '恢复为正式资源（前台已允许公开流转）'}。`,
        });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '操作失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // P6 审核工作台交互方法
  const handleOpenNextReview = async () => {
    setIsReviewLoading(true);
    setIsReviewModalOpen(true);
    setCorrectionNotes('');
    try {
      const res = await adminGetNextPendingResource();
      if (res.success && res.data) {
        setReviewData(res.data);
      } else {
        setReviewData(null);
        setFeedback({ type: 'success', message: res.message || '当前暂无待审核资源！' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '加载审核数据失败' });
      setIsReviewModalOpen(false);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleReviewApprove = async () => {
    if (!reviewData?.resource) return;
    const { id, name } = reviewData.resource;
    try {
      const res = await adminApproveResource(id);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 终审通过，已正式对外发布！` });
        loadData();
        handleOpenNextReview(); // 继续下一条
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '发布失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReviewReject = async () => {
    if (!reviewData?.resource) return;
    const { id, name } = reviewData.resource;
    const reason = prompt('请输入驳回原因:', '官方来源不明确或下载直链不可用');
    if (!reason) return;
    try {
      const res = await adminRejectResource(id, reason);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 已驳回。` });
        loadData();
        handleOpenNextReview();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '操作失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReviewNeedsCorrection = async () => {
    if (!reviewData?.resource) return;
    const { id, name } = reviewData.resource;
    if (!correctionNotes.trim()) {
      alert('请填写整改意见与待补全项目');
      return;
    }
    try {
      const res = await adminNeedsCorrection(id, correctionNotes);
      if (res.success) {
        setFeedback({ type: 'success', message: `"${name}" 已退回待整改队列。` });
        loadData();
        handleOpenNextReview();
      } else {
        setFeedback({ type: 'error', message: res.error?.message || '操作失败' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>已发布</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>待审核</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>草稿</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>已驳回</span>
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            <Archive className="w-3 h-3" />
            <span>已下架</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <AdminLayout title="软件资源与版本管理">
      {/* 顶部操作与筛选栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索软件名称、Slug、开发方..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            搜索
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300"
          >
            <option value="">全部生命周期状态</option>
            <option value="DRAFT">DRAFT (草稿)</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW (待审核)</option>
            <option value="PUBLISHED">PUBLISHED (已发布)</option>
            <option value="REJECTED">REJECTED (已驳回)</option>
            <option value="ARCHIVED">ARCHIVED (已下架)</option>
          </select>

          <select
            value={testDataFilter}
            onChange={(e) => setTestDataFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300"
          >
            <option value="">全部数据 (正式+测试)</option>
            <option value="false">仅正式运营数据</option>
            <option value="true">仅隔离的测试数据</option>
          </select>

          <button
            onClick={handleOpenNextReview}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>⚡ 审查下一条待审资源</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>录入新软件</span>
          </button>
        </div>
      </div>

      {/* 提示条 */}
      {feedback && (
        <div
          className={`p-3.5 mb-6 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 资源列表表格 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">软件名称与Slug</th>
                <th className="py-3 px-4">分类与类型</th>
                <th className="py-3 px-4">开发商</th>
                <th className="py-3 px-4">最新版本</th>
                <th className="py-3 px-4">访问/下载</th>
                <th className="py-3 px-4">审核状态</th>
                <th className="py-3 px-4 text-right">生命周期流转操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    正在载入资源列表...
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    未找到符合条件的资源记录
                  </td>
                </tr>
              ) : (
                resources.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                        {item.isTestData && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                            测试数据
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{item.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{item.categoryName}</span>
                      <span className="ml-1 text-[10px] text-slate-400">({item.type})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.developer}</td>
                    <td className="py-3 px-4 font-mono font-medium">{item.latestVersion}</td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      {item.viewCount} / {item.downloadCount}
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* 草稿或驳回状态下允许提交审核 */}
                        {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                          <button
                            onClick={() => handleSubmitReview(item.id, item.name)}
                            title="提交审核"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 cursor-pointer font-medium"
                          >
                            <Send className="w-3 h-3" />
                            <span>提审</span>
                          </button>
                        )}

                        {/* 待审核状态下允许审批通过或驳回 */}
                        {item.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, item.name)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer font-medium"
                            >
                              批准发布
                            </button>
                            <button
                              onClick={() => handleReject(item.id, item.name)}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 cursor-pointer font-medium"
                            >
                              驳回
                            </button>
                          </>
                        )}

                        {/* 已发布状态下允许下架 */}
                        {item.status === 'PUBLISHED' && (
                          <>
                            <Link
                              to={`/software/${item.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <span>预览</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <button
                              onClick={() => handleArchive(item.id, item.name)}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer font-medium"
                            >
                              下架
                            </button>
                          </>
                        )}

                        {/* 标记测试 / 恢复正式 */}
                        <button
                          onClick={() => handleToggleTestData(item.id, item.name)}
                          title={item.isTestData ? "恢复为正式运营数据并允许前台展示" : "标记并物理隔离为测试数据（前台不展示）"}
                          className={`px-2 py-1 text-[11px] rounded font-medium border cursor-pointer transition-colors ${
                            item.isTestData
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {item.isTestData ? '恢复正式' : '隔离测试'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增软件 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                录入新软件资源 (进入 DRAFT 草稿箱)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    软件名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：Visual Studio Code"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Slug (唯一路径标识) *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^[a-z0-9-]+$"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="如：vscode (仅小写字母、数字与连字符)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    资源分类 *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    资源形态 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="SOFTWARE">标准软件 (SOFTWARE)</option>
                    <option value="TOOL">系统运维工具 (TOOL)</option>
                    <option value="GAME">单机/独立游戏 (GAME)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    许可证类型
                  </label>
                  <select
                    value={formData.licenseType}
                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="FREE">免费软件 (FREE)</option>
                    <option value="OPEN_SOURCE">开源自由软件 (OPEN_SOURCE)</option>
                    <option value="COMMERCIAL_TRIAL">商业试用 (TRIAL)</option>
                    <option value="PAID">正版授权 (PAID)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    开发商 / 著作权方 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.developer}
                    onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                    placeholder="如：Microsoft Corporation"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    搜索别名 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.aliases}
                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                    placeholder="如：code, 微软编辑器"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  一句话摘要 (展示于卡片) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="如：微软推出的轻量级、跨平台现代化代码编辑器..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  功能详细描述 *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细介绍软件特色、核心功能与安装说明..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 初始版本与官方下载源 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  初始版本与官方下载源
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">版本号 *</label>
                    <input
                      type="text"
                      required
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">运行平台</label>
                    <input
                      type="text"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">安装包大小</label>
                    <input
                      type="text"
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">
                    官方真实下载/主页链接 * (严格禁止流氓捆绑下载站)
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.officialUrl}
                    onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">设为首页编辑精选软件</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? '保存中...' : '保存为草稿'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* P6 资源安全审核工作台抽屉/弹窗 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  资源终审工作台 {reviewData?.totalPending ? `(剩余待审: ${reviewData.totalPending} 款)` : ''}
                </h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isReviewLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                  <span className="text-xs">正在调取下一条待审核资源与安全证据...</span>
                </div>
              ) : !reviewData?.resource ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">当前没有更多待审核资源！</p>
                  <p className="text-xs text-slate-400 mt-1">所有草稿与提审资源均已核验完成。</p>
                </div>
              ) : (
                <>
                  {/* 核心概要 */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {reviewData.resource.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({reviewData.resource.slug})</span>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[11px]">
                          {reviewData.resource.category?.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">开发方: {reviewData.resource.developer}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{reviewData.resource.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <a
                        href={reviewData.resource.officialWebsite || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <span>访问官网</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* 缺失字段自动诊断 */}
                  {reviewData.missingFields && reviewData.missingFields.length > 0 ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>检测到字段缺失或异常:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {reviewData.missingFields.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>基础元数据完整性校验通过 (官网、开发方、简介与直链齐全)</span>
                    </div>
                  )}

                  {/* 安全证据核验清单 */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-blue-500" />
                      <span>审核证据凭证记录 (ResourceReviewEvidence)</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {reviewData.evidences && reviewData.evidences.length > 0 ? (
                        reviewData.evidences.map((ev: any) => (
                          <div
                            key={ev.id}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">
                                {ev.fieldName} ({ev.evidenceType})
                              </span>
                              <span className="text-slate-500">{ev.notes}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                ev.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {ev.verificationStatus}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 py-2">暂无凭据记录</p>
                      )}
                    </div>
                  </div>

                  {/* 整改意见输入 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      整改反馈意见 (退回待整改时必填):
                    </label>
                    <textarea
                      rows={2}
                      value={correctionNotes}
                      onChange={(e) => setCorrectionNotes(e.target.value)}
                      placeholder="例如：官方下载直链已失效，需补充备用镜像或官方 CDN..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  {/* 操作按钮区 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleOpenNextReview}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      <span>跳过，查看下一条</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReviewNeedsCorrection}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        要求整改
                      </button>
                      <button
                        type="button"
                        onClick={handleReviewReject}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        驳回下架
                      </button>
                      <button
                        type="button"
                        onClick={handleReviewApprove}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        通过并正式发布
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
