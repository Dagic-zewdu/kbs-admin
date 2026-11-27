"use client";

import { CircleDot, Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { getErrorMessage } from "@/lib/api-error";
import { useChangeProductStatusMutation, useDeleteProductMutation } from "@/store/api/products.api";
import type { ProductSummary } from "@/types/product";
import { statusLabels } from "./product-labels";
import { StatusDialog } from "./status-dialog";

/** A list row or a whole product */
export type ProductActionTarget = Pick<ProductSummary, "id" | "name" | "status" | "missingToSell" | "missingToGoLive">;

interface ProductActionsProps {
  product: ProductActionTarget;
  onDone: (message: string) => void;
  onDeleted: (name: string) => void;
  /** View and Edit; off on the product's own pages */
  withEdit?: boolean;
}

/** View, edit, change status, activate or deactivate, delete */
export function ProductActions({ product, onDone, onDeleted, withEdit = true }: ProductActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState<"status" | "toggle" | "delete" | null>(null);
  const [change, changeState] = useChangeProductStatusMutation();
  const [remove, removeState] = useDeleteProductMutation();
  const isInactive = product.status === "inactive";
  const close = () => setOpen(null);

  const toggle = async () => {
    const result = await change({ id: product.id, status: isInactive ? "private" : "inactive" });
    if (!result.data) return;
    close();
    onDone(`${product.name} is now ${statusLabels[result.data.data.status].toLowerCase()}.`);
  };
  const confirmDelete = async () => {
    const result = await remove(product.id);
    if (result.error) return;
    close();
    onDeleted(product.name);
  };

  return (
    <>
      <span className="flex items-center gap-0.5">
        {withEdit && <IconButton icon={Eye} label={`View ${product.name}`} onClick={() => router.push(`/products/${product.id}`)} />}
        {withEdit && <IconButton icon={Pencil} label={`Edit ${product.name}`} onClick={() => router.push(`/products/${product.id}/edit`)} />}
        <IconButton icon={CircleDot} label={`Change status of ${product.name}`} onClick={() => setOpen("status")} />
        <IconButton
          icon={isInactive ? Power : PowerOff}
          label={`${isInactive ? "Activate" : "Deactivate"} ${product.name}`}
          onClick={() => {
            changeState.reset();
            setOpen("toggle");
          }}
        />
        <IconButton
          icon={Trash2}
          label={`Delete ${product.name}`}
          onClick={() => {
            removeState.reset();
            setOpen("delete");
          }}
        />
      </span>
      {open === "status" && (
        <StatusDialog
          product={product}
          onClose={close}
          onDone={(message) => {
            close();
            onDone(message);
          }}
        />
      )}
      <ConfirmDialog
        open={open === "toggle"}
        title={isInactive ? `Activate ${product.name}?` : `Deactivate ${product.name}?`}
        description={
          isInactive
            ? product.missingToSell.length
              ? "Something is missing to sell it, so it comes back as a draft."
              : "It comes back as private: staff can sell it, and it isn't on the website."
            : "It can't be sold and isn't on the website. Its stock and history are kept, and you can activate it again."
        }
        confirmLabel={isInactive ? "Activate" : "Deactivate"}
        tone={isInactive ? undefined : "danger"}
        isLoading={changeState.isLoading}
        error={getErrorMessage(changeState.error) || undefined}
        onCancel={close}
        onConfirm={toggle}
      />
      <ConfirmDialog
        open={open === "delete"}
        tone="danger"
        title={`Delete ${product.name}?`}
        description={`${product.status === "live" ? "It leaves the website right away. " : ""}Its photos, variations, stock and history are removed. This can't be undone. To keep them, deactivate it instead.`}
        confirmLabel="Delete"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={close}
        onConfirm={confirmDelete}
      />
    </>
  );
}
