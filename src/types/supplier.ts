import type { PaymentAccount, PaymentAccountInput } from "./payment-account";

export type SupplierVisibility = "private" | "shared";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "cash" | "bank_transfer" | "telebirr" | "cbe_birr" | "cheque" | "other";

export interface SupplierPhone {
  phone: string;
  label: string | null;
}

/** Our deliveries from it and what we paid. Private to our company. */
export interface SupplierMoney {
  deliveries: number;
  total: number;
  paid: number;
  owed: number;
  overdue: number;
  lastDelivery: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  phones: SupplierPhone[];
  accounts: PaymentAccount[];
  country: string;
  contactPerson: string | null;
  email: string | null;
  address: string | null;
  /** Only for the company that created it */
  notes: string | null;
  visibility: SupplierVisibility;
  isActive: boolean;
  /** company = shared by another company */
  createdBy: "us" | "company";
  createdAt: string;
}

export type SupplierWithMoney = Supplier & { money: SupplierMoney };

/** What a delivery costs and what was paid */
export interface DeliveryMoney {
  total: number;
  paid: number;
  left: number;
  status: PaymentStatus;
  payByDate: string | null;
  isOverdue: boolean;
}

export interface SupplierDelivery extends DeliveryMoney {
  id: string;
  product: { id: string; name: string };
  variation: { id: string; name: string; sku: string };
  quantity: number;
  unitCost: number | null;
  receivedDate: string;
}

export interface SupplierPayment {
  id: string;
  amount: number;
  paidOn: string;
  method: PaymentMethod;
  note: string | null;
  delivery: { id: string; productName: string | null; variationName: string | null; receivedDate: string | null };
  by: string | null;
  createdAt: string;
}

export interface SupplierInput {
  name: string;
  phones: SupplierPhone[];
  accounts: PaymentAccountInput[];
  country: string;
  contactPerson: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  visibility: SupplierVisibility;
}

export interface PaymentInput {
  amount: number;
  paidOn: string | null;
  method: PaymentMethod;
  note: string | null;
}

export type SupplierFilter = "all" | "owe" | "overdue" | "mine" | "shared" | "inactive";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  cheque: "Cheque",
  other: "Other",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partly paid",
  unpaid: "Not paid",
};
