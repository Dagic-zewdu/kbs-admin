"use client";

import clsx from "clsx";
import { Boxes, Loader2, ScanBarcode, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScannerDialog } from "@/components/barcode/scanner-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { useListInventoryQuery } from "@/store/api/inventory.api";
import type { InventoryFilter, InventoryItem } from "@/types/inventory";

const PAGE_SIZE = 20;

const filters: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out of stock" },
  { value: "expiring", label: "Expiring in 90 days" },
  { value: "expired", label: "Expired" },
];

function OnHand({ item }: { item: InventoryItem }) {
  const { onHand, expired } = item.stock;
  return (
    <span>
      <span
        className={clsx("font-semibold", onHand === 0 ? "text-red-700" : onHand <= item.lowStockLevel ? "text-amber-700" : "text-gray-900")}
      >
        {onHand}
      </span>
      {onHand === 0 ? <span className="text-red-700"> out</span> : onHand <= item.lowStockLevel && <span className="text-amber-700"> low</span>}
      {expired > 0 && <span className="block text-xs text-red-700">{expired} expired</span>}
    </span>
  );
}

const title = (item: InventoryItem) => (item.name ? `${item.product.name} · ${item.name}` : item.product.name);

/** Stock of every variation, with alerts */
export function InventoryView() {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [page, setPage] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const search = useDebouncedValue(searchText.trim());
  const { data, isLoading, isFetching, error } = useListInventoryQuery({ page, limit: PAGE_SIZE, search, filter });
  const result = data?.data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Inventory" description="Stock is counted from batches. The batch that expires first is sold first." />

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search stock</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Search by product, SKU or barcode"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <Button type="button" variant="secondary" onClick={() => setIsScanning(true)} className="sm:h-11">
          <ScanBarcode className="size-4" aria-hidden /> Scan
        </Button>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
              "min-h-10 whitespace-nowrap rounded-full border px-3 text-sm font-medium",
              filter === item.value ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
            )}
          >
            {item.label} {result && <span className="opacity-70">{result.counts[item.value]}</span>}
          </button>
        ))}
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Boxes className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">
              {search || filter !== "all" ? "Nothing matches" : "No products yet"}
            </p>
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100 md:hidden">
              {result.items.map((item) => (
                <li key={item.id}>
                  <Link href={`/inventory/${item.id}`} className="flex justify-between gap-3 px-4 py-4 text-sm active:bg-brand-50/40">
                    <span className="min-w-0">
                      <span className="block break-words font-medium text-gray-900">{title(item)}</span>
                      <span className="block break-words text-xs text-gray-500">{item.sku}</span>
                      {item.stock.nextExpiry && <span className="block text-xs text-gray-500">Expires {formatDay(item.stock.nextExpiry)}</span>}
                    </span>
                    <span className="shrink-0 text-right">
                      <OnHand item={item} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Barcode</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">In stock</th>
                    <th className="px-4 py-3 font-medium">Next expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.items.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-50/30">
                      <td className="max-w-80 px-4 py-3">
                        <Link href={`/inventory/${item.id}`} className="block truncate font-medium text-gray-900 hover:text-brand-700">
                          {title(item)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{item.sku}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-gray-600 lg:table-cell">{item.barcode ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3">
                        <OnHand item={item} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDay(item.stock.nextExpiry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>

      {isScanning && (
        <ScannerDialog
          onClose={() => setIsScanning(false)}
          onScan={(barcode) => {
            setIsScanning(false);
            setSearchText(barcode);
            setFilter("all");
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
