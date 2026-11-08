import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "资源加载失败，请稍后重试",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/40">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
        <AlertCircle className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
        数据服务暂时异常
      </h3>
      <p className="text-xs text-red-700/80 dark:text-red-300/80 max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>重新加载</span>
        </button>
      )}
    </div>
  );
};
