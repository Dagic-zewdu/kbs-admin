"use client";

import clsx from "clsx";
import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { Field, inputClasses } from "@/components/inventory/field";
import { formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import { paymentMethodLabels, type PaymentMethod, type PaymentStatus, type Supplier } from "@/types/supplier";
import { SupplierSelect } from "./supplier-select";

/** The supplier and payment of new stock, while typing */
export interface DeliveryPaymentForm {
  supplier: Supplier | null;
  paymentStatus: PaymentStatus | "";
  amountPaid: string;
  paymentMethod: PaymentMethod;
  payByDate: string;
}

export const emptyDeliveryPayment: DeliveryPaymentForm = { supplier: null, paymentStatus: "", amountPaid: "", paymentMethod: "cash", payByDate: "" };

const round = (value: number) => Math.round(value * 100) / 100;

/** quantity × cost price, or null while one is missing */
export const deliveryTotal = (quantity: string, unitCost: number | null) => {
  const units = Number(quantity);
  return units > 0 && unitCost !== null && Number.isFinite(unitCost) ? round(units * unitCost) : null;
};

/** What is missing before the stock can be added */
export const deliveryPaymentProblem = (form: DeliveryPaymentForm, total: number | null) => {
  if (!form.supplier) return "Choose the supplier.";
  if (!form.paymentStatus) return "Choose if the supplier is paid.";
  if (form.paymentStatus === "partial") {
    const amount = Number(form.amountPaid);
    if (!(amount > 0)) return "Enter how much was paid.";
    if (total !== null && amount >= total) return `Partly paid must be less than the total (${formatPrice(total)}). Choose Paid in full.`;
  }
  return "";
};

export const toDeliveryPayment = (form: DeliveryPaymentForm) => ({
  supplierId: form.supplier?.id ?? "",
  paymentStatus: (form.paymentStatus || "unpaid") as PaymentStatus,
  amountPaid: form.paymentStatus === "partial" ? Number(form.amountPaid) : null,
  paymentMethod: form.paymentStatus === "unpaid" ? null : form.paymentMethod,
  payByDate: form.paymentStatus === "paid" ? null : form.payByDate || null,
});

const statuses: { value: PaymentStatus; label: string; hint: string; icon: typeof CircleCheck }[] = [
  { value: "paid", label: "Paid in full", hint: "Nothing owed", icon: CircleCheck },
  { value: "partial", label: "Partly paid", hint: "Some birr paid now", icon: CircleDot },
  { value: "unpaid", label: "Not paid", hint: "On credit", icon: CircleDashed },
];

interface DeliveryPaymentFieldsProps {
  value: DeliveryPaymentForm;
  onChange: (change: Partial<DeliveryPaymentForm>) => void;
  quantity: string;
  unitCost: number | null;
}

/** Who delivered the stock and how much of it is paid */
export function DeliveryPaymentFields({ value, onChange, quantity, unitCost }: DeliveryPaymentFieldsProps) {
  const total = deliveryTotal(quantity, unitCost);
  const paidNow = value.paymentStatus === "paid" ? total : value.paymentStatus === "partial" ? Number(value.amountPaid) || 0 : 0;
  const left = total === null || paidNow === null ? null : round(Math.max(total - paidNow, 0));

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <SupplierSelect value={value.supplier} onChange={(supplier) => onChange({ supplier })} />

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <span className="text-gray-600">Total to pay the supplier</span>
        <span className="font-semibold text-gray-900">
          {total === null ? (
            <span className="font-normal text-gray-500">Enter the quantity and cost price</span>
          ) : (
            <>
              <span className="font-normal text-gray-500">
                {Number(quantity)} × {formatPrice(unitCost)} ={" "}
              </span>
              {formatPrice(total)}
            </>
          )}
        </span>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">
          Payment<span className="text-red-600"> *</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {statuses.map((status) => {
            const isChosen = value.paymentStatus === status.value;
            return (
              <label
                key={status.value}
                className={clsx(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center text-sm sm:flex-row sm:items-start sm:gap-2.5 sm:px-3 sm:text-left",
                  isChosen ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-gray-200 bg-white hover:border-brand-300",
                )}
              >
                <input type="radio" name="payment-status" checked={isChosen} onChange={() => onChange({ paymentStatus: status.value })} className="sr-only" />
                <status.icon className={clsx("size-5 shrink-0 sm:mt-0.5 sm:size-4", isChosen ? "text-brand-700" : "text-gray-400")} aria-hidden />
                <span>
                  <span className="block font-medium text-gray-900">{status.label}</span>
                  <span className="hidden text-xs text-gray-500 sm:block">{status.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value.paymentStatus && (
        <div className="grid gap-3 sm:grid-cols-2">
          {value.paymentStatus === "partial" && (
            <Field label="Paid now, ETB" isRequired>
              <input inputMode="decimal" value={value.amountPaid} onChange={(event) => onChange({ amountPaid: decimalText(event.target.value) })} placeholder="10000" className={inputClasses} />
            </Field>
          )}
          {value.paymentStatus !== "unpaid" && (
            <Field label="Paid by" isRequired>
              <select value={value.paymentMethod} onChange={(event) => onChange({ paymentMethod: event.target.value as PaymentMethod })} className={inputClasses}>
                {Object.entries(paymentMethodLabels).map(([method, label]) => (
                  <option key={method} value={method}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {value.paymentStatus !== "paid" && (
            <Field label="Pay the rest by (optional)">
              <input type="date" value={value.payByDate} onChange={(event) => onChange({ payByDate: event.target.value })} className={inputClasses} />
            </Field>
          )}
        </div>
      )}
      {value.paymentStatus && value.paymentStatus !== "paid" && left !== null && (
        <p className="text-sm text-amber-800">
          Still to pay after this: <strong className="font-semibold">{formatPrice(left)}</strong>
        </p>
      )}
    </div>
  );
}
