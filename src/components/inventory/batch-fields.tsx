"use client";

import { useState } from "react";
import { ExpiryField } from "@/components/expiry/expiry-field";
import { RequiredMark } from "@/components/ui/required-mark";
import { wholeText } from "@/lib/numbers";
import type { BatchDetails, ReceiveBatch } from "@/types/inventory";

/** A batch while typing */
export interface BatchForm {
  quantity: string;
  expiryDate: string;
  batchNumber: string;
  manufacturingDate: string;
}

export const emptyBatch: BatchForm = { quantity: "", expiryDate: "", batchNumber: "", manufacturingDate: "" };

export const toBatchDetails = (form: BatchForm): BatchDetails => ({
  batchNumber: form.batchNumber.trim() || null,
  expiryDate: form.expiryDate || null,
  manufacturingDate: form.manufacturingDate || null,
});

export const toReceiveBatch = (form: BatchForm): ReceiveBatch => ({ quantity: Number(form.quantity), ...toBatchDetails(form) });

export const inputClasses =
  "h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

export function Field({ label, isRequired, children }: { label: string; isRequired?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </span>
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
  /** Shown right after quantity and expiry, e.g. the prices */
  children?: React.ReactNode;
}

/** Quantity and expiry first; the rest under "More" */
export function BatchFields({ value, onChange, expiryRequired, withQuantity = true, children }: BatchFieldsProps) {
  const [showMore, setShowMore] = useState(!withQuantity || Boolean(value.batchNumber || value.manufacturingDate));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {withQuantity && (
          <Field label="Quantity" isRequired>
            <input
              inputMode="numeric"
              value={value.quantity}
              onChange={(event) => onChange({ quantity: wholeText(event.target.value).slice(0, 7) })}
              placeholder="24"
              className={inputClasses}
            />
          </Field>
        )}
        <ExpiryField
          label={expiryRequired ? "Expiry date" : "Expiry date (optional)"}
          isRequired={expiryRequired}
          value={value.expiryDate}
          onChange={(expiryDate) => onChange({ expiryDate })}
        />
        {children}
      </div>
      {showMore ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Batch number (optional)">
            <input
              value={value.batchNumber}
              maxLength={60}
              onChange={(event) => onChange({ batchNumber: event.target.value })}
              placeholder="A2309"
              className={inputClasses}
            />
          </Field>
          <Field label="Made on (optional)">
            <input
              type="date"
              value={value.manufacturingDate}
              onChange={(event) => onChange({ manufacturingDate: event.target.value })}
              className={inputClasses}
            />
          </Field>
        </div>
      ) : (
        <button type="button" onClick={() => setShowMore(true)} className="min-h-9 text-sm font-medium text-brand-700 hover:underline">
          More: batch number, made on
        </button>
      )}
    </div>
  );
}
