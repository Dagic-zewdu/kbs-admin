"use client";

import clsx from "clsx";
import { Lock } from "lucide-react";
import { getErrorMessage } from "@/lib/api-error";
import { useChangeAccountStatusMutation, type AccountGroup } from "@/store/api/accounts.api";
import type { User } from "@/types/auth";

interface AccountStatusActionProps {
  group: AccountGroup;
  account: User;
  currentUserId: string;
}

/** Activate / Deactivate button for one row (super admins only). */
export function AccountStatusAction({ group, account, currentUserId }: AccountStatusActionProps) {
  const [changeStatus, { isLoading, error }] = useChangeAccountStatusMutation();

  if (account.role === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500" title="A super admin can't be deactivated">
        <Lock className="size-3.5" aria-hidden /> Protected
      </span>
    );
  }

  if (account.id === currentUserId) return <span className="text-xs text-gray-400">You</span>;

  const willActivate = !account.isActive;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => changeStatus({ group, id: account.id, isActive: willActivate })}
        disabled={isLoading}
        className={clsx(
          "min-h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50 md:min-h-0 md:px-3 md:py-1.5 md:text-xs",
          willActivate
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "border border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700",
        )}
      >
        {isLoading ? "Saving…" : willActivate ? "Activate" : "Deactivate"}
      </button>
      {error && <span className="max-w-64 text-right md:max-w-48 text-xs text-red-600">{getErrorMessage(error)}</span>}
    </div>
  );
}
