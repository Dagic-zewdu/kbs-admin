"use client";

import clsx from "clsx";
import { ArrowDownUp, Loader2, Pencil, Plus, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { useGetVariationStockQuery } from "@/store/api/inventory.api";
import type { Batch, StockMovement } from "@/types/inventory";
import { PrintLabelsDialog } from "./print-labels-dialog";
import { AdjustDialog, EditBatchDialog, ReceiveDialog } from "./stock-dialogs";

const movementLabels: Record<StockMovement["type"], string> = {
  received: "Received",
  sold: "Sold",
  damaged: "Damaged or lost",
  returned: "Returned",
  corrected: "Counted again",
};

type OpenDialog = { type: "receive" | "labels" } | { type: "edit" | "adjust"; batch: Batch } | null;

/** One variation: its batches and what happened to its stock */
export function VariationStockView({ id }: { id: string }) {
  const { data, isLoading, error } = useGetVariationStockQuery(id);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [notice, setNotice] = useState("");

  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Not found"}</p>;
  const { variation, product, stock, batches, movements, expiryRequired } = data.data;

  const title = variation.name ? `${product.name} · ${variation.name}` : product.name;
  const close = () => setDialog(null);
  const done = (message: string) => {
    setDialog(null);
    setNotice(message);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={title}
        backHref="/inventory"
        actions={
          <>
            {variation.barcode && (
              <Button type="button" variant="secondary" onClick={() => setDialog({ type: "labels" })}>
                <Printer className="size-4" aria-hidden /> Print labels
              </Button>
            )}
            <Button type="button" onClick={() => setDialog({ type: "receive" })}>
              <Plus className="size-4" aria-hidden /> Receive stock
            </Button>
          </>
        }
      />
      {notice && <Alert type="success">{notice}</Alert>}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "In stock", value: String(stock.onHand), alert: stock.onHand === 0 },
          { label: "Next expiry", value: formatDay(stock.nextExpiry) },
          { label: "Expired", value: String(stock.expired), alert: stock.expired > 0 },
          { label: "Price", value: formatPrice(variation.price) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd className={clsx("mt-1 text-lg font-semibold", item.alert ? "text-red-700" : "text-gray-900")}>{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="break-words text-sm text-gray-600">
        SKU {variation.sku} · Barcode {variation.barcode ?? "—"} ·{" "}
        <Link href={`/products/${product.id}`} className="font-medium text-brand-700 hover:underline">
          Open product
        </Link>
      </p>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <h2 className="px-4 pt-4 text-base font-semibold text-gray-900">Batches</h2>
        {batches.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">No stock was received yet.</p>}
        <ul className="mt-2 divide-y divide-gray-100">
          {batches.map((batch) => (
            <li key={batch.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {batch.expiryDate ? `Expires ${formatDay(batch.expiryDate)}` : "Doesn't expire"}
                  {batch.isExpired && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Expired</span>}
                </p>
                <p className="break-words text-xs text-gray-500">
                  {[
                    batch.batchNumber && `Batch ${batch.batchNumber}`,
                    `received ${formatDay(batch.receivedDate)}`,
                    batch.supplier,
                    batch.unitCost !== null && `cost ${formatPrice(batch.unitCost)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 whitespace-nowrap text-gray-900">
                  <strong className="font-semibold">{batch.quantityOnHand}</strong> of {batch.quantityReceived}
                </span>
                <IconButton icon={ArrowDownUp} label="Change stock of this batch" onClick={() => setDialog({ type: "adjust", batch })} />
                <IconButton icon={Pencil} label="Correct this batch" onClick={() => setDialog({ type: "edit", batch })} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <h2 className="px-4 pt-4 text-base font-semibold text-gray-900">History</h2>
        {movements.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Nothing yet.</p>}
        <ul className="mt-2 divide-y divide-gray-100">
          {movements.map((movement) => (
            <li key={movement.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-gray-900">{movementLabels[movement.type]}</p>
                <p className="break-words text-xs text-gray-500">
                  {[
                    new Date(movement.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
                    movement.by,
                    movement.batchNumber && `batch ${movement.batchNumber}`,
                    movement.reason,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <p className={clsx("shrink-0 font-semibold", movement.quantity < 0 ? "text-red-700" : "text-emerald-700")}>
                {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {dialog?.type === "receive" && <ReceiveDialog variationId={id} expiryRequired={expiryRequired} onClose={close} onDone={done} />}
      {dialog?.type === "labels" && variation.barcode && (
        <PrintLabelsDialog
          product={product.name}
          variation={variation.name}
          barcode={variation.barcode}
          price={variation.price}
          suggested={stock.onHand}
          onClose={close}
        />
      )}
      {dialog?.type === "edit" && <EditBatchDialog batch={dialog.batch} expiryRequired={expiryRequired} onClose={close} onDone={done} />}
      {dialog?.type === "adjust" && <AdjustDialog batch={dialog.batch} onClose={close} onDone={done} />}
    </div>
  );
}
