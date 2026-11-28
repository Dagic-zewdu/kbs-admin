import type { ChannelRef, MethodRef } from "./company-lists";
import type { DelivererType } from "./deliverer";
import type { ProductStatus } from "./product";

export type SaleStatus = "completed" | "cancelled" | "returned" | "partly_returned";
export type SalePaymentStatus = "paid" | "partial" | "unpaid" | "refund_due" | "none";
export type DeliveryStatus = "pending" | "on_the_way" | "delivered" | "failed" | "returned" | "cancelled";
export type ReturnReason = "changed_mind" | "damaged" | "wrong_item" | "expired" | "other";
export type SaleProblem = "STATUS" | "NO_PRICE" | "OUT_OF_STOCK";

/** A scanned product with all its variations */
export interface SaleLookup {
  code: string;
  matchedBy: "barcode" | "sku";
  scannedVariationId: string;
  product: { id: string; name: string; brand: string | null; status: ProductStatus; photoUrl: string | null };
  variations: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    price: number | null;
    customerPrice: number | null;
    onHand: number;
    nextExpiry: string | null;
    canBeSold: boolean;
    problem: SaleProblem | null;
  }[];
}

export interface SaleMoney {
  grossTotal: number;
  discountTotal: number;
  linesTotal: number;
  vatRate: number;
  vatAmount: number;
  returnedTotal: number;
  returnedVat: number;
  deliveryCharge: number;
  total: number;
  paid: number;
  left: number;
  toRefund: number;
  paymentStatus: SalePaymentStatus;
  cost: number;
  profit: number;
  profitPercent: number | null;
}

export interface SaleDelivery {
  id: string;
  status: DeliveryStatus;
  deliverer: { id: string; name: string | null; type: DelivererType | null };
  address: string;
  totalFee: number;
  companyShare: number;
  customerShare: number;
  cashOnDelivery: boolean;
  statusNote: string | null;
  onTheWayAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  returnedAt: string | null;
}

export interface SaleSummary {
  id: string;
  number: number;
  code: string;
  soldAt: string;
  channel: ChannelRef | null;
  /** Came from a live video (TikTok …) */
  fromLive: boolean;
  /** When the customer first contacted us; soldAt is the sale time */
  contactedAt: string | null;
  status: SaleStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  customer: { name: string | null; phone: string | null };
  seller: { id: string; name: string | null } | null;
  money: SaleMoney;
  delivery: SaleDelivery | null;
}

export interface SaleItem {
  id: string;
  variationId: string;
  productName: string;
  variationName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: { amount: number; percent: number | null; reason: string | null } | null;
  lineTotal: number;
  cost: number;
  profit: number;
  returned: { quantity: number; total: number; restockedCost: number };
  batches: { batchId: string; quantity: number; returnedQuantity: number; unitCost: number; expiryDate: string | null; batchNumber: string | null }[];
}

export interface SalePayment {
  id: string;
  amount: number;
  method: MethodRef;
  paidOn: string;
  note: string | null;
  isRefund: boolean;
  viaDeliverer: { id: string; name: string } | null;
  by: string | null;
  createdAt: string;
}

export interface SaleReturn {
  id: string;
  reason: ReturnReason;
  note: string | null;
  total: number;
  vat: number;
  items: { saleItemId: string; productName: string | null; variationName: string | null; quantity: number; damaged: boolean; total: number }[];
  by: string | null;
  createdAt: string;
}

export interface Sale extends SaleSummary {
  note: string | null;
  items: SaleItem[];
  payments: SalePayment[];
  returns: SaleReturn[];
}

export interface SaleListItem extends SaleSummary {
  units: number;
  lines: number;
}

export interface SaleInput {
  items: { variationId: string; quantity: number; discount: { type: "amount" | "percent"; value: number; reason: string } | null }[];
  channelId: string;
  fromLive: boolean;
  contactedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  note: string | null;
  payments: { amount: number; methodId: string; note: string | null }[];
  delivery: { delivererId: string; address: string; totalFee: number; companyShare: number; cashOnDelivery: boolean } | null;
}

export interface SalesQuery {
  page: number;
  limit: number;
  search?: string;
  from?: string;
  to?: string;
  channelId?: string;
  status?: SaleStatus;
  paymentStatus?: SalePaymentStatus;
  deliveryStatus?: DeliveryStatus | "none";
  delivererId?: string;
}

export const saleStatusLabels: Record<SaleStatus, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  returned: "Returned",
  partly_returned: "Partly returned",
};

export const salePaymentStatusLabels: Record<SalePaymentStatus, string> = {
  paid: "Paid",
  partial: "Partly paid",
  unpaid: "Not paid",
  refund_due: "Refund due",
  none: "Nothing to pay",
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: "Pending",
  on_the_way: "On the way",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const returnReasonLabels: Record<ReturnReason, string> = {
  changed_mind: "Changed their mind",
  damaged: "Damaged",
  wrong_item: "Wrong item",
  expired: "Expired",
  other: "Other",
};

export const saleProblemLabels: Record<SaleProblem, string> = {
  STATUS: "Draft or inactive",
  NO_PRICE: "No selling price",
  OUT_OF_STOCK: "Out of stock",
};

/** Why a scanned product can't be sold, in plain words */
export const problemText = (problem: SaleProblem, productStatus?: ProductStatus) =>
  problem === "STATUS"
    ? productStatus === "draft"
      ? "Not active: it is still a draft. Make it private or live to sell it."
      : "Not active: this product is inactive."
    : problem === "NO_PRICE"
      ? "Not available: it has no selling price yet."
      : "Not available: out of stock.";
