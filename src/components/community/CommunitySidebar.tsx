import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BarChart2,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  Terminal,
  Award
} from 'lucide-react';
import { CommunityStats } from '../../services/communityService';
import { getCategoryBadgeMeta } from './CommunityThreadList';

export interface PendingQuestionItem {
  id: string;
  title: string;
  category: string;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  user?: { username: string };
}

export interface CommunitySidebarProps {
  stats: CommunityStats | null;
  pendingQuestions: PendingQuestionItem[];
  onOpenCreateModal: () => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  stats,
  pendingQuestions,
  onOpenCreateModal,
}) => {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* 快捷行动卡片 */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 shadow-lg shadow-blue-500/10">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-blue-200" />
          <h3 className="font-bold text-sm">遇到疑难故障或软件疑问？</h3>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed mb-4">
          请描述清晰操作系统版本、硬件配置与报错代码，软游部落数万玩家与开发者将协助您排障！
        </p>
        <button
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>立即提问或发帖</span>
        </button>
      </div>

      {/* 真实透明社区统计指标 (杜绝造假) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">社区真实运行数据</h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            实时统计
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">累计讨论主题</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats?.totalThreads ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">累计回复交流</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              {stats?.totalPosts ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">已解决问题</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.resolvedThreads ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">问答解决率</span>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats ? `${stats.resolutionRate}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>全量数据来自真实数据库查询，杜绝虚拟刷量</span>
        </div>
      </div>

      {/* 待协助解决的求助问题列表 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">待解决的求助</h3>
          </div>
          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded font-medium">
            求答疑
          </span>
        </div>

        {pendingQuestions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <span>当前所有求助均已获得有效解答！</span>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingQuestions.map((q) => {
              const badge = getCategoryBadgeMeta(q.category);
              return (
                <div key={q.id} className="group">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {q.user?.username || '用户'}
                    </span>
                  </div>
                  <Link
                    to={`/community/thread/${q.id}`}
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
                  >
                    {q.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{q.replyCount} 条回复</span>
                    <span>·</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 社区发帖与文明互助公约 */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/80 dark:border-slate-700/80 mb-3">
          <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">社区互助与安全公约</h3>
        </div>

        <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
            <span>
              <strong>详述环境：</strong>求助请注明 Windows 版本、硬件平台与关键报错日志。
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
            <span>
              <strong>采纳最佳：</strong>问题排障成功后，请在回复楼层点击“采纳为最佳解答”。
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
            <span>
              <strong>安全底线：</strong>严禁发布盗号木马、流氓捆绑与引流违规链接。
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <span>
              <strong>官方认证：</strong>软件作者可申请开发者认证，回复将附带专属徽章。
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
};
