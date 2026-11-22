import type { AccountGroup } from "@/store/api/accounts.api";
import type { User } from "@/types/auth";
import { AccountStatusAction } from "./account-status-action";
import { RoleBadge, StatusBadge } from "./badges";

interface AccountsTableProps {
  group: AccountGroup;
  accounts: User[];
  currentUserId: string;
  canChangeStatus: boolean;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/** Phones: one card per account. Tablets and up: a table. */
export function AccountsTable(props: AccountsTableProps) {
  return (
    <>
      <AccountCards {...props} />
      <AccountRows {...props} />
    </>
  );
}

function AccountCards({ group, accounts, currentUserId, canChangeStatus }: AccountsTableProps) {
  return (
    <ul className="divide-y divide-gray-100 md:hidden">
      {accounts.map((account) => (
        <li key={account.id} className="space-y-3 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {account.firstName} {account.lastName}
              </p>
              <p className="truncate text-sm text-gray-500">{account.email}</p>
            </div>
            <StatusBadge isActive={account.isActive} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <RoleBadge role={account.role} />
            <span>Joined {formatDate(account.createdAt)}</span>
            <span>Last sign in {formatDate(account.lastLoginAt)}</span>
          </div>

          {canChangeStatus && (
            <div className="flex justify-end">
              <AccountStatusAction group={group} account={account} currentUserId={currentUserId} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function AccountRows({ group, accounts, currentUserId, canChangeStatus }: AccountsTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Joined</th>
            <th className="px-4 py-3 font-medium">Last sign in</th>
            {canChangeStatus && <th className="px-4 py-3 text-right font-medium">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-brand-50/30">
              <td className="max-w-64 px-4 py-3">
                <p className="truncate font-medium text-gray-900">
                  {account.firstName} {account.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{account.email}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <RoleBadge role={account.role} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge isActive={account.isActive} />
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 text-gray-600 lg:table-cell">{formatDate(account.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(account.lastLoginAt)}</td>
              {canChangeStatus && (
                <td className="px-4 py-3 text-right">
                  <AccountStatusAction group={group} account={account} currentUserId={currentUserId} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
