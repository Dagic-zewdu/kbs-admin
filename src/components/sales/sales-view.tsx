"use client";

import clsx from "clsx";
import { Bike, ChevronRight, Eye, Loader2, Plus, Printer, Search, ShoppingBag, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { useListSalesQuery } from "@/store/api/sales.api";
import { Alert } from "@/components/ui/alert";
import { useListChannelsQuery } from "@/store/api/settings.api";
import type { SaleListItem, SalePaymentStatus, SalesQuery } from "@/types/sale";
import { RevertSaleDialog } from "./sale-dialogs";
import { DeliveryStatusBadge, formatTime, PaymentStatusBadge, SaleStatusBadge } from "./sale-badges";

const PAGE_SIZE = 20;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
const daysAgo = (days: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date(Date.now() - days * 86_400_000));

type Period = "today" | "week" | "month" | "all" | "custom";
const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
  { value: "all", label: "All" },
  { value: "custom", label: "Dates" },
];

const paymentFilters: { value: SalePaymentStatus | ""; label: string }[] = [
  { value: "", label: "Any payment" },
  { value: "unpaid", label: "Not paid" },
  { value: "partial", label: "Partly paid" },
  { value: "paid", label: "Paid" },
  { value: "refund_due", label: "Refund due" },
];

const chip = (isOn: boolean) =>
  clsx(
    "min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
    isOn ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
  );
const selectClasses = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

/** Still open, and not on its way (that one is reverted when it comes back) */
const canRevert = (sale: SaleListItem) => (sale.status === "completed" || sale.status === "partly_returned") && sale.delivery?.status !== "on_the_way" && sale.delivery?.status !== "returned";

