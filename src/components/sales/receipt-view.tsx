"use client";

import clsx from "clsx";
import { Loader2, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useGetSaleQuery } from "@/store/api/sales.api";
import { useGetSettingsQuery } from "@/store/api/settings.api";
import { useAppSelector } from "@/store/hooks";
import type { Sale } from "@/types/sale";

type Paper = "80mm" | "a4";
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** What the customer takes home: never cost or profit */
function Receipt({ sale, companyName, paper }: { sale: Sale; companyName: string; paper: Paper }) {
  const { money: totals } = sale;
  const paid = sale.payments.filter((payment) => !payment.isRefund);
  const refunds = sale.payments.filter((payment) => payment.isRefund);
  const row = "flex justify-between gap-3";
  return (
    <div className={clsx("bg-white font-mono text-black", paper === "80mm" ? "w-[72mm] p-[2mm] text-[11px] leading-snug" : "mx-auto w-[180mm] p-[10mm] text-[13px] leading-normal")}>
      <div className="text-center">
        <p className={clsx("font-bold", paper === "80mm" ? "text-[14px]" : "text-[20px]")}>{companyName}</p>
        <p>Receipt {sale.code}</p>
        <p>{new Date(sale.soldAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        <p>
          {sale.channel?.name}
          {sale.seller?.name && ` · Served by ${sale.seller.name}`}
        </p>
        {sale.customer.name && <p>Customer: {sale.customer.name}</p>}
      </div>
      <hr className="my-2 border-dashed border-black" />
      {sale.items.map((item) => (
        <div key={item.id} className="mb-1.5">
          <p>{[item.productName, item.variationName].filter(Boolean).join(" · ")}</p>
          <div className={row}>
            <span>
              {item.quantity} × {money(item.unitPrice)}
            </span>
            <span>{money(item.quantity * item.unitPrice)}</span>
          </div>
          {item.discount && (
            <div className={row}>
              <span>Discount{item.discount.percent ? ` ${item.discount.percent}%` : ""}</span>
              <span>-{money(item.discount.amount)}</span>
            </div>
          )}
          {item.returned.quantity > 0 && <p>({item.returned.quantity} returned)</p>}
        </div>
      ))}
      <hr className="my-2 border-dashed border-black" />
      <div className={row}>
        <span>Subtotal</span>
        <span>{money(totals.linesTotal)}</span>
      </div>
      {totals.vatAmount > 0 && (
        <div className={row}>
          <span>VAT {totals.vatRate}%</span>
          <span>{money(totals.vatAmount)}</span>
        </div>
      )}
      {totals.returnedTotal > 0 && (
        <div className={row}>
          <span>Returned</span>
          <span>-{money(totals.returnedTotal + totals.returnedVat)}</span>
        </div>
      )}
      {sale.delivery && (
        <div className={row}>
          <span>Delivery</span>
          <span>{money(totals.deliveryCharge)}</span>
        </div>
      )}
      <div className={clsx(row, "mt-1 font-bold", paper === "80mm" ? "text-[13px]" : "text-[16px]")}>
        <span>TOTAL ETB</span>
        <span>{money(totals.total)}</span>
      </div>
      <hr className="my-2 border-dashed border-black" />
      {paid.map((payment) => (
        <div key={payment.id} className={row}>
          <span>Paid · {payment.method.name}</span>
          <span>{money(payment.amount)}</span>
        </div>
      ))}
      {refunds.map((payment) => (
        <div key={payment.id} className={row}>
          <span>Given back · {payment.method.name}</span>
          <span>-{money(payment.amount)}</span>
        </div>
      ))}
      {totals.left > 0 && (
        <div className={clsx(row, "font-bold")}>
          <span>Left to pay</span>
          <span>{money(totals.left)}</span>
        </div>
      )}
      {sale.status === "cancelled" && <p className="mt-1 text-center font-bold">CANCELLED</p>}
      {sale.delivery && <p className="mt-2">Deliver to: {sale.delivery.address}</p>}
      <p className="mt-3 text-center">Thank you!</p>
    </div>
  );
}

/** Preview and print a sale's receipt on a receipt printer (80 mm) or A4 */
export function ReceiptView({ id }: { id: string }) {
  const companyName = useAppSelector((state) => state.auth.user?.company?.name) ?? "";
  const router = useRouter();
  const params = useSearchParams();
  const printNow = params.get("print") === "1";
  const { data, isLoading, error } = useGetSaleQuery(id);
  const { data: settings } = useGetSettingsQuery();
  const [paperChoice, setPaper] = useState<Paper | null>(null);
  const paper: Paper = paperChoice ?? settings?.data.receiptPaper ?? "80mm";
  const hasPrinted = useRef(false);

  // Right after a sale (Settings: print the receipt): print once, then back to the sale
  useEffect(() => {
    if (!printNow || !data || !settings || hasPrinted.current) return;
    hasPrinted.current = true;
    const back = () => router.replace(`/sales/${id}?new=1`);
    window.addEventListener("afterprint", back, { once: true });
    // Let the receipt render first; not cancelled by a refetch, so it always prints once
    setTimeout(() => window.print(), 300);
  }, [printNow, data, settings, id, router]);
  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Sale not found"}</p>;
  const sale = data.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Receipt ${sale.code}`}
        description="No cost or profit is printed."
        backHref={`/sales/${id}`}
        actions={
          <Button type="button" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Print
          </Button>
        }
      />
      <div className="flex gap-1.5">
        {(
          [
            ["80mm", "Receipt printer (80 mm)"],
            ["a4", "A4 paper"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={paper === value}
            onClick={() => setPaper(value)}
            className={clsx(
              "min-h-9 rounded-full border px-3 text-sm font-medium",
              paper === value ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">In the print window choose the same paper, no margins and scale 100%. Choose “Save as PDF” to send it by Telegram.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-4">
        <div className="mx-auto w-fit shadow-sm">
          <Receipt sale={sale} companyName={companyName} paper={paper} />
        </div>
      </div>
      {createPortal(
        <div id="print-root" className="hidden">
          <style>{`@media print {
            @page { size: ${paper === "80mm" ? "80mm auto" : "A4"}; margin: 0; }
            html, body { margin: 0; min-height: 0 !important; background: #fff !important; }
            body > *:not(#print-root) { display: none !important; }
            #print-root { display: block !important; }
          }`}</style>
          <Receipt sale={sale} companyName={companyName} paper={paper} />
        </div>,
        document.body,
      )}
    </div>
  );
}
