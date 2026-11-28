
/** One line of the cart */
export interface CartLine {
  variationId: string;
  productName: string;
  variationName: string;
  sku: string;
  price: number;
  onHand: number;
  quantity: number;
  discount: { type: "amount" | "percent"; value: string; reason: string } | null;
}

export interface SaleDraft {
  lines: CartLine[];
  /** "" = Walk-in customer */
  channelId: string;
  /** Came from a live video */
  fromLive: boolean;
  /** "2026-11-28T20:15" in Ethiopian time, "" = not given */
  contactedAt: string;
  customerName: string;
  customerPhone: string;
  note: string;
  mode: "pickup" | "delivery";
  delivery: { delivererId: string | null; delivererName: string; address: string; totalFee: string; companyShare: string; cashOnDelivery: boolean };
  pay: "full" | "part" | "none";
  /** "" = Cash */
  methodId: string;
  partAmount: string;
}

export const emptySaleDraft = (): SaleDraft => ({
  lines: [],
  channelId: "",
  fromLive: false,
  contactedAt: "",
  customerName: "",
  customerPhone: "",
  note: "",
  mode: "pickup",
  delivery: { delivererId: null, delivererName: "", address: "", totalFee: "", companyShare: "", cashOnDelivery: true },
  pay: "full",
  methodId: "",
  partAmount: "",
});

/** The cart stays on this device until the sale is completed or cleared */
const keyOf = (userId: string) => `kbs.saleDraft:${userId}`;

export const saleDraftStore = {
  read(userId: string): SaleDraft | null {
    try {
      const raw = window.localStorage.getItem(keyOf(userId));
      return raw ? { ...emptySaleDraft(), ...(JSON.parse(raw) as SaleDraft) } : null;
    } catch {
      return null;
    }
  },
  write(userId: string, draft: SaleDraft) {
    try {
      window.localStorage.setItem(keyOf(userId), JSON.stringify(draft));
    } catch {
      // Storage full or blocked: the cart still works, it just isn't kept
    }
  },
  clear(userId: string) {
    try {
      window.localStorage.removeItem(keyOf(userId));
    } catch {
      // nothing to do
    }
  },
};

// Money in cents, like the server, so totals match to the cent
export const cents = (value: number) => Math.round(value * 100);
export const birr = (value: number) => value / 100;
export const amountOf = (text: string) => (text.trim() === "" ? 0 : Number(text));

export const lineMoney = (line: CartLine) => {
  const gross = cents(line.price) * line.quantity;
  const value = line.discount ? amountOf(line.discount.value) : 0;
  const discount = !line.discount || !(value > 0) ? 0 : line.discount.type === "percent" ? Math.round((gross * Math.min(value, 100)) / 100) : cents(value);
  return { gross, discount, total: gross - discount };
};
