"use client";

import { Plus, Star, X } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/inventory/form-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { useAddBarcodeMutation, useRemoveBarcodeMutation, useSetMainBarcodeMutation } from "@/store/api/inventory.api";
import type { VariationBarcode, VariationStockDetail } from "@/types/inventory";
import { ScanInput } from "./scan-input";

interface VariationBarcodesProps {
  variationId: string;
  barcodes: VariationBarcode[];
  onChanged?: (changed: VariationStockDetail) => void;
}

/** Every barcode a saved variation arrives with. Changes are saved right away. */
export function VariationBarcodes({ variationId, barcodes, onChanged }: VariationBarcodesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState("");
  const [add, addState] = useAddBarcodeMutation();
  const [setMain, mainState] = useSetMainBarcodeMutation();
  const [remove, removeState] = useRemoveBarcodeMutation();
  const isBusy = mainState.isLoading || removeState.isLoading;
  const error = mainState.error || removeState.error;

  const run = async (action: Promise<{ data?: { data: VariationStockDetail } }>) => {
    const result = await action;
    if (result.data) onChanged?.(result.data.data);
    return Boolean(result.data);
  };
  const submit = async () => {
    if (!text.trim()) return setLocalError("Scan or type the barcode.");
    setLocalError("");
    if (await run(add({ variationId, barcode: text.trim() }))) setIsAdding(false);
  };

  return (
    <div className="space-y-2 text-sm">
      <ul className="flex flex-wrap gap-2">
        {barcodes.map((item) => (
          <li key={item.barcode} className="flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white pl-3 pr-1 text-gray-800">
            <span className="break-all">{item.barcode}</span>
            {item.isMain ? (
              <span className="mx-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Main</span>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  title="Make it the main one, for stickers"
                  aria-label={`Make ${item.barcode} the main barcode`}
                  onClick={() => run(setMain({ variationId, barcode: item.barcode }))}
                  className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  <Star className="size-4" />
                </button>
                {!item.isUsed && (
                  <button
                    type="button"
                    disabled={isBusy}
                    title="Remove"
                    aria-label={`Remove barcode ${item.barcode}`}
                    onClick={() => run(remove({ variationId, barcode: item.barcode }))}
                    className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </>
            )}
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => {
              addState.reset();
              setText("");
              setLocalError("");
              setIsAdding(true);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 px-1 font-medium text-brand-700 hover:underline"
          >
            <Plus className="size-4" aria-hidden /> Add another barcode
          </button>
        </li>
      </ul>
      {error && <p className="text-red-600">{getErrorMessage(error)}</p>}
      {isAdding && (
        <FormDialog
          title="Add another barcode"
          submitLabel="Add"
          isLoading={addState.isLoading}
          error={localError || getErrorMessage(addState.error)}
          onSubmit={submit}
          onClose={() => setIsAdding(false)}
        >
          <p className="text-sm text-gray-600">For the same product, size and shade that arrives with a different barcode.</p>
          <ScanInput
            label="Barcode"
            isRequired
            value={text}
            onChange={(value) => {
              setText(value);
              setLocalError("");
            }}
          />
        </FormDialog>
      )}
    </div>
  );
}
