import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Headphones,
  FileCode2,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { getProducts, createOrder, getMemberProfile } from '../services/commerceService';
import { ProductItem } from '../types/commerce';
import { AuthModal } from '../components/auth/AuthModal';

export const MembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [member, setMember] = useState<any | null>(null);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 动态设置标题
    document.title = '会员中心与增值服务 - 软游部落';

    // 加载商品列表
    getProducts()
      .then((items) => {
        setProducts(items);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 检查会员登录态
    getMemberProfile()
      .then((data) => {
        setMember(data.member);
        setIsVip(data.isVip);
      })
      .catch(() => {
        setMember(null);
        setIsVip(false);
      });
  }, []);

  const handleSelectProduct = async (product: ProductItem) => {
    setErrorMessage(null);

    // 未登录时唤起登录弹窗
    if (!member) {
      setAuthModalOpen(true);
      return;
    }

    setSubmittingProductId(product.id);
    try {
      const order = await createOrder(product.id, 1);
      navigate(`/checkout/${order.orderNo}`);
    } catch (err: any) {
      setErrorMessage(err.message || '创建订单失败，请稍后重试');
    } finally {
      setSubmittingProductId(null);
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      {/* 顶部 Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60 text-xs font-semibold rounded-full mb-3 shadow-2xs">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>软游部落 VIP 增值服务 · 纯净高效体验</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#202938] dark:text-slate-50 tracking-tight">
          极速下载专线与专属技术指导
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          全站软件托管包高速云加速直连、纯净人工实测、一对一疑难安装环境排错支持。按需购买，支持不满意透明退款。
        </p>
      </div>

      {/* 错误提示 */}
      {errorMessage && (
        <div className="max-w-xl mx-auto mb-6 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-600 dark:text-red-400 text-center">
          {errorMessage}
        </div>
      )}

      {/* 价格方案卡片网格 */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#1769D2] mb-3" />
          <p className="text-xs">加载会员套餐方案中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {products.map((product) => {
            const isMonthly = product.slug === 'monthly-vip';
            const isYearly = product.slug === 'yearly-vip';
            const isSingle = product.slug === 'single-service';

            return (
              <div
                key={product.id}
                className={`relative flex flex-col rounded-xl border bg-white dark:bg-[#141F33] p-6 sm:p-7 transition-all duration-200 ${
                  isMonthly
                    ? 'border-[#1769D2] dark:border-blue-500 shadow-md ring-2 ring-[#1769D2]/20'
                    : isYearly
                    ? 'border-amber-400/80 dark:border-amber-600/80 shadow-md ring-1 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md'
                }`}
              >
                {/* 推荐角标 */}
                {isMonthly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#1769D2] text-white text-[11px] font-bold rounded-full shadow-xs">
                    常用热门推荐
                  </div>
                )}
                {isYearly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>年度立省 ¥100</span>
                  </div>
                )}

                {/* 方案标题 */}
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {isYearly ? (
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : isMonthly ? (
                      <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{product.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* 价格展示 */}
                <div className="mb-6 flex items-baseline gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">¥</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#202938] dark:text-slate-50 tracking-tight">
                    {product.priceYuan}
                  </span>
                  {product.originalPriceYuan && (
                    <span className="text-xs text-slate-400 line-through ml-1">
                      ¥{product.originalPriceYuan}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 ml-auto font-medium">
                    {product.durationDays > 0 ? `有效 ${product.durationDays} 天` : '按单次计费'}
                  </span>
                </div>

                {/* 包含权益清单 */}
                <div className="space-y-3 flex-1 mb-6 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isSingle
                        ? '指定 1 款专属托管资源高速直链授权'
                        : '全站所有托管软件/补丁千兆加速直链通道'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>人工验证纯净安装包，严格排除广告捆绑</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isYearly
                        ? '专属 1 对 1 专家级装机报错急救排查'
                        : isMonthly
                        ? '常见运行库缺失与安装报错疑难指导'
                        : '单次专属安装指导与技术咨询'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isYearly
                        ? '优先推送核心生产力工具重要版本更新'
                        : '全站深度实操与使用技巧专属教程库'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isSingle
                        ? '未消费前支持 100% 极速无理由退款'
                        : '服务期内如遇无法解决故障支持工单退款'}
                    </span>
                  </div>
                </div>

                {/* 下单选购主按钮 */}
                <button
                  onClick={() => handleSelectProduct(product)}
                  disabled={submittingProductId === product.id}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMonthly
                      ? 'bg-[#1769D2] hover:bg-[#1258B5] text-white shadow-sm'
                      : isYearly
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {submittingProductId === product.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>正在创建订单...</span>
                    </>
                  ) : (
                    <>
                      <span>{isVip && (isMonthly || isYearly) ? '立即顺延续费' : '立即选购开通'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 商业化与版权合规声明 (重中之重) */}
      <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 mb-12">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1769D2] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">
              合规透明声明与版权服务须知
            </h3>
            <p>
              1. <strong>服务性质说明：</strong>软游部落为计算机技术爱好者社区与软件聚合导航平台。平台收取的 VIP 会员或单次技术服务费用，仅为<strong>服务器高速云带宽维护、原厂安装包安全哈希校验、防病毒扫描归档及专属安装运行库疑难排查的人工服务成本</strong>。
            </p>
            <p>
              2. <strong>绝对不包含商业软件版权费：</strong>上述服务费用<strong>绝不包含、亦绝不对标任何第三方商业软件之著作权授权使用费</strong>。正版商业软件（如各类商业开发套件、商业工业软件等）请广大用户主动向各自软件官方著作权人付费购买合法授权。
            </p>
            <p>
              3. <strong>官方外链 100% 永久免费：</strong>软游部落所收录的所有官方网站直链（如开源项目、原厂官网分发通道等）<strong>永久完全免费直达，任何访客无需注册登录或开通 VIP 均可直接免费跳转获取</strong>，平台绝不在官方直链上设立任何强制收费屏障。
            </p>
          </div>
        </div>
      </div>

      {/* 常见问题 FAQ */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>常见问题答疑</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white dark:bg-[#141F33] rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              购买之后如何使用高速下载通道？
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              登录成功后前往任意带有专属托管标签的软件详情页，点击“专属高速下载”按钮，系统将自动校验有效权益并实时生成专属短时防盗链 Token，无须等待广告直接全速下载。
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-[#141F33] rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              我的会员尚未到期，再次购买会顺延吗？
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              完全会自动顺延！软游部落的会员系统严格执行累加机制。若您当前月度会员还剩 15 天，此时续费 30 天月度会员，到期时间将在原有基础上直接增加 30 天，剩余总有效时长为 45 天。
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-[#141F33] rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              支付支持哪些支付方式？
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              支持标准微信扫码支付。支付收银台支持手机扫码或一键唤起；测试沙箱环境下亦提供模拟扫码通道，方便体验完整业务闭环。
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-[#141F33] rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              如何申请退款与保障流程？
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              在个人中心“我的订单”列表中，针对已付款订单点击“申请退款”并填写说明，客服人员将在 1-2 个工作日内核实，审核通过后系统将原路将资金全额退回您的原支付渠道。
            </p>
          </div>
        </div>
      </div>

      {/* 登录弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(data) => {
          setMember(data.member);
          setIsVip(data.isVip);
        }}
      />
    </div>
  );
};
