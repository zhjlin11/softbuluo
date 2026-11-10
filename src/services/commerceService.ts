import {
  ProductItem,
  OrderItem,
  MemberProfile,
  MemberMeResponse,
  EntitlementItem,
  RefundItem,
} from '../types/commerce';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // 携带 session cookie
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    const errorMsg = data?.error?.message || data?.message || `请求失败 (${res.status})`;
    const error: any = new Error(errorMsg);
    error.code = data?.error?.code || 'FETCH_ERROR';
    error.status = res.status;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

// ----------------------------------------------------
// 1. 商品相关
// ----------------------------------------------------
export async function getProducts(): Promise<ProductItem[]> {
  return fetchJson<ProductItem[]>(`${API_BASE}/products`);
}

export async function getProduct(identifier: string): Promise<ProductItem> {
  return fetchJson<ProductItem>(`${API_BASE}/products/${identifier}`);
}

// ----------------------------------------------------
// 2. 会员账号与身份鉴权
// ----------------------------------------------------
export async function registerMember(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<{ member: MemberProfile; isVip: boolean; vipExpiresAt: string | null }> {
  const data = await fetchJson<{ member: MemberProfile; isVip: boolean; vipExpiresAt: string | null }>(`${API_BASE}/members/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('softtribe-auth-updated'));
  }
  return data;
}

export async function loginMember(payload: {
  account: string;
  password: string;
}): Promise<{ member: MemberProfile; isVip: boolean; vipExpiresAt: string | null }> {
  const data = await fetchJson<{ member: MemberProfile; isVip: boolean; vipExpiresAt: string | null }>(`${API_BASE}/members/login`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('softtribe-auth-updated'));
  }
  return data;
}

export async function logoutMember(): Promise<{ success: boolean; message: string }> {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_USER_DATA' });
    }
  } catch {}
  const res = await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/members/logout`, {
    method: 'POST',
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('softtribe-auth-updated'));
  }
  return res;
}

export async function getMemberProfile(): Promise<MemberMeResponse> {
  return fetchJson<MemberMeResponse>(`${API_BASE}/members/me`);
}

export async function changeMemberPassword(payload: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${API_BASE}/members/password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMemberEntitlements(): Promise<EntitlementItem[]> {
  return fetchJson<EntitlementItem[]>(`${API_BASE}/members/entitlements`);
}

// ----------------------------------------------------
// 3. 订单与收银
// ----------------------------------------------------
export async function createOrder(
  productId: string,
  quantity: number = 1
): Promise<{
  orderNo: string;
  productName: string;
  totalAmountFen: number;
  totalAmountYuan: string;
  status: string;
  expiresAt: string;
  codeUrl?: string;
  createdAt: string;
}> {
  return fetchJson(`${API_BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function getMemberOrders(): Promise<OrderItem[]> {
  return fetchJson<OrderItem[]>(`${API_BASE}/orders`);
}

export async function getOrderDetail(orderNo: string): Promise<OrderItem> {
  return fetchJson<OrderItem>(`${API_BASE}/orders/${orderNo}`);
}

export async function cancelOrder(orderNo: string): Promise<any> {
  return fetchJson(`${API_BASE}/orders/${orderNo}/cancel`, {
    method: 'POST',
  });
}

// ----------------------------------------------------
// 4. 支付与模拟收银通道
// ----------------------------------------------------
export async function requestNativePay(orderNo: string): Promise<{
  orderNo: string;
  codeUrl: string;
  totalAmountFen: number;
  totalAmountYuan: string;
  productName: string;
  expiresAt: string;
  paymentMode: string;
}> {
  return fetchJson(`${API_BASE}/payments/native/${orderNo}`, {
    method: 'POST',
  });
}

export async function mockPay(orderNo: string): Promise<{
  orderNo: string;
  status: string;
  paidAt: string;
  transactionId: string;
  isDuplicate?: boolean;
}> {
  return fetchJson(`${API_BASE}/payments/mock-pay/${orderNo}`, {
    method: 'POST',
  });
}

export async function queryPaymentStatus(orderNo: string): Promise<{
  orderNo: string;
  status: string;
  isPaid: boolean;
  paidAt?: string;
  transactionId?: string;
}> {
  return fetchJson(`${API_BASE}/payments/query/${orderNo}`);
}

// ----------------------------------------------------
// 5. 退款相关
// ----------------------------------------------------
export async function requestRefund(
  orderNo: string,
  reason: string
): Promise<{
  refundNo: string;
  orderNo: string;
  amountFen: number;
  amountYuan: string;
  status: string;
  createdAt: string;
}> {
  return fetchJson(`${API_BASE}/refunds`, {
    method: 'POST',
    body: JSON.stringify({ orderNo, reason }),
  });
}

export async function getMemberRefunds(): Promise<RefundItem[]> {
  return fetchJson<RefundItem[]>(`${API_BASE}/refunds`);
}

// ----------------------------------------------------
// 6. 授权下载与鉴权
// ----------------------------------------------------
export async function authorizeDownload(
  softwareId: string,
  sourceId: string
): Promise<{
  authorized: boolean;
  isOfficialExternal?: boolean;
  directUrl?: string;
  downloadToken?: string;
  expiresAt?: string;
  downloadUrl?: string;
  notice?: string;
}> {
  return fetchJson(`${API_BASE}/downloads/authorize`, {
    method: 'POST',
    body: JSON.stringify({ softwareId, sourceId }),
  });
}
