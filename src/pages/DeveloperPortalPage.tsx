import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  ShieldCheck,
  PackagePlus,
  Key,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { getDeveloperProfile } from '../services/developerService';

export const DeveloperPortalPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDeveloperProfile()
      .then((res) => {
        if (res.success) setProfile(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8 sm:py-12">
      {/* 顶部 Hero 区域 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-10 text-white mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Code2 className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>软游部落开放生态平台</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            连接真实软件作者与万千桌面用户
          </h1>
          <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed mb-6">
            入驻软游部落开发者中心。认领您的软件主页、提交最新官方版本与更新日志、获取官方认证徽章，并通过只读开放 API 将您的工具直通生态。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.verificationStatus === 'VERIFIED' ? (
              <Link
                to="/developer/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                <span>进入开发者工作台</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : profile?.verificationStatus === 'PENDING_REVIEW' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-xl text-xs font-medium">
                <Clock className="w-4 h-4" />
                <span>开发者入驻申请审核中...</span>
              </div>
            ) : (
              <Link
                to="/developer/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                <span>申请入驻 / 认证开发者</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              to="/developers/api"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-white/10"
            >
              <BookOpen className="w-4 h-4" />
              <span>浏览开放 API 文档</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 核心权益与功能入口栅格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1769D2] flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">软件所有权认领</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            通过 DNS TXT 记录或官网根目录文件验证您对软件项目的真实控制权，认领后展示专属“官方认证作者”徽章。
          </p>
          <Link
            to="/developer/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] hover:underline"
          >
            <span>认领我的软件</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4">
            <PackagePlus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">版本自主维护与提审</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            直接提交最新稳定版更新日志、安全哈希与官方下载渠道，经后台合规终审后全站极速发布与分发。
          </p>
          <Link
            to="/developer/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
          >
            <span>提交新版本</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs hover:border-blue-500/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-4">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">开放 API 与开发者密钥</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            获取专属高配额 API Key（300 次/分），集成软游部落软件索引、版本更新检测及横向对比数据至您的应用中。
          </p>
          <Link
            to="/developer/api-keys"
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"
          >
            <span>管理 API 密钥</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 规范与入驻流程指南 */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6">
          开发者认证与维护四步流程
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">注册并提交资料</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                填写开发者昵称、组织名称、官方网址及开源代码仓库地址。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">官方归属核验</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                通过 DNS TXT 记录或项目根目录文件挑战码验证项目控制权。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">获得认证标识</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                人工核实官方归属后授予“认证开发者”专属徽章并生成主页。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">答疑互动与分发</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                在社区直接带有官方徽章解答用户安装体验，持续发布新版。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
