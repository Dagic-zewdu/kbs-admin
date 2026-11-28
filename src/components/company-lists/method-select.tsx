"use client";

import { Field, inputClasses } from "@/components/inventory/field";
import { useListPaymentMethodsQuery } from "@/store/api/settings.api";
import { methodTypeLabels, type MethodType, type PaymentMethodOption } from "@/types/company-lists";

const GROUPS: MethodType[] = ["cash", "wallet", "bank", "other"];

/** The company's switched-on payment methods, in its order */
export const useMethods = () => {
  const { data, isLoading } = useListPaymentMethodsQuery();
  const methods = data?.data ?? [];
  return { methods, isLoading, cash: methods.find((method) => method.key === "cash") ?? methods[0] ?? null };
};

/** Paid by: cash, wallets and banks the company switched on in Settings, grouped */
export function MethodSelect({ value, onChange, label = "Paid by" }: { value: string; onChange: (methodId: string) => void; label?: string }) {
  const { methods, isLoading } = useMethods();
  return (
    <Field label={label} isRequired>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={isLoading} className={inputClasses}>
        {!value && <option value="">{isLoading ? "Loading…" : "Choose"}</option>}
        {GROUPS.map((type) => {
          const group = methods.filter((method) => method.type === type);
          if (!group.length) return null;
          return (
            <optgroup key={type} label={methodTypeLabels[type]}>
              {group.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </Field>
  );
}

/** The account to pay into, when the company entered one */
export const accountLine = (method?: PaymentMethodOption | null) =>
  method?.accountNumber ? `${method.accountNumber}${method.accountHolder ? ` · ${method.accountHolder}` : ""}` : null;
