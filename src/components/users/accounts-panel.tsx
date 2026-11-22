"use client";

import { Info, Loader2, Search, Users } from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { useListAccountsQuery, type AccountGroup, type AccountStatusFilter } from "@/store/api/accounts.api";
import { useAppSelector } from "@/store/hooks";
import { AccountsTable } from "./accounts-table";

const PAGE_SIZE = 10;

const emptyStateText: Record<AccountGroup, { title: string; description: string }> = {
  admins: { title: "No admins found", description: "Try a different search or status filter." },
  users: {
    title: "No users yet",
    description: "Shoppers will sign in to the storefront and app with Firebase. Their accounts will appear here.",
  },
};

/** Search + status filter + table + pagination for one account group (one tab). */
export function AccountsPanel({ group }: { group: AccountGroup }) {
  const currentUser = useAppSelector((state) => state.auth.user)!;
  const isSuperAdmin = currentUser.role === "super_admin";

  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<AccountStatusFilter>("all");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText.trim());

  const { data, isLoading, isFetching, error } = useListAccountsQuery({ group, page, limit: PAGE_SIZE, search, status });
  const result = data?.data;

  // Any new search / filter starts again from page 1
  const updateSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
  };
  const updateStatus = (value: AccountStatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {!isSuperAdmin && (
        <p className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Only a super admin can activate or deactivate accounts.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search by name or email</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by name or email"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="sm:w-44 sm:shrink-0">
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) => updateStatus(event.target.value as AccountStatusFilter)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isFetching && !isLoading && (
          <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-brand-500" aria-label="Updating" />
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Loading" />
          </div>
        )}

        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}

        {result && result.items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <Users className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{emptyStateText[group].title}</p>
            <p className="mt-1 max-w-sm text-xs text-gray-500">{emptyStateText[group].description}</p>
          </div>
        )}

        {result && result.items.length > 0 && (
          <>
            <AccountsTable group={group} accounts={result.items} currentUserId={currentUser.id} canChangeStatus={isSuperAdmin} />
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
