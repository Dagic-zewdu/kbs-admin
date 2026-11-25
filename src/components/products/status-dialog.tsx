"use client";

import { useState } from "react";
import { FormDialog } from "@/components/inventory/form-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { useChangeProductStatusMutation } from "@/store/api/products.api";
import type { ProductStatus, ProductSummary } from "@/types/product";
import { missingLabels, statusHints, statusLabels } from "./product-labels";

const statuses: ProductStatus[] = ["draft", "private", "live", "inactive"];

interface StatusDialogProps {
  product: Pick<ProductSummary, "id" | "name" | "status" | "missingToSell" | "missingToGoLive">;
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Choose the status, with what each one means and what it still needs */
export function StatusDialog({ product, onClose, onDone }: StatusDialogProps) {
  const [status, setStatus] = useState(product.status);
  const [change, { isLoading, error }] = useChangeProductStatusMutation();
  const missingFor = (item: ProductStatus) => (item === "live" ? product.missingToGoLive : item === "private" ? product.missingToSell : []);

  const save = async () => {
    if (status === product.status) return onClose();
    const result = await change({ id: product.id, status });
    if (result.data) onDone(`${product.name} is now ${statusLabels[result.data.data.status].toLowerCase()}.`);
  };

  return (
    <FormDialog title={`Status of ${product.name}`} submitLabel="Change status" isLoading={isLoading} error={getErrorMessage(error)} onSubmit={save} onClose={onClose}>
      <fieldset className="space-y-2">
        <legend className="sr-only">Status</legend>
        {statuses.map((item) => {
          const missing = item === product.status ? [] : missingFor(item);
          const isBlocked = missing.length > 0;
          return (
            <label
              key={item}
              className={`flex gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200 ${
                isBlocked ? "cursor-not-allowed border-gray-200 bg-gray-50" : "cursor-pointer border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="status"
                checked={status === item}
                autoFocus={item === product.status}
                disabled={isBlocked}
                onChange={() => setStatus(item)}
                className="mt-0.5 size-4 shrink-0 accent-brand-600"
              />
              <span className="min-w-0">
                <span className={`block font-medium ${isBlocked ? "text-gray-500" : "text-gray-900"}`}>
                  {statusLabels[item]}
                  {item === product.status && <span className="font-normal text-gray-500"> · now</span>}
                </span>
                <span className="block text-gray-600">{statusHints[item]}</span>
                {isBlocked && <span className="mt-1 block text-amber-800">Still needs {missing.map((part) => missingLabels[part] ?? part).join(", ")}.</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
    </FormDialog>
  );
}
