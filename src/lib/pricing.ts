import type { CompanySettings } from "@/types/settings";

const round = (value: number) => Math.round(value * 100) / 100;

/** VAT on top of a selling price; 0 when the company charges none */
export const vatOf = (price: number, settings: Pick<CompanySettings, "vatEnabled" | "vatRate"> | undefined) =>
  // Rounded like the server does, from the whole price
  settings?.vatEnabled
    ? round(Math.round((Math.round(price * 100) * (10000 + Math.round(settings.vatRate * 100))) / 10000) / 100 - price)
    : 0;

export const customerPrice = (price: number | null, settings: Pick<CompanySettings, "vatEnabled" | "vatRate"> | undefined) =>
  price === null ? null : round(price + vatOf(price, settings));

/** Profit of one unit. VAT is not profit: it goes to the tax office. */
export const profitOf = (price: number, cost: number) => {
  const amount = round(price - cost);
  return {
    amount,
    /** Percent of the cost; null when the unit cost nothing */
    percent: cost > 0 ? round((amount / cost) * 100) : null,
  };
};
