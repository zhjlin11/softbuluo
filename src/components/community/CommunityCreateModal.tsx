import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { createThread } from '../../services/communityService';
import { COMMUNITY_CATEGORIES } from './CommunityFilterBar';

export interface CommunityCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CommunityCreateModal: React.FC<CommunityCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'QUESTION',
    tags: '',
    softwareId: '',
  });

  const [softwareSearch, setSoftwareSearch] = useState('');
  const [softwareList, setSoftwareList] = useState<any[]>([]);
  const [selectedSoftwareName, setSelectedSoftwareName] = useState<string | null>(null);
  const [isSearchingSoftware, setIsSearchingSoftware] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 搜索关联软件
  useEffect(() => {
    if (!softwareSearch.trim()) {
      setSoftwareList([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingSoftware(true);
      fetch(`/api/v1/software?search=${encodeURIComponent(softwareSearch.trim())}&pageSize=6`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSoftwareList(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearchingSoftware(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [softwareSearch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.title.trim().length < 5) {
      setFormError('讨论标题不能少于 5 个字');
      return;
    }
    if (formData.content.trim().length < 10) {
      setFormError('正文详细描述不能少于 10 个字');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createThread({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.trim() || undefined,
        softwareId: formData.softwareId || undefined,
      });

      if (res.success) {
        setFormData({ title: '', content: '', category: 'QUESTION', tags: '', softwareId: '' });
        setSelectedSoftwareName(null);
        setSoftwareSearch('');
        onSuccess();
        onClose();
      } else {
        setFormError(res.error?.message || '发起讨论失败，请确认是否已登录会员账号');
      }
    } catch (err: any) {
      setFormError(err.message || '网络连接异常，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative my-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">发起社区技术讨论 / 问答求助</h3>
              <p className="text-[11px] text-slate-400">提出排障疑问或分享维护经验，真实用户与开发者共同答疑</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 所属板块选择 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              选择交流板块 <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {COMMUNITY_CATEGORIES.filter((c) => c.id !== '').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 讨论标题 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                讨论标题 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{formData.title.length}/120</span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：Win11 23H2 更新后 Realtek 声卡无声音，报错代码 0x80070005"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 关联软件 (可选) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              关联站内软件 (可选，便于对该软件提出疑问或反馈)
            </label>

            {selectedSoftwareName ? (
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>已关联：{selectedSoftwareName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, softwareId: '' });
                    setSelectedSoftwareName(null);
                  }}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  取消关联
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={softwareSearch}
                  onChange={(e) => setSoftwareSearch(e.target.value)}
                  placeholder="搜索站内软件名称并关联 (例如 Blender, VSCode)..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                {isSearchingSoftware && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500 absolute right-3 top-2.5" />
                )}

                {softwareList.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {softwareList.map((sw) => (
                      <div
                        key={sw.id}
                        onClick={() => {
                          setFormData({ ...formData, softwareId: sw.id });
                          setSelectedSoftwareName(sw.name);
                          setSoftwareSearch('');
                          setSoftwareList([]);
                        }}
                        className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium">{sw.name}</span>
                        <span className="text-[10px] text-slate-400">{sw.category?.name || '软件'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 标签 tags (可选) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              自定义标签 (用逗号分隔，例如：Win11, 驱动, 蓝屏)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Win11, 蓝屏, 驱动冲突"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 正文详细描述 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                详细描述与复现说明 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{formData.content.length}/5000</span>
            </div>
            <textarea
              required
              rows={6}
              maxLength={5000}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请尽可能详述：&#10;1. 操作系统版本（如 Windows 11 23H2 专业版）&#10;2. 电脑硬件配置（CPU、显卡、主板型号）&#10;3. 问题发生的具体操作步骤与报错弹窗代码&#10;4. 已经尝试过哪些解决方式"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* 底部按钮与提示 */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">已启用 anti-XSS 与 5 分钟 3 篇限流保护</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                取消
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>立即发布</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
