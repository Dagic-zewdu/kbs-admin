"use client";

import { Check, Copy, Landmark, Smartphone } from "lucide-react";
import { useState } from "react";
import { accountMethodLabels, MOBILE_MONEY, type PaymentAccount } from "@/types/payment-account";

/** Accounts to pay into, the main one first, with a copy button on each number */
export function PaymentAccountsList({ accounts }: { accounts: PaymentAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!accounts.length) return <p className="text-gray-500">No accounts yet.</p>;

  const copy = async (account: PaymentAccount) => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(account.id);
      setTimeout(() => setCopied((current) => (current === account.id ? null : current)), 1500);
    } catch {
      // Clipboard blocked: the number is still on screen to copy by hand
    }
  };

  return (
    <ul className="space-y-2">
      {accounts.map((account) => {
        const Icon = MOBILE_MONEY.includes(account.method) ? Smartphone : Landmark;
        const name = account.method === "other_bank" || account.method === "other" ? (account.label ?? accountMethodLabels[account.method]) : accountMethodLabels[account.method];
        return (
          <li key={account.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-gray-900">
                <span className="font-medium">{name}</span>
                {account.isMain && accounts.length > 1 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Main</span>}
              </p>
              <p className="font-mono text-base tracking-wide text-gray-900 break-all">{account.accountNumber}</p>
              <p className="text-xs text-gray-500">
                {account.holderName}
                {account.label && account.method !== "other_bank" && account.method !== "other" && ` · ${account.label}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy(account)}
              aria-label={`Copy ${name} account number`}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50"
            >
              {copied === account.id ? <Check className="size-3.5 text-green-600" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              {copied === account.id ? "Copied" : "Copy"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
