"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { useChangeProductStatusMutation } from "@/store/api/products.api";
import type { Product } from "@/types/product";

type Action = { status: "live" | "private" | "archived"; label: string; title: string; description: string; tone?: "danger" };

const goLive: Action = { status: "live", label: "Go live", title: "Show it in the shop?", description: "Customers can see and buy it." };
const hide: Action = { status: "private", label: "Hide", title: "Hide it from the shop?", description: "Customers won't see it until you go live again." };
const archive: Action = {
  status: "archived",
  label: "Archive",
  title: "Archive this product?",
  description: "It leaves the shop and the stock list. You can restore it later.",
  tone: "danger",
};
const restore: Action = { status: "private", label: "Restore", title: "Restore this product?", description: "It comes back hidden from customers." };

const actionsOf = (product: Product): Action[] =>
  ({
    draft: [],
    private: [goLive, archive],
    live: [hide, archive],
    archived: [restore],
  })[product.status];

/** Hide, archive, restore or go live. A draft goes live from the last step of its form. */
export function ProductStatusActions({ product }: { product: Product }) {
  const [action, setAction] = useState<Action | null>(null);
  const [change, { isLoading, error, reset }] = useChangeProductStatusMutation();

  const confirm = async () => {
    if (!action) return;
    const result = await change({ id: product.id, status: action.status });
    if (result.data) setAction(null);
  };

  return (
    <>
      {actionsOf(product).map((item) => (
        <Button
          key={item.label}
          type="button"
          variant={item.status === "live" ? "primary" : "secondary"}
          onClick={() => {
            reset();
            setAction(item);
          }}
        >
          {item.label}
        </Button>
      ))}
      <ConfirmDialog
        open={Boolean(action)}
        title={action?.title ?? ""}
        description={action?.description ?? ""}
        confirmLabel={action?.label ?? ""}
        tone={action?.tone}
        isLoading={isLoading}
        error={getErrorMessage(error) || undefined}
        onCancel={() => setAction(null)}
        onConfirm={confirm}
      />
    </>
  );
}
