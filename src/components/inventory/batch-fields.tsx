"use client";

import { useState } from "react";
import { decimalText, toNumber, wholeText } from "@/lib/numbers";
import type { BatchDetails, ReceiveBatch } from "@/types/inventory";

/** A batch while typing */
export interface BatchForm {
  quantity: string;
  expiryDate: string;
  batchNumber: string;
  manufacturingDate: string;
  unitCost: string;
  supplier: string;
}

export const emptyBatch: BatchForm = { quantity: "", expiryDate: "", batchNumber: "", manufacturingDate: "", unitCost: "", supplier: "" };

export const toBatchDetails = (form: BatchForm): BatchDetails => ({
  batchNumber: form.batchNumber.trim() || null,
  expiryDate: form.expiryDate || null,
  manufacturingDate: form.manufacturingDate || null,
  unitCost: toNumber(form.unitCost),
  supplier: form.supplier.trim() || null,
});

export const toReceiveBatch = (form: BatchForm): ReceiveBatch => ({ quantity: Number(form.quantity), ...toBatchDetails(form) });

const inputClasses =
  "h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

interface BatchFieldsProps {
  value: BatchForm;
  onChange: (change: Partial<BatchForm>) => void;
  expiryRequired: boolean;
  /** false when correcting a batch: quantities change only through adjustments */
  withQuantity?: boolean;
}

/** Quantity and expiry first; the rest under "More" */
export function BatchFields({ value, onChange, expiryRequired, withQuantity = true }: BatchFieldsProps) {
  const [showMore, setShowMore] = useState(!withQuantity || Boolean(value.batchNumber || value.unitCost || value.supplier || value.manufacturingDate));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {withQuantity && (
          <Field label="Quantity">
            <input
              inputMode="numeric"
              value={value.quantity}
              onChange={(event) => onChange({ quantity: wholeText(event.target.value).slice(0, 7) })}
              placeholder="24"
              className={inputClasses}
            />
          </Field>
        )}
        <Field label={expiryRequired ? "Expiry date" : "Expiry date (optional)"}>
          <input type="date" value={value.expiryDate} onChange={(event) => onChange({ expiryDate: event.target.value })} className={inputClasses} />
        </Field>
        <Field label="Batch number (optional)">
          <input
            value={value.batchNumber}
            maxLength={60}
            onChange={(event) => onChange({ batchNumber: event.target.value })}
            placeholder="A2309"
            className={inputClasses}
          />
        </Field>
      </div>
      {showMore ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Made on (optional)">
            <input
              type="date"
              value={value.manufacturingDate}
              onChange={(event) => onChange({ manufacturingDate: event.target.value })}
              className={inputClasses}
            />
          </Field>
          <Field label="Cost per unit, ETB (private)">
            <input
              inputMode="decimal"
              value={value.unitCost}
              onChange={(event) => onChange({ unitCost: decimalText(event.target.value) })}
              placeholder="800"
              className={inputClasses}
            />
          </Field>
          <Field label="Supplier (optional)">
            <input value={value.supplier} maxLength={150} onChange={(event) => onChange({ supplier: event.target.value })} className={inputClasses} />
          </Field>
        </div>
      ) : (
        <button type="button" onClick={() => setShowMore(true)} className="min-h-9 text-sm font-medium text-brand-700 hover:underline">
          More: made on, cost, supplier
        </button>
      )}
    </div>
  );
}
