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

export function AccountsTable({ group, accounts, currentUserId, canChangeStatus }: AccountsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Last sign in</th>
            {canChangeStatus && <th className="px-4 py-3 text-right font-medium">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-brand-50/30">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">
                  {account.firstName} {account.lastName}
                </p>
                <p className="text-xs text-gray-500">{account.email}</p>
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={account.role} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge isActive={account.isActive} />
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(account.createdAt)}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(account.lastLoginAt)}</td>
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
