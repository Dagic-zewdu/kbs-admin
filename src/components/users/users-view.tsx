"use client";

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AccountGroup } from "@/store/api/accounts.api";
import { AccountsPanel } from "./accounts-panel";

// Add a tab here (and an AccountGroup) to show another kind of account
const tabs: { group: AccountGroup; label: string; description: string }[] = [
  { group: "admins", label: "Admins", description: "People who can use this admin panel" },
  { group: "users", label: "Users", description: "Shoppers on the storefront and app" },
];

/** Users menu: one tab per account group. The open tab is kept in the URL (?tab=users) so it can be shared. */
export function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeGroup = tabs.find((tab) => tab.group === searchParams.get("tab"))?.group ?? "admins";

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Users</h1>
        <p className="mt-1 text-sm text-gray-500">{tabs.find((tab) => tab.group === activeGroup)?.description}</p>
      </header>

      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.group}
            role="tab"
            aria-selected={tab.group === activeGroup}
            onClick={() => router.replace(`${pathname}?tab=${tab.group}`, { scroll: false })}
            className={clsx(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:py-2.5",
              tab.group === activeGroup
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:border-brand-200 hover:text-brand-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* key resets search / page when switching tabs */}
      <AccountsPanel key={activeGroup} group={activeGroup} />
    </div>
  );
}
