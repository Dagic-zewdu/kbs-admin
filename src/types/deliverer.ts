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
