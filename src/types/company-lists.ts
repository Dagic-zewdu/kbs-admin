export type ChannelKind = "tiktok" | "telegram" | "instagram" | "facebook" | "phone" | "walk_in" | "whatsapp" | "website" | "other";
export type MethodType = "cash" | "wallet" | "bank" | "other";

/** Where customers come from: the company's own list (Settings) */
export interface SalesChannel {
  id: string;
  kind: ChannelKind;
  name: string;
  link: string | null;
  isActive: boolean;
  /** Walk-in customer: can't be hidden or deleted */
  isProtected: boolean;
}

/** A way money is paid: the company's own list (Settings) */
export interface PaymentMethodOption {
  id: string;
  type: MethodType;
  key: string | null;
  name: string;
  accountNumber: string | null;
  accountHolder: string | null;
  isActive: boolean;
  /** Cash: can't be switched off or deleted */
  isProtected: boolean;
}

/** Which method / channel a payment or sale used */
export interface MethodRef {
  id: string;
  name: string | null;
  type: MethodType | null;
}

export interface ChannelRef {
  id: string;
  name: string;
  kind: ChannelKind;
}

export const channelKindLabels: Record<ChannelKind, string> = {
  tiktok: "TikTok",
  telegram: "Telegram",
  instagram: "Instagram",
  facebook: "Facebook",
  phone: "Phone",
  walk_in: "Walk-in",
  whatsapp: "WhatsApp",
  website: "Website",
  other: "Other",
};

export const methodTypeLabels: Record<MethodType, string> = {
  cash: "Cash",
  wallet: "Wallets",
  bank: "Bank transfer",
  other: "Other",
};
