"use client";

import { Loader2, Plus, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { useListBrandsQuery, type ListBrandsRequest } from "@/store/api/brands.api";
import { BrandsTable } from "./brands-table";

const PAGE_SIZE = 20;
const fieldClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

/** The shared brands in a table */
export function BrandsView() {
  const created = useSearchParams().get("created");
  const [searchText, setSearchText] = useState("");
  const [addedBy, setAddedBy] = useState<NonNullable<ListBrandsRequest["addedBy"]>>("all");
  const [sort, setSort] = useState<NonNullable<ListBrandsRequest["sort"]>>("name");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());
  const { data, isLoading, isFetching, error } = useListBrandsQuery({ page, limit: PAGE_SIZE, search, addedBy, sort });
  const result = data?.data;
  const isFiltered = Boolean(search) || addedBy !== "all";

  const createButton = (
    <Link
      href="/brands/new"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10"
    >
      <Plus className="size-4" aria-hidden /> Create brand
    </Link>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Brands" description="Shared by every company. Create a brand when it's missing." actions={createButton} />
      {created && <Alert type="success">{created} was created. Every company can use it now.</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search brands</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Search brands"
            className={`${fieldClasses} pl-9 pr-3`}
          />
        </label>
        <select
          aria-label="Filter by who added it"
          value={addedBy}
          onChange={(event) => {
            setAddedBy(event.target.value as typeof addedBy);
            setPage(1);
          }}
          className={`${fieldClasses} px-3 sm:w-44`}
        >
          <option value="all">All brands</option>
          <option value="us">Added by you</option>
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as typeof sort);
            setPage(1);
          }}
          className={`${fieldClasses} px-3 sm:w-40`}
        >
          <option value="name">Name A–Z</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-brand-500" aria-label="Updating" />}
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Tag className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{isFiltered ? "No brands match" : "No brands yet"}</p>
            {!isFiltered && <div className="mt-5">{createButton}</div>}
          </div>
        )}
        {result && result.items.length > 0 && (
          <>
            <BrandsTable brands={result.items} />
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
