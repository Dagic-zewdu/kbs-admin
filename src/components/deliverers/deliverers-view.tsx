"use client";

import clsx from "clsx";
import { Bike, Building2, ChevronRight, Loader2, Phone, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { useListDeliverersQuery, type DelivererStatusFilter } from "@/store/api/deliverers.api";
import { accountMethodShort } from "@/types/payment-account";
import type { DelivererType } from "@/types/deliverer";

const PAGE_SIZE = 20;

const statusFilters: { value: DelivererStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
  { value: "all", label: "All" },
];

const typeFilters: { value: "all" | DelivererType; label: string }[] = [
  { value: "all", label: "People and companies" },
  { value: "person", label: "People" },
  { value: "company", label: "Delivery companies" },
];

const chip = (isOn: boolean) =>
  clsx(
    "min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
    isOn ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
  );

/** Our deliverers, what we owe them and the cash they hold */
export function DeliverersView() {
  const params = useSearchParams();
  const deleted = params.get("deleted");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<DelivererStatusFilter>("active");
  const [type, setType] = useState<"all" | DelivererType>("all");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());
  const { data, isLoading, isFetching, error } = useListDeliverersQuery({ page, limit: PAGE_SIZE, search, status, type });
  const result = data?.data;
  const isFiltered = Boolean(search) || status !== "active" || type !== "all";

  const createButton = (
    <Link href="/deliverers/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10">
      <Plus className="size-4" aria-hidden /> Add deliverer
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Deliverers" description="People and delivery companies that bring sales to customers. Only your company sees them." actions={createButton} />
      {deleted && <Alert type="success">{deleted} was deleted.</Alert>}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <dt className="text-xs text-gray-500">Fees we owe</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{result ? formatPrice(Math.max(result.summary.feesOwed, 0)) : "…"}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <dt className="text-xs text-gray-500">Customer cash they hold</dt>
          <dd className={clsx("mt-1 text-lg font-semibold", result?.summary.cashHeld ? "text-amber-800" : "text-gray-900")}>{result ? formatPrice(result.summary.cashHeld) : "…"}</dd>
        </div>
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1">
          <dt className="text-xs text-gray-500">Open deliveries</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{result ? result.summary.openDeliveries : "…"}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search deliverers</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Name, phone or account number"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => {
                setStatus(item.value);
                setPage(1);
              }}
              className={chip(status === item.value)}
            >
              {item.label}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-gray-200 sm:block" aria-hidden />
          {typeFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={type === item.value}
              onClick={() => {
                setType(item.value);
                setPage(1);
              }}
              className={chip(type === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute top-3 right-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Bike className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{isFiltered ? "No deliverers match" : "No active deliverers"}</p>
            {!isFiltered && (
              <>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Add the people or delivery companies who take your sales to customers. Deactivated ones are under “Deactivated”.
                </p>
                <div className="mt-5">{createButton}</div>
              </>
            )}
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100">
              {result.items.map((deliverer) => {
                const Icon = deliverer.type === "company" ? Building2 : Bike;
                const main = deliverer.accounts[0];
                return (
                  <li key={deliverer.id}>
                    <Link href={`/deliverers/${deliverer.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-gray-900">{deliverer.name}</span>
                          {deliverer.type === "company" && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">Company</span>}
                          {!deliverer.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Deactivated</span>}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" aria-hidden /> {deliverer.phones[0]?.phone ?? "—"}
                            {deliverer.phones.length > 1 && ` +${deliverer.phones.length - 1}`}
                          </span>
                          {main && (
                            <span>
                              {accountMethodShort[main.method]} {main.accountNumber}
                            </span>
                          )}
                          {deliverer.money.openDeliveries > 0 && <span>{deliverer.money.openDeliveries} open</span>}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm">
                        {deliverer.money.cashHeld > 0 && <span className="block font-semibold text-amber-800">Holds {formatPrice(deliverer.money.cashHeld)}</span>}
                        {deliverer.money.feesOwed > 0 && <span className="block text-xs text-gray-600">We owe {formatPrice(deliverer.money.feesOwed)}</span>}
                        {deliverer.money.cashHeld <= 0 && deliverer.money.feesOwed <= 0 && (
                          <span className="text-xs text-gray-500">{deliverer.money.deliveries ? "Settled" : "No deliveries yet"}</span>
                        )}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-gray-300" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
