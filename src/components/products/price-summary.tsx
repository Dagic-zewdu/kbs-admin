import clsx from "clsx";
import { formatPrice } from "@/lib/labels";
import { profitOf, vatOf } from "@/lib/pricing";
import type { CompanySettings } from "@/types/settings";

interface PriceSummaryProps {
  price: number | null;
  cost: number | null;
  settings: CompanySettings | undefined;
}

/** What one unit earns, and what the customer pays. For staff only. */
export function PriceSummary({ price, cost, settings }: PriceSummaryProps) {
  if (!price) return null;
  const profit = cost === null ? null : profitOf(price, cost);
  const vat = vatOf(price, settings);
  if (!profit && !settings?.vatEnabled) return <p className="text-xs text-gray-500">Enter the cost price to see the profit.</p>;

  return (
    <div aria-live="polite" className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-gray-50 p-3 text-sm">
      {profit ? (
        <div>
          <p className="text-xs text-gray-500">{profit.amount < 0 ? "Loss per unit" : "Profit per unit"}</p>
          <p className={clsx("font-semibold", profit.amount < 0 ? "text-red-700" : profit.amount === 0 ? "text-amber-700" : "text-emerald-700")}>
            {formatPrice(Math.abs(profit.amount))}
            {profit.percent !== null && <span className="font-normal"> · {Math.abs(profit.percent)}% of the cost</span>}
          </p>
        </div>
      ) : (
        <p className="self-center text-xs text-gray-500">Enter the cost price to see the profit.</p>
      )}
      {settings?.vatEnabled && (
        <>
          <div>
            <p className="text-xs text-gray-500">VAT {settings.vatRate}%</p>
            <p className="text-gray-900">{formatPrice(vat)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Customer pays</p>
            <p className="font-semibold text-gray-900">{formatPrice(price + vat)}</p>
          </div>
        </>
      )}
    </div>
  );
}
