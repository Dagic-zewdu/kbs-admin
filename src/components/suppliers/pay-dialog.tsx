"use client";

import { useState } from "react";
import { Field, inputClasses } from "@/components/inventory/field";
import { FormDialog } from "@/components/inventory/form-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import { paymentMethodLabels, type PaymentInput, type PaymentMethod } from "@/types/supplier";

export const todayText = () => new Intl.DateTimeFormat("en-CA").format(new Date());

interface PayDialogProps {
  title: string;
  /** What is owed: the most that can be paid */
  owed: number;
  hint: string;
  isLoading: boolean;
  error: Parameters<typeof getErrorMessage>[0];
  onPay: (payment: PaymentInput) => void;
  onClose: () => void;
}

/** Money paid to a supplier: amount, date, how, note */
export function PayDialog({ title, owed, hint, isLoading, error, onPay, onClose }: PayDialogProps) {
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayText);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  const submit = () => {
    const value = Number(amount);
    if (!(value > 0)) return setLocalError("Enter the amount paid.");
    if (value > owed) return setLocalError(`You owe ${formatPrice(owed)}. The amount can't be more.`);
    if (paidOn > todayText()) return setLocalError("The payment date is in the future.");
    setLocalError("");
    onPay({ amount: value, paidOn: paidOn || null, method, note: note.trim() || null });
  };

  return (
    <FormDialog title={title} submitLabel="Record payment" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <span>Owed</span>
        <strong className="text-base font-semibold">{formatPrice(owed)}</strong>
      </div>
      <p className="text-sm text-gray-600">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount paid, ETB" isRequired>
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(decimalText(event.target.value));
                setLocalError("");
              }}
              placeholder="5000"
              className={inputClasses}
            />
            <button type="button" onClick={() => setAmount(String(owed))} className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50">
              All
            </button>
          </div>
        </Field>
        <Field label="Paid on" isRequired>
          <input type="date" value={paidOn} max={todayText()} onChange={(event) => setPaidOn(event.target.value)} className={inputClasses} />
        </Field>
        <Field label="Paid by" isRequired>
          <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className={inputClasses}>
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note (optional)">
          <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} placeholder="Receipt 1043" className={inputClasses} />
        </Field>
      </div>
    </FormDialog>
  );
}
