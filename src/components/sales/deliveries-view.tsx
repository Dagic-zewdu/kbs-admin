"use client";

import clsx from "clsx";
import { Bike, ChevronRight, Loader2, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { useListDeliveriesQuery } from "@/store/api/sales.api";
import { deliveryStatusLabels, type DeliveryStatus } from "@/types/sale";
import { DeliveryStatusBadge, formatTime, PaymentStatusBadge } from "./sale-badges";

type Filter = "open" | "all" | DeliveryStatus;
const filters: Filter[] = ["open", "pending", "on_the_way", "failed", "delivered", "returned", "all"];
const filterLabel = (filter: Filter) => (filter === "open" ? "Open" : filter === "all" ? "All" : deliveryStatusLabels[filter]);

/** Deliveries to follow up: open ones oldest first, so nothing waits too long */
export function DeliveriesView() {
  const [filter, setFilter] = useState<Filter>("open");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useListDeliveriesQuery({ page, limit: 20, status: filter });
  const result = data?.data;
  const counts = result?.counts;
  const openCount = counts ? counts.pending + counts.on_the_way + counts.failed : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Deliveries" description="Sales on their way to customers. Open a sale to mark it on the way, delivered, failed or back." />
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((item) => {
          const count = item === "open" ? openCount : item === "all" || !counts ? null : counts[item];
          return (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
              className={clsx(
                "min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                filter === item ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
              )}
            >
              {filterLabel(item)}
              {count !== null && count !== undefined && <span className="ml-1.5 opacity-75">{count}</span>}
            </button>
          );
        })}
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute top-3 right-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Bike className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{filter === "open" ? "Nothing to deliver right now" : "No deliveries here"}</p>
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100">
              {result.items.map((sale) => (
                <li key={sale.id}>
                  <Link href={`/sales/${sale.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                    <span className="min-w-0 flex-1 space-y-0.5 text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{sale.code}</span>
                        {sale.delivery && <DeliveryStatusBadge status={sale.delivery.status} />}
                        <PaymentStatusBadge status={sale.money.paymentStatus} />
                        {sale.delivery?.cashOnDelivery && sale.money.left > 0 && <span className="text-xs font-medium text-amber-800">Collect {formatPrice(sale.money.left)}</span>}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                        <span className="truncate">{sale.delivery?.address}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 text-gray-500">
                        <span>{sale.customer.name}</span>
                        {sale.customer.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" aria-hidden /> {sale.customer.phone}
                          </span>
                        )}
                        <span>
                          <Bike className="mr-1 inline size-3.5" aria-hidden />
                          {sale.delivery?.deliverer.name}
                        </span>
                        <span>{formatTime(sale.soldAt)}</span>
                      </span>
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
