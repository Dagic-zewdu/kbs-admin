export type AccountMethod = "cbe" | "awash" | "dashen" | "abyssinia" | "other_bank" | "telebirr" | "cbe_birr" | "mpesa" | "other";

/** A bank or mobile-money account we pay a deliverer or a supplier into */
export interface PaymentAccount {
  id: string;
  method: AccountMethod;
  accountNumber: string;
  holderName: string;
  /** Bank name for "other bank", or a note */
  label: string | null;
  isMain: boolean;
}

export interface PaymentAccountInput {
  method: AccountMethod;
  accountNumber: string;
  holderName: string;
  label: string | null;
  isMain: boolean;
}

export const accountMethodLabels: Record<AccountMethod, string> = {
  cbe: "CBE (Commercial Bank of Ethiopia)",
  awash: "Awash Bank",
  dashen: "Dashen Bank",
  abyssinia: "Bank of Abyssinia",
  other_bank: "Other bank",
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  mpesa: "M-Pesa",
  other: "Other",
};

/** Short names for lists */
export const accountMethodShort: Record<AccountMethod, string> = {
  cbe: "CBE",
  awash: "Awash",
  dashen: "Dashen",
  abyssinia: "Abyssinia",
  other_bank: "Bank",
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  mpesa: "M-Pesa",
  other: "Other",
};

export const MOBILE_MONEY: AccountMethod[] = ["telebirr", "cbe_birr", "mpesa"];
