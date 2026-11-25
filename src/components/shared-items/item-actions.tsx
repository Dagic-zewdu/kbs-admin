"use client";

import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { NoticeDialog } from "@/components/ui/notice-dialog";
import { getErrorMessage } from "@/lib/api-error";
import {
  useChangeBrandStatusMutation,
  useDeleteBrandMutation,
  useGetBrandUsageQuery,
} from "@/store/api/brands.api";
import {
  useChangeCategoryStatusMutation,
  useDeleteCategoryMutation,
  useGetCategoryUsageQuery,
} from "@/store/api/categories.api";
import type { Ownership } from "@/types/shared-item";

export type ItemKind = "brand" | "category";
type Item = Ownership & { id: string; name: string };
type OpenDialog = "activate" | "deactivate" | "delete" | null;

interface ItemActionsProps {
  kind: ItemKind;
  item: Item;
  onEdit: () => void;
  onDone: (message: string) => void;
}

/**
 * Edit, activate / deactivate and delete for a brand or category.
 * The buttons are always there; on something another company or the platform created they explain why not.
 */
export function ItemActions({ kind, item, onEdit, onDone }: ItemActionsProps) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [refused, setRefused] = useState("");
  const isOurs = item.createdBy === "us";

  const attempt = (action: "edit" | "activate" | "deactivate" | "delete") => {
    if (!isOurs) return setRefused(`This ${kind} was not created by you, so you cannot ${action} it.`);
    if (action === "activate" && item.deactivatedBy === "platform") {
      return setRefused(`This ${kind} was deactivated by the platform. Only the platform can activate it.`);
    }
    if (action === "edit") return onEdit();
    setDialog(action);
  };

  const muted = isOurs ? undefined : "opacity-50";
  const statusAction = item.isActive ? "deactivate" : "activate";

  return (
    <>
      <span className={`flex items-center ${muted ?? ""}`}>
        <IconButton icon={Pencil} label={`Edit ${item.name}`} onClick={() => attempt("edit")} />
        <IconButton
          icon={item.isActive ? PowerOff : Power}
          label={`${item.isActive ? "Deactivate" : "Activate"} ${item.name}`}
          onClick={() => attempt(statusAction)}
        />
        <IconButton icon={Trash2} label={`Delete ${item.name}`} onClick={() => attempt("delete")} />
      </span>

      {refused && (
        <NoticeDialog title="Not allowed" onClose={() => setRefused("")}>
          {refused}
        </NoticeDialog>
      )}
      {(dialog === "activate" || dialog === "deactivate") && (
        <StatusDialog kind={kind} item={item} onClose={() => setDialog(null)} onDone={onDone} />
      )}
      {dialog === "delete" && <DeleteDialog kind={kind} item={item} onClose={() => setDialog(null)} onDone={onDone} />}
    </>
  );
}

interface DialogProps {
  kind: ItemKind;
  item: Item;
  onClose: () => void;
  onDone: (message: string) => void;
}

function StatusDialog({ kind, item, onClose, onDone }: DialogProps) {
  const [changeBrand, brandState] = useChangeBrandStatusMutation();
  const [changeCategory, categoryState] = useChangeCategoryStatusMutation();
  const state = kind === "brand" ? brandState : categoryState;
  const isActive = !item.isActive;

  const confirm = async () => {
    const change = { id: item.id, isActive };
    const result = kind === "brand" ? await changeBrand(change) : await changeCategory(change);
    if (!result.data) return;
    onClose();
    onDone(`${item.name} was ${isActive ? "activated" : "deactivated"}.`);
  };

  return (
    <ConfirmDialog
      open
      title={`${isActive ? "Activate" : "Deactivate"} ${item.name}?`}
      description={
        isActive
          ? "It can be chosen for products again, by every company."
          : `It can't be chosen for new products until you activate it again${kind === "category" ? ", and neither can its sub-categories" : ""}. Products that use it keep it.`
      }
      confirmLabel={isActive ? "Activate" : "Deactivate"}
      isLoading={state.isLoading}
      error={getErrorMessage(state.error) || undefined}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}

function DeleteDialog({ kind, item, onClose, onDone }: DialogProps) {
  const brandUsage = useGetBrandUsageQuery(item.id, { skip: kind !== "brand", refetchOnMountOrArgChange: true });
  const categoryUsage = useGetCategoryUsageQuery(item.id, { skip: kind !== "category", refetchOnMountOrArgChange: true });
  const { data, isFetching, error: usageError } = kind === "brand" ? brandUsage : categoryUsage;
  const [deleteBrand, brandState] = useDeleteBrandMutation();
  const [deleteCategory, categoryState] = useDeleteCategoryMutation();
  const state = kind === "brand" ? brandState : categoryState;
  const usage = isFetching ? undefined : data?.data;

  if (usage?.usedByOthers) {
    return (
      <NoticeDialog title="Not allowed" onClose={onClose}>
        Other companies&apos; products use this {kind}, so you cannot delete it. Ask the platform.
      </NoticeDialog>
    );
  }
  if (usage?.subCategories) {
    return (
      <NoticeDialog title="It has sub-categories" onClose={onClose}>
        Move or delete its {usage.subCategories} sub-categor{usage.subCategories === 1 ? "y" : "ies"} first.
      </NoticeDialog>
    );
  }

  const confirm = async () => {
    const result = kind === "brand" ? await deleteBrand(item.id) : await deleteCategory(item.id);
    if (!result.data) return;
    const { unlinked } = result.data.data;
    onClose();
    onDone(`${item.name} was deleted.${unlinked ? ` ${unlinked} product${unlinked === 1 ? " was" : "s were"} unlinked.` : ""}`);
  };

  return (
    <ConfirmDialog
      open
      tone="danger"
      title={`Delete ${item.name}?`}
      description={
        <div className="space-y-2">
          {usage && usage.products > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-medium">
                {usage.products} of your products use{usage.products === 1 ? "s" : ""} this {kind} and will be unlinked from it:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {usage.productNames.map((name, index) => (
                  <li key={index} className="break-words">
                    {name}
                  </li>
                ))}
                {usage.products > usage.productNames.length && <li>and {usage.products - usage.productNames.length} more</li>}
              </ul>
              {usage.liveProducts > 0 && (
                <p className="mt-2">
                  {usage.liveProducts} live product{usage.liveProducts === 1 ? "" : "s"} will become private until you choose a new {kind}.
                </p>
              )}
            </div>
          )}
          <p>It&apos;s removed for every company. This can&apos;t be undone.</p>
        </div>
      }
      confirmLabel="Delete"
      isLoading={state.isLoading || isFetching}
      error={getErrorMessage(state.error || usageError) || undefined}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
