/**
 * 软游部落 P2 商业化与会员系统前端类型定义
 */

export type ProductType =
  | 'SINGLE_SERVICE'
  | 'MONTHLY_MEMBERSHIP'
  | 'YEARLY_MEMBERSHIP'
  | 'LICENSED_DOWNLOAD'
  | 'TECHNICAL_SUPPORT';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  productType: ProductType;
  description: string;
  priceFen: number;
  priceYuan: string;
  originalPriceFen?: number | null;
  originalPriceYuan?: string | null;
  durationDays: number;
  sortOrder: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CLOSED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderNo: string;
  productName: string;
  productType: ProductType;
  totalAmountFen: number;
  totalAmountYuan: string;
  status: OrderStatus;
  payChannel?: string;
  transactionId?: string;
  codeUrl?: string;
  expiresAt: string;
  paidAt?: string;
  closedAt?: string;
  refundedAt?: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
  };
  refund?: {
    id: string;
    refundNo: string;
    status: string;
    amountFen: number;
  } | null;
}

export interface MemberProfile {
  id: string;
  username: string;
  email: string;
  status: string;
  avatarUrl?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface MemberMeResponse {
  member: MemberProfile;
  isVip: boolean;
  vipExpiresAt: string | null;
  activeEntitlementsCount?: number;
}

export interface EntitlementItem {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  entitlementType: string;
  resourceId?: string | null;
  startsAt: string;
  expiresAt?: string | null;
  quotaRemaining: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  product?: {
    name: string;
    productType: ProductType;
    description: string;
  };
}

export interface RefundItem {
  id: string;
  refundNo: string;
  orderNo: string;
  productName: string;
  amountFen: number;
  amountYuan: string;
  reason: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
  rejectReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
}
