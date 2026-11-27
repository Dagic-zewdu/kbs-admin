"use client";

import clsx from "clsx";
import { Plus, Star, Trash2 } from "lucide-react";
import { Field, inputClasses } from "@/components/inventory/field";
import { accountMethodLabels, MOBILE_MONEY, type AccountMethod, type PaymentAccount, type PaymentAccountInput } from "@/types/payment-account";

/** An account while typing */
export interface AccountForm {
  method: AccountMethod;
  accountNumber: string;
  holderName: string;
  label: string;
  isMain: boolean;
}

export const emptyAccountForm = (isMain = false): AccountForm => ({ method: "cbe", accountNumber: "", holderName: "", label: "", isMain });

export const toAccountForms = (accounts: PaymentAccount[] = []): AccountForm[] =>
  accounts.map((account) => ({ method: account.method, accountNumber: account.accountNumber, holderName: account.holderName, label: account.label ?? "", isMain: account.isMain }));

/** Rows with nothing typed are left out */
export const toAccountInputs = (forms: AccountForm[]): PaymentAccountInput[] =>
  forms
    .filter((form) => form.accountNumber.trim() || form.holderName.trim())
    .map((form) => ({
      method: form.method,
      accountNumber: form.accountNumber.replace(/[\s-]/g, ""),
      holderName: form.holderName.trim(),
      label: form.label.trim() || null,
      isMain: form.isMain,
    }));

const needsName = (method: AccountMethod) => method === "other_bank" || method === "other";

/** What is wrong before it's sent */
export const accountsProblem = (forms: AccountForm[]) => {
  for (const account of toAccountInputs(forms)) {
    if (!account.accountNumber) return "Enter the account number, or remove the empty account.";
    if (!/^\+?[0-9A-Za-z]{4,40}$/.test(account.accountNumber)) return "Account numbers have only digits (spaces are fine).";
    if (MOBILE_MONEY.includes(account.method) && !/^\+?\d{9,15}$/.test(account.accountNumber)) return "For Telebirr, CBE Birr and M-Pesa, the account number is the phone number.";
    if (account.holderName.length < 2) return "Enter the account holder's name.";
    if (needsName(account.method) && !account.label) return "Write the bank or service name for “Other”.";
  }
  return "";
};

/** Bank and mobile-money accounts: add, remove, choose the main one */
export function PaymentAccountsFields({ value, onChange }: { value: AccountForm[]; onChange: (accounts: AccountForm[]) => void }) {
  const set = (index: number, change: Partial<AccountForm>) => onChange(value.map((item, at) => (at === index ? { ...item, ...change } : item)));
  const makeMain = (index: number) => onChange(value.map((item, at) => ({ ...item, isMain: at === index })));

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium text-gray-700">Payment accounts (optional)</legend>
      <p className="-mt-1 text-sm text-gray-500">Bank or mobile-money accounts you pay them into. The main one is shown first.</p>
      {value.map((account, index) => {
        const isMobile = MOBILE_MONEY.includes(account.method);
        return (
          <div key={index} className={clsx("space-y-3 rounded-lg border p-3", account.isMain ? "border-brand-300 bg-brand-50/40" : "border-gray-200")}>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => makeMain(index)}
                aria-pressed={account.isMain}
                className={clsx(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
                  account.isMain ? "bg-brand-600 text-white" : "border border-gray-300 text-gray-600 hover:border-brand-300",
                )}
              >
                <Star className={clsx("size-3.5", account.isMain && "fill-current")} aria-hidden /> {account.isMain ? "Main account" : "Make main"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const rest = value.filter((_, at) => at !== index);
                  // Keep one main account
                  onChange(account.isMain && rest.length ? rest.map((item, at) => ({ ...item, isMain: at === 0 })) : rest);
                }}
                aria-label={`Remove account ${index + 1}`}
                className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bank or mobile money" isRequired>
                <select value={account.method} onChange={(event) => set(index, { method: event.target.value as AccountMethod })} className={inputClasses}>
                  {Object.entries(accountMethodLabels).map(([method, label]) => (
                    <option key={method} value={method}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={isMobile ? "Phone number" : "Account number"} isRequired>
                <input
                  inputMode={isMobile ? "tel" : "numeric"}
                  value={account.accountNumber}
                  maxLength={50}
                  onChange={(event) => set(index, { accountNumber: event.target.value })}
                  placeholder={isMobile ? "0911 234 567" : "1000 1234 5678"}
                  className={inputClasses}
                />
              </Field>
              <Field label="Account holder's name" isRequired>
                <input value={account.holderName} maxLength={120} onChange={(event) => set(index, { holderName: event.target.value })} placeholder="Abel Girma Tadesse" className={inputClasses} />
              </Field>
              <Field label={needsName(account.method) ? "Bank or service name" : "Label (optional)"} isRequired={needsName(account.method)}>
                <input
                  value={account.label}
                  maxLength={60}
                  onChange={(event) => set(index, { label: event.target.value })}
                  placeholder={needsName(account.method) ? "Zemen Bank" : "Bole branch"}
                  className={inputClasses}
                />
              </Field>
            </div>
          </div>
        );
      })}
      {value.length < 10 && (
        <button
          type="button"
          onClick={() => onChange([...value, emptyAccountForm(value.length === 0)])}
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
        >
          <Plus className="size-4" aria-hidden /> {value.length ? "Add another account" : "Add an account"}
        </button>
      )}
    </fieldset>
  );
}
