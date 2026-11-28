import type { PaymentAccount, PaymentAccountInput } from "./payment-account";

export type DelivererType = "person" | "company";

export interface DelivererPhone {
  phone: string;
  label: string | null;
}

/** Trips, fees and the customer cash they hold */
export interface DelivererMoney {
  deliveries: number;
  openDeliveries: number;
  feesEarned: number;
  feesPaid: number;
  /** Below 0 = paid ahead */
  feesOwed: number;
  collected: number;
  handedIn: number;
  feesKeptFromCash: number;
  cashHeld: number;
}

export interface Deliverer {
  id: string;
  type: DelivererType;
  name: string;
  phones: DelivererPhone[];
  accounts: PaymentAccount[];
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DelivererWithMoney = Deliverer & { money: DelivererMoney };

export interface DelivererInput {
  type: DelivererType;
  name: string;
  phones: DelivererPhone[];
  accounts: PaymentAccountInput[];
  notes: string | null;
}

export const delivererTypeLabels: Record<DelivererType, string> = {
  person: "Person",
  company: "Delivery company",
};

/** A fee payment, a hand-in, or customer money they collected */
export interface DelivererMoneyEntry {
  id: string;
  kind: "fee_paid" | "fee_kept" | "handed_in" | "collected";
  amount: number;
  method: "cash" | "telebirr" | "cbe_birr" | "bank_transfer" | "other";
  date: string;
  note: string | null;
  sale: { id: string; code: string } | null;
  by: string | null;
  createdAt: string;
}

export const moneyKindLabels: Record<DelivererMoneyEntry["kind"], string> = {
  fee_paid: "Fee paid",
  fee_kept: "Fee kept from cash",
  handed_in: "Cash handed in",
  collected: "Collected from customer",
};
