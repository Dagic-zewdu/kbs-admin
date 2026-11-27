"use client";

import { useState } from "react";
import { ExpiryField } from "@/components/expiry/expiry-field";
import { wholeText } from "@/lib/numbers";
import { DeliveryPaymentFields, emptyDeliveryPayment, toDeliveryPayment, type DeliveryPaymentForm } from "@/components/suppliers/delivery-payment-fields";
import type { BatchDetails, ReceiveBatch } from "@/types/inventory";
import { Field, inputClasses } from "./field";

/** A batch while typing */
export interface BatchForm {
  quantity: string;
  expiryDate: string;
  batchNumber: string;
  manufacturingDate: string;
  /** Who delivered it and what is paid. Only for new stock. */
  payment: DeliveryPaymentForm;
}

export const emptyBatch: BatchForm = { quantity: "", expiryDate: "", batchNumber: "", manufacturingDate: "", payment: emptyDeliveryPayment };

export const toBatchDetails = (form: BatchForm): BatchDetails => ({
  batchNumber: form.batchNumber.trim() || null,
  expiryDate: form.expiryDate || null,
  manufacturingDate: form.manufacturingDate || null,
});

export const toReceiveBatch = (form: BatchForm): ReceiveBatch => ({ quantity: Number(form.quantity), ...toBatchDetails(form), ...toDeliveryPayment(form.payment) });

export { Field, inputClasses } from "./field";

interface BatchFieldsProps {
  value: BatchForm;
  onChange: (change: Partial<BatchForm>) => void;
  expiryRequired: boolean;
  /** false when correcting a batch: quantities change only through adjustments */
  withQuantity?: boolean;
  /** Shown right after quantity and expiry, e.g. the prices */
  children?: React.ReactNode;
  /** Cost of one unit, for the supplier's total */
  unitCost?: number | null;
}

/** Quantity and expiry first; the rest under "More" */
export function BatchFields({ value, onChange, expiryRequired, withQuantity = true, children, unitCost = null }: BatchFieldsProps) {
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
      {withQuantity && (
        <DeliveryPaymentFields
          value={value.payment ?? emptyDeliveryPayment}
          onChange={(change) => onChange({ payment: { ...(value.payment ?? emptyDeliveryPayment), ...change } })}
          quantity={value.quantity}
          unitCost={unitCost}
        />
      )}
    </div>
  );
}
