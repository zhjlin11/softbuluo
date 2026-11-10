import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { GrowthService, ComparisonItem } from '../../services/growthService';

export const AdminComparisonsPage: React.FC = () => {
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // 弹窗与表单
  const [showModal, setShowModal] = useState(false);
  const [allSoftware, setAllSoftware] = useState<any[]>([]);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [scenarioGuide, setScenarioGuide] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [selectedSoftwareIds, setSelectedSoftwareIds] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Array<{ name: string; category: string; values: Record<string, string>; isHighlighted: boolean }>>([
    { name: '冷启动速度', category: 'PERFORMANCE', values: {}, isHighlighted: true },
    { name: '空载内存占用', category: 'PERFORMANCE', values: {}, isHighlighted: true },
    { name: '扩展生态', category: 'FUNCTION', values: {}, isHighlighted: false },
    { name: '许可证与费用', category: 'LICENSE', values: {}, isHighlighted: false },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData(1);
    // 加载可选软件列表
    fetch('/api/v1/resources?limit=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setAllSoftware(res.data.items || []);
        }
      })
      .catch(console.error);
  }, [statusFilter]);

  const loadData = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await GrowthService.adminGetComparisons(p, 20, statusFilter || undefined);
      if (res.success && res.data) {
        setComparisons(res.data.items || []);
        setTotal(res.data.total || 0);
        setPage(p);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定彻底删除该横向对比评测吗？')) return;
    try {
      const res = await GrowthService.adminDeleteComparison(id);
      if (res.success) {
        loadData(page);
      } else {
        alert(res.error || '删除失败');
      }
    } catch (err: any) {
      alert(err.message || '网络错误');
    }
  };

  const handleToggleSoftware = (id: string) => {
    if (selectedSoftwareIds.includes(id)) {
      setSelectedSoftwareIds(selectedSoftwareIds.filter((s) => s !== id));
    } else {
      if (selectedSoftwareIds.length >= 4) {
        alert('单次横向对比最多选择 4 款软件');
        return;
      }
      setSelectedSoftwareIds([...selectedSoftwareIds, id]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSoftwareIds.length < 2) {
      alert('横向对比至少需要选择 2 款软件');
      return;
    }
    setFeedback(null);

    try {
      const payload = {
        slug,
        title,
        summary,
        conclusion,
        targetAudience,
        scenarioGuide,
        status,
        items: selectedSoftwareIds.map((sId, idx) => ({
          softwareId: sId,
          isRecommended: idx === 0,
          sortOrder: idx,
        })),
        attributes: attributes.map((attr, idx) => ({
          attributeName: attr.name,
          category: attr.category,
          values: attr.values,
          isHighlighted: attr.isHighlighted,
          sortOrder: idx,
        })),
      };

      const res = await GrowthService.adminCreateComparison(payload);
      if (res.success) {
        setFeedback('对比评测已创建并发布！');
        setTimeout(() => {
          setShowModal(false);
          setFeedback(null);
          loadData(1);
        }, 1200);
      } else {
        setFeedback(res.error || '创建失败');
      }
    } catch (err: any) {
      setFeedback(err.message || '请求失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与新建按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            软件横向对比与选型指南管理
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            发布客观中立的跨产品矩阵参数对比，生成独立高权重 SEO 承载页（/compare/:slug）。
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          新建对比评测
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">状态过滤：</span>
        {['', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === st
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {st === '' ? '全部' : st === 'PUBLISHED' ? '已发布' : st === 'DRAFT' ? '草稿' : '已归档'}
          </button>
        ))}
      </div>

      {/* 列表表格 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="p-3.5 font-semibold">对比标题与 Slug</th>
                <th className="p-3.5 font-semibold">关联产品</th>
                <th className="p-3.5 font-semibold">浏览热度</th>
                <th className="p-3.5 font-semibold">状态</th>
                <th className="p-3.5 font-semibold">更新时间</th>
                <th className="p-3.5 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : comparisons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    暂无对比记录，点击右上角新建
                  </td>
                </tr>
              ) : (
                comparisons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {c.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        /compare/{c.slug}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.items?.map((it: any) => (
                          <span
                            key={it.id}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                          >
                            {it.software?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                      {c.viewCount} 次
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60'
                        }`}
                      >
                        {c.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/compare/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          前台预览
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-rose-600 hover:text-rose-700"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* 新建对比弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              新建深度横向对比评测
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              挑选至少 2 款软件，填写核心评测参数矩阵与客观选型建议。
            </p>

            {feedback && (
              <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-xs">
                {feedback}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">唯一 Slug (URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="如：vscode-vs-sublime"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">发布状态</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="PUBLISHED">立即发布 (PUBLISHED)</option>
                    <option value="DRAFT">存为草稿 (DRAFT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">对比评测主标题</label>
                <input
                  type="text"
                  required
                  placeholder="如：Visual Studio Code vs Sublime Text：深度横向对比与开发者选型指南"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">选择对比产品 (至少勾选 2 款)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {allSoftware.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => handleToggleSoftware(s.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        selectedSoftwareIds.includes(s.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">评测导读 / 摘要</label>
                <textarea
                  required
                  rows={2}
                  placeholder="简明扼要概括双方的核心定位与最突出的差异..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">适合人群分析</label>
                  <textarea
                    rows={2}
                    placeholder="如：全栈开发者、大文本日志查看者..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">典型使用场景建议</label>
                  <textarea
                    rows={2}
                    placeholder="如：日常主力工程用 A，随手便携速记用 B..."
                    value={scenarioGuide}
                    onChange={(e) => setScenarioGuide(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">编辑综合选型与安装建议 (重点结论)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="综合给出客观公正的选型结论，杜绝绝对化断言，指导用户科学搭配使用..."
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  确认保存并发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
