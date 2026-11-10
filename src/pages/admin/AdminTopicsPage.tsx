import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Eye,
  Edit,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getTopics,
  createTopic,
  updateTopic,
} from '../../services/operationsService';

export const AdminTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
    status: 'PUBLISHED',
  });

  const loadTopics = async () => {
    setIsLoading(true);
    try {
      const res = await getTopics();
      if (res.success && res.data) {
        setTopics(res.data.items || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createTopic(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          slug: '',
          description: '',
          seoTitle: '',
          seoDescription: '',
          status: 'PUBLISHED',
        });
        await loadTopics();
      } else {
        alert(res.message || '创建专题失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await updateTopic(id, { status: nextStatus });
      if (res.success) {
        await loadTopics();
      }
    } catch (err: any) {
      alert(err.message || '更新状态异常');
    }
  };

  return (
    <AdminLayout title="精选专题管理">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600" />
            精选专题合集与 SEO 专区
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            聚合电脑装机必备、开源工具箱等优质专题，提供独立可抓取 SEO 页面与结构化 Schema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTopics}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> 新建精选专题
          </button>
        </div>
      </div>

      {/* 专题列表 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">专题标题与 Slug</th>
              <th className="py-3 px-4 font-semibold">专题简介</th>
              <th className="py-3 px-4 font-semibold">关联软件数</th>
              <th className="py-3 px-4 font-semibold">发布状态</th>
              <th className="py-3 px-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {topics.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">/topics/{t.slug}</div>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[300px] truncate">
                  {t.description}
                </td>
                <td className="py-3 px-4 font-semibold text-blue-600">
                  {t._count?.resources ?? t.resources?.length ?? 0} 款
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  >
                    {t.status === 'PUBLISHED' ? '设为草稿' : '立即发布'}
                  </button>
                  <a
                    href={`/topics/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] inline-flex items-center gap-0.5"
                  >
                    前台预览 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </td>
              </tr>
            ))}
            {topics.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  暂无精选专题
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新建专题模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              新建精选专题合集
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">专题标题</label>
                <input
                  type="text"
                  required
                  placeholder="例如：2026 Windows 电脑装机必备正版工具大全"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">专题 Slug (独立 URL)</label>
                <input
                  type="text"
                  required
                  placeholder="例如：pc-essential-tools-2026"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">专题导读与详细介绍</label>
                <textarea
                  rows={4}
                  required
                  placeholder="专题背景、编辑推荐指引及收录标准..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">SEO Title</label>
                  <input
                    type="text"
                    placeholder="选填，默认使用专题标题"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发布状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="PUBLISHED">正式发布 (PUBLISHED)</option>
                    <option value="DRAFT">草稿箱 (DRAFT)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
