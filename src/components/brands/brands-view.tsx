"use client";

import { Loader2, Tag } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getErrorMessage } from "@/lib/api-error";
import { useListBrandsQuery } from "@/store/api/brands.api";
import type { Brand } from "@/types/brand";
import { BrandLogo } from "./brand-logo";
import { BrandSelect } from "./brand-select";

const PAGE_SIZE = 24;

/** The shared brands. Find one, or create it when it doesn't exist. */
export function BrandsView() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { data, isLoading, error } = useListBrandsQuery({ page, limit: PAGE_SIZE });
  const result = data?.data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Brands" description="Shared by every company. Use an existing brand, or create one when it's missing." />

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <BrandSelect
          label="Find or create a brand"
          value={selected}
          onChange={(brand, created) => {
            setSelected(brand);
            setIsNew(Boolean(created));
          }}
        />
        {selected && (
          <div className="mt-3">
            <Alert type="success">
              {isNew ? `${selected.name} was created. Every company can use it now.` : `${selected.name} exists and is ready to use.`}
            </Alert>
          </div>
        )}
      </section>

      {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {result && result.total === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-14 text-center">
          <Tag className="size-8 text-brand-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-800">No brands yet</p>
          <p className="mt-1 text-xs text-gray-500">Type a brand name above to create the first one.</p>
        </div>
      )}
      {result && result.items.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ul className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((brand) => (
              <li key={brand.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5">
                <BrandLogo brand={brand} className="size-10" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-gray-900">{brand.name}</p>
                  {brand.country && <p className="truncate text-xs text-gray-500">{brand.country}</p>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
        </section>
      )}
    </div>
  );
}
