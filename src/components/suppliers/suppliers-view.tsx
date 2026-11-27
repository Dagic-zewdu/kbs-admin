"use client";

import clsx from "clsx";
import { ChevronRight, Globe2, Loader2, Phone, Plus, Search, Truck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { useListSuppliersQuery } from "@/store/api/suppliers.api";
import type { SupplierFilter } from "@/types/supplier";

const PAGE_SIZE = 20;

const filters: { value: SupplierFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owe", label: "We owe" },
  { value: "overdue", label: "Overdue" },
  { value: "mine", label: "Created by us" },
  { value: "shared", label: "Shared by others" },
  { value: "inactive", label: "Deactivated" },
];

/** Our suppliers and what we owe them */
export function SuppliersView() {
  const params = useSearchParams();
  const deleted = params.get("deleted");
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<SupplierFilter>("all");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());
  const { data, isLoading, isFetching, error } = useListSuppliersQuery({ page, limit: PAGE_SIZE, search, filter });
  const result = data?.data;

  const createButton = (
    <Link href="/suppliers/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10">
      <Plus className="size-4" aria-hidden /> Add supplier
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Suppliers" description="Who you buy stock from, and what you paid or still owe. Payments are private to your company." actions={createButton} />
      {deleted && <Alert type="success">{deleted} was deleted.</Alert>}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <dt className="text-xs text-gray-500">We owe</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{result ? formatPrice(result.summary.owed) : "…"}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <dt className="text-xs text-gray-500">Overdue</dt>
          <dd className={clsx("mt-1 text-lg font-semibold", result?.summary.overdue ? "text-red-700" : "text-gray-900")}>{result ? formatPrice(result.summary.overdue) : "…"}</dd>
        </div>
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1">
          <dt className="text-xs text-gray-500">Suppliers we owe</dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900">{result ? result.summary.suppliersOwed : "…"}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search suppliers</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Name, contact person or phone"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => {
                setFilter(item.value);
                setPage(1);
              }}
              className={clsx(
                "min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                filter === item.value ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
              )}
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
            <Truck className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{search || filter !== "all" ? "No suppliers match" : "No suppliers yet"}</p>
            {!search && filter === "all" && (
              <>
                <p className="mt-1 max-w-sm text-sm text-gray-500">Add your suppliers here, or create one when you add stock to a product.</p>
                <div className="mt-5">{createButton}</div>
              </>
            )}
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100">
              {result.items.map((supplier) => (
                <li key={supplier.id}>
                  <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Truck className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-gray-900">{supplier.name}</span>
                        {supplier.visibility === "shared" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                            <Globe2 className="size-3" aria-hidden /> {supplier.createdBy === "us" ? "Shared" : "Shared by another company"}
                          </span>
                        )}
                        {!supplier.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Deactivated</span>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" aria-hidden /> {supplier.phones[0]?.phone ?? "—"}
                          {supplier.phones.length > 1 && ` +${supplier.phones.length - 1}`}
                        </span>
                        <span>{supplier.country}</span>
                        {supplier.money.lastDelivery && <span>Last delivery {formatDay(supplier.money.lastDelivery)}</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      {supplier.money.owed > 0 ? (
                        <>
                          <span className={clsx("block font-semibold", supplier.money.overdue > 0 ? "text-red-700" : "text-amber-800")}>{formatPrice(supplier.money.owed)}</span>
                          <span className="block text-xs text-gray-500">{supplier.money.overdue > 0 ? `${formatPrice(supplier.money.overdue)} overdue` : "we owe"}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">{supplier.money.deliveries ? "Nothing owed" : "No deliveries yet"}</span>
                      )}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-gray-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
