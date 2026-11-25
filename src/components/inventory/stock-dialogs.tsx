"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/api-error";
import { wholeText } from "@/lib/numbers";
import { useAdjustBatchMutation, useReceiveBatchMutation, useUpdateBatchMutation } from "@/store/api/inventory.api";
import type { AdjustBatch, Batch } from "@/types/inventory";
import { BatchFields, emptyBatch, Field, toBatchDetails, toReceiveBatch, type BatchForm } from "./batch-fields";
import { FormDialog } from "./form-dialog";

interface DoneProps {
  onClose: () => void;
  onDone: (message: string) => void;
}

export function ReceiveDialog({ variationId, expiryRequired, onClose, onDone }: DoneProps & { variationId: string; expiryRequired: boolean }) {
  const [form, setForm] = useState<BatchForm>(emptyBatch);
  const [localError, setLocalError] = useState("");
  const [receive, { isLoading, error }] = useReceiveBatchMutation();

  const submit = async () => {
    if (!(Number(form.quantity) > 0)) return setLocalError("Enter how many units were received.");
    if (expiryRequired && !form.expiryDate) return setLocalError("Enter the expiry date from the package.");
    setLocalError("");
    const result = await receive({ variationId, ...toReceiveBatch(form) });
    if (result.data) onDone(`${form.quantity} units were received.`);
  };

  return (
    <FormDialog
      title="Receive stock"
      submitLabel="Receive"
      isLoading={isLoading}
      error={localError || getErrorMessage(error)}
      onSubmit={submit}
      onClose={onClose}
    >
      <BatchFields value={form} onChange={(change) => setForm({ ...form, ...change })} expiryRequired={expiryRequired} />
    </FormDialog>
  );
}

export function EditBatchDialog({ batch, expiryRequired, onClose, onDone }: DoneProps & { batch: Batch; expiryRequired: boolean }) {
  const [form, setForm] = useState<BatchForm>({
    quantity: "",
    expiryDate: batch.expiryDate ?? "",
    batchNumber: batch.batchNumber ?? "",
    manufacturingDate: batch.manufacturingDate ?? "",
    unitCost: batch.unitCost === null ? "" : String(batch.unitCost),
    supplier: batch.supplier ?? "",
  });
  const [update, { isLoading, error }] = useUpdateBatchMutation();

  const submit = async () => {
    const result = await update({ id: batch.id, ...toBatchDetails(form) });
    if (result.data) onDone("The batch was saved.");
  };

  return (
    <FormDialog title="Correct the batch" submitLabel="Save" isLoading={isLoading} error={getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <BatchFields value={form} onChange={(change) => setForm({ ...form, ...change })} expiryRequired={expiryRequired} withQuantity={false} />
    </FormDialog>
  );
}

const adjustments: { type: AdjustBatch["type"]; label: string; quantityLabel: string }[] = [
  { type: "damaged", label: "Damaged or lost", quantityLabel: "How many units" },
  { type: "returned", label: "Returned by a customer", quantityLabel: "How many units" },
  { type: "corrected", label: "Counted again", quantityLabel: "Units there really are" },
];

export function AdjustDialog({ batch, onClose, onDone }: DoneProps & { batch: Batch }) {
  const [type, setType] = useState<AdjustBatch["type"]>("damaged");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");
  const [adjust, { isLoading, error }] = useAdjustBatchMutation();
  const current = adjustments.find((item) => item.type === type)!;
  const inputClasses =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

  const submit = async () => {
    if (quantity === "" || (type !== "corrected" && Number(quantity) === 0)) return setLocalError("Enter the number of units.");
    if (type === "corrected" && reason.trim().length < 3) return setLocalError("Say why it's corrected.");
    setLocalError("");
    const result = await adjust({ id: batch.id, type, quantity: Number(quantity), reason: reason.trim() });
    if (result.data) onDone("The stock was changed.");
  };

  return (
    <FormDialog
      title="Change stock"
      submitLabel="Change"
      isLoading={isLoading}
      error={localError || getErrorMessage(error)}
      onSubmit={submit}
      onClose={onClose}
    >
      <p className="text-sm text-gray-600">This batch has {batch.quantityOnHand} units.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="What happened">
          <select value={type} onChange={(event) => setType(event.target.value as AdjustBatch["type"])} className={inputClasses}>
            {adjustments.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={current.quantityLabel}>
          <input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(wholeText(event.target.value).slice(0, 7))} className={inputClasses} />
        </Field>
      </div>
      <Field label={type === "corrected" ? "Reason" : "Reason (optional)"}>
        <input value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} className={inputClasses} />
      </Field>
    </FormDialog>
  );
}
