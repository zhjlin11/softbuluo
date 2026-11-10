import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  listThreads,
  getCommunityStats,
  getPendingQuestions,
  CommunityThread,
  CommunityStats,
} from '../services/communityService';
import { CommunityHero } from '../components/community/CommunityHero';
import { CommunityFilterBar } from '../components/community/CommunityFilterBar';
import { CommunityThreadList } from '../components/community/CommunityThreadList';
import { CommunitySidebar, PendingQuestionItem } from '../components/community/CommunitySidebar';
import { CommunityCreateModal } from '../components/community/CommunityCreateModal';
import { CheckCircle2 } from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestionItem[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved' | 'hottest'>(
    (searchParams.get('status') as any) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('q') || '');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 加载统计与待解决问题 (真实数据)
  const loadSidebarData = useCallback(() => {
    getCommunityStats()
      .then((res) => {
        if (res.success && res.data) {
          setStats(res.data);
        }
      })
      .catch(() => {});

    getPendingQuestions(5)
      .then((res) => {
        if (res.success && res.data) {
          setPendingQuestions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // 加载主列表
  const loadThreads = useCallback(() => {
    setIsLoading(true);

    let isResolvedParam: boolean | undefined = undefined;
    let sortParam: 'latest' | 'hottest' | 'unresolved' | undefined = undefined;

    if (statusFilter === 'unresolved') {
      isResolvedParam = false;
      sortParam = 'unresolved';
    } else if (statusFilter === 'resolved') {
      isResolvedParam = true;
    } else if (statusFilter === 'hottest') {
      sortParam = 'hottest';
    }

    listThreads({
      category: selectedCategory || undefined,
      isResolved: isResolvedParam,
      sort: sortParam,
      search: activeSearch || undefined,
      page: pagination.page,
      pageSize: 15,
    })
      .then((res) => {
        if (res.success) {
          setThreads(res.data);
          setPagination(res.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCategory, statusFilter, activeSearch, pagination.page]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterSelect = (filter: 'all' | 'unresolved' | 'resolved' | 'hottest') => {
    setStatusFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 消息 Toast 浮动提示 */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 头部 Hero 模块 */}
      <CommunityHero
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        totalThreads={stats?.totalThreads || 0}
        resolvedThreads={stats?.resolvedThreads || 0}
      />

      {/* 70% / 30% 桌面端主从高密度布局 (移动端单列流式自适应) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* 左侧 70%：过滤导航条与讨论帖子流 */}
        <main className="w-full lg:flex-1 min-w-0">
          <CommunityFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            statusFilter={statusFilter}
            onSelectStatusFilter={handleStatusFilterSelect}
            searchQuery={activeSearch}
            onClearSearch={handleClearSearch}
            categoryCounts={stats?.categoryCounts}
            unresolvedCount={stats?.unresolvedThreads}
          />

          <CommunityThreadList
            threads={threads}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        </main>

        {/* 右侧 30%：独立侧边栏 (真实指标、待解决求助、公约) */}
        <CommunitySidebar
          stats={stats}
          pendingQuestions={pendingQuestions}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      </div>

      {/* 发帖与提问弹窗 */}
      <CommunityCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          showToast('讨论已成功发起！感谢您的分享与参与。');
          loadThreads();
          loadSidebarData();
        }}
      />
    </div>
  );
};
