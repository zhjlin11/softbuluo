import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  ExternalLink,
  Crown,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getAdminTutorials,
  createTutorial,
  updateTutorial,
} from '../../services/operationsService';

export const AdminTutorialsPage: React.FC = () => {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    isPremium: false,
    seoTitle: '',
    seoDescription: '',
    status: 'PUBLISHED',
  });

  const loadTutorials = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminTutorials();
      if (res.success && res.data) {
        setTutorials(res.data.items || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createTutorial(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          slug: '',
          summary: '',
          content: '',
          isPremium: false,
          seoTitle: '',
          seoDescription: '',
          status: 'PUBLISHED',
        });
        await loadTutorials();
      } else {
        alert(res.message || '创建教程失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="实用教程与指南管理">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            实用教程与深度实操指南
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            发布环境配置、驱动排障、安装指导等原创教程，支持关联软件与会员 VIP 专享深度内容
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTutorials}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> 撰写新教程
          </button>
        </div>
      </div>

      {/* 教程表格 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">教程标题与 Slug</th>
              <th className="py-3 px-4 font-semibold">核心导读</th>
              <th className="py-3 px-4 font-semibold">权限类型</th>
              <th className="py-3 px-4 font-semibold">阅读量</th>
              <th className="py-3 px-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tutorials.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">/tutorials/{t.slug}</div>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[320px] truncate">
                  {t.summary}
                </td>
                <td className="py-3 px-4">
                  {t.isPremium ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      <Crown className="w-3 h-3 text-amber-600" /> VIP 专属
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      公开免费
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                  {t.viewCount ?? 0} 次
                </td>
                <td className="py-3 px-4 text-right">
                  <a
                    href={`/seo/tutorials/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] inline-flex items-center gap-0.5"
                  >
                    SEO 预览 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </td>
              </tr>
            ))}
            {tutorials.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  暂无教程记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              撰写发布实用教程
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">教程标题</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Windows 11 环境下 VS Code 与 C++ 编译环境极速配置指南"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">教程 Slug (URL 路径)</label>
                <input
                  type="text"
                  required
                  placeholder="例如：vscode-cpp-win11-setup"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">核心导读与适用场景</label>
                <textarea
                  rows={2}
                  required
                  placeholder="简明扼要概括本教程能解决的具体问题..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">教程正文内容 (支持 Markdown)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="步骤 1：下载安装官方安装包..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPremiumCheck"
                  checked={formData.isPremium}
                  onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="isPremiumCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  设为 VIP 会员专享深度教程
                </label>
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
                  确认发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
