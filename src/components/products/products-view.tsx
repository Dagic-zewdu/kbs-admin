"use client";

import { ImageIcon, Loader2, Package, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { QuickScan } from "@/components/barcode/quick-scan";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { formatDate, formatPrice } from "@/lib/labels";
import { useListCategoriesQuery } from "@/store/api/categories.api";
import { useListProductsQuery, type ListProductsRequest } from "@/store/api/products.api";
import { categoryPath } from "@/types/category";
import type { ProductStatus, ProductSummary } from "@/types/product";
import { ProductActions } from "./product-actions";
import { ProductStatusBadge, statusLabels } from "./product-labels";

const PAGE_SIZE = 20;
const fieldClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

function MainPhoto({ product, className }: { product: ProductSummary; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${className}`}>
      {product.mainPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
        <img src={product.mainPhotoUrl} alt="" className="size-full object-contain" />
      ) : (
        <ImageIcon className="size-5 text-gray-300" aria-hidden />
      )}
    </span>
  );
}

const priceText = ({ priceFrom, priceTo }: ProductSummary) =>
  priceFrom !== null && priceTo !== null && priceFrom !== priceTo ? `${formatPrice(priceFrom)} – ${formatPrice(priceTo)}` : formatPrice(priceFrom);

const variationText = ({ variationType, variationsCount }: ProductSummary) =>
  variationType === "none" ? null : `${variationsCount} ${variationType}${variationsCount === 1 ? "" : "s"}`;

const SHOWN_CODES = 2;

/** SKU and barcode of each variation */
function Codes({ product }: { product: ProductSummary }) {
  const more = product.codes.length - SHOWN_CODES;
  return (
    <span className="block space-y-1 text-xs">
      {product.codes.slice(0, SHOWN_CODES).map((code) => (
        <span key={code.id} className="block whitespace-nowrap">
          <strong className="font-semibold text-gray-900">{code.sku}</strong>
          <span className="text-gray-500 md:block">
            <span className="md:hidden"> · </span>
            {code.barcode ?? "no barcode"}
            {code.otherBarcodes.length > 0 && <span title={code.otherBarcodes.join(", ")}> +{code.otherBarcodes.length}</span>}
          </span>
        </span>
      ))}
      {more > 0 && <span className="block text-gray-500">+{more} more</span>}
    </span>
  );
}

/** The company's products in a table (cards on phones) */
export function ProductsView() {
  const deleted = useSearchParams().get("deleted");
  const [notice, setNotice] = useState(deleted ? `${deleted} was deleted.` : "");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<ListProductsRequest["status"]>("all");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<ListProductsRequest["sort"]>("newest");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());
  const categories = useListCategoriesQuery();
  const { data, isLoading, isFetching, error } = useListProductsQuery({ page, limit: PAGE_SIZE, search, status, categoryId, sort });
  const result = data?.data;
  const isFiltered = Boolean(search) || status !== "all" || Boolean(categoryId);

  const actions = (product: ProductSummary) => (
    <ProductActions product={product} onDone={setNotice} onDeleted={(name) => setNotice(`${name} was deleted.`)} />
  );

  const createButton = (
    <Link
      href="/products/new"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10"
    >
      <Plus className="size-4" aria-hidden /> Add product
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Products" description="Your company's products. Other companies can't see them." actions={
          <>
            <QuickScan />
            {createButton}
          </>
        } />
      {notice && <Alert type="success">{notice}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_9rem_14rem_9rem]">
        <label className="relative sm:col-span-3 lg:col-span-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, brand, barcode or SKU"
            className={`${fieldClasses} pl-9 pr-3`}
          />
        </label>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          className={`${fieldClasses} px-3`}
        >
          <option value="all">All statuses</option>
          {(Object.keys(statusLabels) as ProductStatus[]).map((item) => (
            <option key={item} value={item}>
              {statusLabels[item]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          className={`${fieldClasses} px-3`}
        >
          <option value="">All categories</option>
          {categories.data?.data.map((category) => (
            <option key={category.id} value={category.id}>
              {categoryPath(category)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as typeof sort);
            setPage(1);
          }}
          className={`${fieldClasses} px-3`}
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Package className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{isFiltered ? "No products match" : "No products yet"}</p>
            {!isFiltered && <div className="mt-5">{createButton}</div>}
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100 md:hidden">
              {result.items.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.id}`} className="flex gap-3 px-4 pb-2 pt-4 active:bg-brand-50/40">
                    <MainPhoto product={product} className="size-16" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-medium text-gray-900">{product.name}</p>
                        <ProductStatusBadge status={product.status} />
                      </div>
                      <p className="break-words text-xs text-gray-500">
                        {[product.brand?.name, product.category?.path.join(" › ")].filter(Boolean).join(" · ") || "No brand or category yet"}
                      </p>
                      <p className="text-xs text-gray-700">
                        {priceText(product)} · {product.onHand} in stock
                      </p>
                      <Codes product={product} />
                    </div>
                  </Link>
                  <div className="flex justify-end px-2 pb-2">{actions(product)}</div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU · Barcode</th>
                    <th className="hidden px-4 py-3 font-medium xl:table-cell">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="hidden px-4 py-3 font-medium 2xl:table-cell">Added</th>
                    <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.items.map((product) => (
                    <tr key={product.id} className="hover:bg-brand-50/30">
                      <td className="max-w-64 px-4 py-3">
                        <Link href={`/products/${product.id}`} className="flex items-center gap-3">
                          <MainPhoto product={product} className="size-12" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-900 hover:text-brand-700">{product.name}</span>
                            <span className="block truncate text-xs text-gray-500">{[product.brand?.name ?? "No brand", variationText(product)].filter(Boolean).join(" · ")}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Codes product={product} />
                      </td>
                      <td className="hidden max-w-40 truncate xl:table-cell px-4 py-3 text-gray-600">{product.category?.path.join(" › ") ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900">{priceText(product)}</td>
                      <td className={`px-4 py-3 ${product.onHand === 0 ? "text-red-700" : "text-gray-900"}`}>{product.onHand}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <ProductStatusBadge status={product.status} />
                        {product.status === "draft" && product.missingToGoLive.length > 0 && (
                          <span className="mt-1 block text-xs text-gray-500">{product.missingToGoLive.length} missing</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-gray-600 2xl:table-cell">{formatDate(product.createdAt)}</td>
                      <td className="sticky right-0 bg-white px-2 py-2">
                        <span className="flex justify-end">{actions(product)}</span>
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
