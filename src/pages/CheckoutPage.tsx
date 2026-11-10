import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  getOrderDetail,
  requestNativePay,
  mockPay,
  queryPaymentStatus,
  cancelOrder,
} from '../services/commerceService';
import { OrderItem } from '../types/commerce';

export const CheckoutPage: React.FC = () => {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isProcessingMockPay, setIsProcessingMockPay] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<string>('MOCK');

  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!orderNo) return;
    document.title = `收银台 - 订单 ${orderNo} - 软游部落`;

    // 1. 获取订单详情并请求支付参数
    setIsLoading(true);
    getOrderDetail(orderNo)
      .then(async (data) => {
        setOrder(data);
        if (data.status === 'PAID') {
          setIsPaid(true);
        } else if (data.status === 'PENDING_PAYMENT') {
          // 计算倒计时
          const expireTime = new Date(data.expiresAt).getTime();
          const remainSec = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
          setTimeLeftSec(remainSec);

          // 请求 Native 支付参数
          try {
            const payData = await requestNativePay(orderNo);
            setPaymentMode(payData.paymentMode || 'MOCK');
          } catch (e) {
            console.warn('Native pay init:', e);
          }
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || '获取订单信息失败');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [orderNo]);

  // 倒计时计时器
  useEffect(() => {
    if (timeLeftSec <= 0 || isPaid) return;
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSec, isPaid]);

  // 自动轮询支付结果 (每 2 秒一次)
  useEffect(() => {
    if (!orderNo || isPaid) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const queryRes = await queryPaymentStatus(orderNo);
        if (queryRes.isPaid) {
          setIsPaid(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (err) {
        // 忽略网络瞬断轮询错误
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [orderNo, isPaid]);

  const handleMockPay = async () => {
    if (!orderNo) return;
    setIsProcessingMockPay(true);
    try {
      await mockPay(orderNo);
      setIsPaid(true);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    } catch (err: any) {
      setErrorMessage(err.message || '模拟支付处理失败');
    } finally {
      setIsProcessingMockPay(false);
    }
  };

  const handleCancel = async () => {
    if (!orderNo) return;
    if (!window.confirm('确定要取消该笔订单吗？')) return;
    try {
      await cancelOrder(orderNo);
      navigate('/account');
    } catch (err: any) {
      setErrorMessage(err.message || '取消订单失败');
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#1769D2] mb-3" />
        <p className="text-xs">正在连接安全收银网关...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            订单异常
          </h2>
          <p className="text-xs text-slate-500 mb-5">{errorMessage || '未检索到该订单信息'}</p>
          <Link
            to="/membership"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回会员套餐选购</span>
          </Link>
        </div>
      </div>
    );
  }

  // 支付成功完成界面
  if (isPaid) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white dark:bg-[#141F33] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
            支付成功！
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            您的商户订单 <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{order.orderNo}</span> 已顺利完成结算，对应专属会员或下载权益已自动注入您的账户。
          </p>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 text-xs text-left mb-6 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">已购项目:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{order.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">结算金额:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">¥{order.totalAmountYuan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">支付渠道:</span>
              <span className="text-slate-700 dark:text-slate-300">微信支付 (Native 结算)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account"
              className="px-5 py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              进入个人中心查看看权益
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              返回首页发现好软件
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 订单超时关闭界面
  if (order.status === 'CLOSED' || timeLeftSec <= 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            订单已超时关闭
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            该订单已超过 15 分钟有效支付窗口，系统已自动关闭以保护价格一致性。
          </p>
          <Link
            to="/membership"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] text-white text-xs font-semibold rounded-lg"
          >
            <span>重新选购下单</span>
          </Link>
        </div>
      </div>
    );
  }

  // 正常待支付扫码界面
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
      {/* 顶部面包屑 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link to="/membership" className="hover:text-[#1769D2] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>会员套餐</span>
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-semibold">安全收银台</span>
      </nav>

      <div className="max-w-3xl mx-auto bg-white dark:bg-[#141F33] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* 收银台顶栏 */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">正在为您的账号结算</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {order.productName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              订单号: {order.orderNo}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">应付金额</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1769D2] dark:text-blue-400">
              ¥{order.totalAmountYuan}
            </div>
          </div>
        </div>

        {/* 支付内容区 */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* 左侧扫码核心 */}
          <div className="flex flex-col items-center text-center">
            {/* 倒计时提醒 */}
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full mb-4 font-mono font-semibold border border-amber-200/80 dark:border-amber-900/60">
              <Clock className="w-3.5 h-3.5" />
              <span>请在 {formatCountdown(timeLeftSec)} 内完成支付</span>
            </div>

            {/* 微信二维码容器 */}
            <div className="relative p-4 bg-white rounded-xl border-2 border-emerald-500/80 shadow-md mb-3 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-3 relative overflow-hidden">
                {/* 装饰性的二维码网格纹理 */}
                <QrCode className="w-36 h-36 text-white" />
                <div className="absolute inset-x-0 bottom-2 text-center text-[10px] bg-slate-950/80 py-0.5 font-sans text-emerald-400 font-bold">
                  微信扫一扫支付
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>打开手机微信 · 扫一扫二维码付款</span>
            </div>
          </div>

          {/* 右侧支付保障与测试模式工具箱 */}
          <div className="flex-1 w-full space-y-4 text-xs border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>支付后权益即刻生效</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                支付成功后本页面将自动感应并自动跳转，您无需刷新页面。您的会员与下载权益将实时到账。
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div>• 未消费前无理由极速退款保障</div>
                <div>• 软游安全网关 SSL 256 位防截获加密</div>
                <div>• 资金原路退款至付款微信零钱/储蓄卡</div>
              </div>
            </div>

            {/* 开发与沙箱环境模拟支付触发器 */}
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-300">沙箱开发测试通道</span>
                <span className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] rounded font-mono">
                  {paymentMode} MODE
                </span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                当前运行于开发测试模式，无需扣取真实资金，点击下方按钮即可模拟微信真实支付回调全流程：
              </p>
              <button
                type="button"
                onClick={handleMockPay}
                disabled={isProcessingMockPay}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
              >
                {isProcessingMockPay ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>模拟微信支付确认中...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>模拟微信支付成功 (Mock Pay ¥{order.totalAmountYuan})</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-400 hover:text-red-500 cursor-pointer text-xs"
              >
                取消订单
              </button>
              <span className="text-[11px] text-slate-400">收银状态实时轮询中...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