/** Every sale, newest first, with what was sold, paid and earned */
export function SalesView() {
  const [searchText, setSearchText] = useState("");
  const [period, setPeriod] = useState<Period>("today");
  const [range, setRange] = useState({ from: daysAgo(7), to: today() });
  const [channel, setChannel] = useState("");
  const [reverting, setReverting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const { data: channelData } = useListChannelsQuery({ all: true });
  const [paymentStatus, setPaymentStatus] = useState<SalePaymentStatus | "">("");
  const [delivery, setDelivery] = useState<SalesQuery["deliveryStatus"] | "">("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());

  const dates =
    period === "today" ? { from: today(), to: today() } : period === "week" ? { from: daysAgo(6), to: today() } : period === "month" ? { from: daysAgo(29), to: today() } : period === "custom" ? range : {};
  const { data, isLoading, isFetching, error } = useListSalesQuery({
    page,
    limit: PAGE_SIZE,
    search,
    ...dates,
    channelId: channel || undefined,
    paymentStatus: paymentStatus || undefined,
    deliveryStatus: delivery || undefined,
  });
  const result = data?.data;
  const reset = () => setPage(1);

  const newSale = (
    <Link href="/sales/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10">
      <Plus className="size-4" aria-hidden /> New sale
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Sales" description="Every sale, what was paid, and the profit after costs and our delivery share." actions={newSale} />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Sales", value: result ? String(result.summary.sales) : "…" },
          { label: "Customers pay", value: result ? formatPrice(result.summary.total) : "…" },
          { label: "Profit", value: result ? formatPrice(result.summary.profit) : "…", tone: result && result.summary.profit < 0 ? "red" : undefined },
          {
            label: result?.summary.toRefund ? "Left to collect · to refund" : "Left to collect",
            value: result ? (result.summary.toRefund ? `${formatPrice(result.summary.left)} · ${formatPrice(result.summary.toRefund)}` : formatPrice(result.summary.left)) : "…",
            tone: result?.summary.left ? "amber" : undefined,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd className={clsx("mt-1 text-lg font-semibold", item.tone === "red" ? "text-red-700" : item.tone === "amber" ? "text-amber-800" : "text-gray-900")}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search sales</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              reset();
            }}
            placeholder="Sale number, customer name or phone"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={period === item.value}
              onClick={() => {
                setPeriod(item.value);
                reset();
              }}
              className={chip(period === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input type="date" value={range.from} max={range.to} onChange={(event) => setRange({ ...range, from: event.target.value })} aria-label="From" className={selectClasses} />
            <span className="text-gray-500">to</span>
            <input type="date" value={range.to} min={range.from} max={today()} onChange={(event) => setRange({ ...range, to: event.target.value })} aria-label="To" className={selectClasses} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <select value={channel} onChange={(event) => (setChannel(event.target.value), reset())} aria-label="Channel" className={selectClasses}>
            <option value="">Every channel</option>
            {(channelData?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={paymentStatus} onChange={(event) => (setPaymentStatus(event.target.value as SalePaymentStatus | ""), reset())} aria-label="Payment" className={selectClasses}>
            {paymentFilters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select value={delivery} onChange={(event) => (setDelivery(event.target.value as SalesQuery["deliveryStatus"] | ""), reset())} aria-label="Delivery" className={selectClasses}>
            <option value="">Pickup and delivery</option>
            <option value="none">Pickup only</option>
            <option value="pending">Delivery pending</option>
            <option value="on_the_way">On the way</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Delivery failed</option>
            <option value="returned">Delivery returned</option>
          </select>
        </div>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {reverting && (
        <RevertSaleDialog
          saleId={reverting}
          onClose={() => setReverting(null)}
          onDone={(message) => {
            setReverting(null);
            setNotice(message);
          }}
        />
      )}
      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute top-3 right-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <ShoppingBag className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">No sales here</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Change the dates or filters, or make a sale.</p>
            <div className="mt-5">{newSale}</div>
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            {/* Phones: one card per sale */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {result.items.map((sale) => (
                <li key={sale.id}>
                  <Link href={`/sales/${sale.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{sale.code}</span>
                        {sale.status !== "completed" && <SaleStatusBadge status={sale.status} />}
                        <PaymentStatusBadge status={sale.money.paymentStatus} />
                        {sale.delivery && (
                          <span className="inline-flex items-center gap-1">
                            <Bike className="size-3.5 text-gray-400" aria-hidden />
                            <DeliveryStatusBadge status={sale.delivery.status} />
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-gray-500">
                        {[formatTime(sale.soldAt), sale.customer.name, sale.channel?.name, `${sale.units} ${sale.units === 1 ? "unit" : "units"}`, sale.seller?.name].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      <span className="block font-semibold text-gray-900">{formatPrice(sale.money.total)}</span>
                      <span className={clsx("block text-xs", sale.money.profit < 0 ? "text-red-700" : "text-gray-500")}>Profit {formatPrice(sale.money.profit)}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-gray-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            {/* Bigger screens: a table with actions */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Sale</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Channel</th>
                    <th className="px-3 py-3 text-right">Units</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Paid</th>
                    <th className="px-3 py-3 text-right">Left</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Delivery</th>
                    <th className="px-3 py-3 text-right">Profit</th>
                    <th className="px-3 py-3">Seller</th>
                    <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.items.map((sale) => (
                    <tr key={sale.id} className={clsx("hover:bg-gray-50", sale.status === "cancelled" && "text-gray-400")}>
                      <td className="px-4 py-3">
                        <Link href={`/sales/${sale.id}`} className="font-medium text-gray-900 hover:text-brand-700 hover:underline">
                          {sale.code}
                        </Link>
                        {sale.status !== "completed" && (
                          <span className="mt-1 block">
                            <SaleStatusBadge status={sale.status} />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600">{formatTime(sale.soldAt)}</td>
                      <td className="px-3 py-3">
                        <span className="block text-gray-900">{sale.customer.name ?? "Walk-in"}</span>
                        {sale.customer.phone && <span className="block text-xs text-gray-500">{sale.customer.phone}</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{sale.channel?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{sale.units}</td>
                      <td className="px-3 py-3 text-right font-medium whitespace-nowrap text-gray-900 tabular-nums">{formatPrice(sale.money.total)}</td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatPrice(sale.money.paid)}</td>
                      <td className={clsx("px-3 py-3 text-right whitespace-nowrap tabular-nums", sale.money.toRefund > 0 ? "text-violet-800" : sale.money.left > 0 ? "text-amber-800" : "")}>
                        {sale.money.toRefund > 0 ? `−${formatPrice(sale.money.toRefund)}` : formatPrice(sale.money.left)}
                      </td>
                      <td className="px-3 py-3">
                        <PaymentStatusBadge status={sale.money.paymentStatus} />
                      </td>
                      <td className="px-3 py-3">{sale.delivery ? <DeliveryStatusBadge status={sale.delivery.status} /> : <span className="text-xs text-gray-500">Pickup</span>}</td>
                      <td className={clsx("px-3 py-3 text-right whitespace-nowrap tabular-nums", sale.money.profit < 0 ? "text-red-700" : "text-emerald-700")}>{formatPrice(sale.money.profit)}</td>
                      <td className="px-3 py-3 text-gray-600">{sale.seller?.name ?? "—"}</td>
                      <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">
                        <div className="flex justify-end gap-1">
                          <Link href={`/sales/${sale.id}`} aria-label={`View ${sale.code}`} title="View" className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                            <Eye className="size-4" aria-hidden />
                          </Link>
                          <Link href={`/sales/${sale.id}/receipt`} aria-label={`Receipt of ${sale.code}`} title="Receipt" className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                            <Printer className="size-4" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setReverting(sale.id)}
                            disabled={!canRevert(sale)}
                            aria-label={`Revert ${sale.code}`}
                            title={canRevert(sale) ? "Revert sale" : "Can't be reverted"}
                            className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Undo2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
