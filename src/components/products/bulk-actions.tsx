"use client";

import { CircleDot, Power, PowerOff, Trash2, X } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/inventory/form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { useBulkProductsMutation } from "@/store/api/products.api";
import type { BulkProductsResult, ProductStatus, ProductSummary } from "@/types/product";
import { statusHints, statusLabels } from "./product-labels";

const statuses: ProductStatus[] = ["draft", "private", "live", "inactive"];

type Action = { type: "status"; status: ProductStatus; title: string } | { type: "delete" };

const plural = (count: number) => `${count} ${count === 1 ? "product" : "products"}`;

/** Sentence for what was done */
const doneText = (action: Action, result: BulkProductsResult) => {
  const count = result.done.length;
  if (!count) return "";
  if (action.type === "delete") return `${plural(count)} deleted.`;
  const drafts = result.done.filter((item) => item.status === "draft").length;
  const changed = `${plural(count)} changed to ${statusLabels[action.status].toLowerCase()}.`;
  // Activating one with something missing brings it back as a draft
  return drafts && action.status !== "draft" ? `${changed} ${drafts} of them came back as draft: something is missing to sell them.` : changed;
};

interface BulkActionsProps {
  selected: ProductSummary[];
  onClear: () => void;
  /** done: what to say; failed: what couldn't be done (stays selected) */
  onFinished: (done: string, failed: BulkProductsResult["failed"]) => void;
}

/** With products selected in the list: change status, activate, deactivate or delete them all */
export function BulkActions({ selected, onClear, onFinished }: BulkActionsProps) {
  const [action, setAction] = useState<Action | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [chosenStatus, setChosenStatus] = useState<ProductStatus>("private");
  const [run, { isLoading, error, reset }] = useBulkProductsMutation();
  const ids = selected.map((product) => product.id);
  const count = selected.length;

  const start = (next: Action) => {
    reset();
    setAction(next);
  };
  const finish = async (chosen: Action) => {
    const result = await run(chosen.type === "delete" ? { ids, action: "delete" } : { ids, action: "status", status: chosen.status });
    if (!result.data) return;
    setAction(null);
    setIsChoosing(false);
    onFinished(doneText(chosen, result.data.data), result.data.data.failed);
  };

  const button =
    "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50";

  return (
    <>
      <div
        role="region"
        aria-label="Selected products"
        className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 shadow-sm"
      >
        <span className="mr-1 text-sm font-semibold text-brand-900">{count} selected</span>
        <button type="button" className={button} onClick={() => (reset(), setIsChoosing(true))}>
          <CircleDot className="size-4" aria-hidden /> Change status
        </button>
        <button type="button" className={button} onClick={() => start({ type: "status", status: "private", title: "Activate" })}>
          <Power className="size-4" aria-hidden /> Activate
        </button>
        <button type="button" className={button} onClick={() => start({ type: "status", status: "inactive", title: "Deactivate" })}>
          <PowerOff className="size-4" aria-hidden /> Deactivate
        </button>
        <button type="button" className={`${button} text-red-700 hover:bg-red-50`} onClick={() => start({ type: "delete" })}>
          <Trash2 className="size-4" aria-hidden /> Delete
        </button>
        <button type="button" onClick={onClear} className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand-800 hover:bg-brand-100">
          <X className="size-4" aria-hidden /> Clear
        </button>
      </div>

      {isChoosing && (
        <FormDialog
          title={`Status of ${plural(count)}`}
          submitLabel="Change status"
          isLoading={isLoading}
          error={getErrorMessage(error)}
          onSubmit={() => finish({ type: "status", status: chosenStatus, title: "Change status" })}
          onClose={() => setIsChoosing(false)}
        >
          <fieldset className="space-y-2">
            <legend className="sr-only">Status</legend>
            {statuses.map((item) => (
              <label
                key={item}
                className="flex cursor-pointer gap-3 rounded-lg border border-gray-300 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
              >
                <input type="radio" name="bulk-status" checked={chosenStatus === item} onChange={() => setChosenStatus(item)} className="mt-0.5 size-4 shrink-0 accent-brand-600" />
                <span>
                  <span className="block font-medium text-gray-900">{statusLabels[item]}</span>
                  <span className="block text-gray-600">{statusHints[item]}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-gray-500">Products missing what the status needs are left as they are, and you will see why.</p>
        </FormDialog>
      )}

      <ConfirmDialog
        open={action?.type === "status"}
        title={action?.type === "status" ? `${action.title} ${plural(count)}?` : ""}
        description={
          action?.type === "status" && action.status === "inactive"
            ? "They can't be sold and aren't on the website. Stock and history are kept, and you can activate them again."
            : "They come back as private: staff can sell them, not on the website. Ones missing something come back as draft."
        }
        confirmLabel={action?.type === "status" ? action.title : ""}
        tone={action?.type === "status" && action.status === "inactive" ? "danger" : undefined}
        isLoading={isLoading}
        error={getErrorMessage(error) || undefined}
        onCancel={() => setAction(null)}
        onConfirm={() => action && finish(action)}
      />
      <ConfirmDialog
        open={action?.type === "delete"}
        tone="danger"
        title={`Delete ${plural(count)}?`}
        description="Their photos, variations, stock and history are removed. This can't be undone. Products that were sold before can't be deleted: they are skipped (deactivate them instead)."
        confirmLabel="Delete"
        isLoading={isLoading}
        error={getErrorMessage(error) || undefined}
        onCancel={() => setAction(null)}
        onConfirm={() => finish({ type: "delete" })}
      />
    </>
  );
}
