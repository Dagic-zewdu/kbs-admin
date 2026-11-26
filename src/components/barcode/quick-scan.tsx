"use client";

import { Loader2, ScanBarcode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FormDialog } from "@/components/inventory/form-dialog";
import { ProductStatusBadge } from "@/components/products/product-labels";
import { FadeImage } from "@/components/ui/fade-image";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { useLazyScanCodeQuery } from "@/store/api/inventory.api";
import type { ScannedItem } from "@/types/inventory";
import { ScanInput } from "./scan-input";

const problems: Record<NonNullable<ScannedItem["problem"]>, string> = {
  STATUS: "It can't be sold: it's a draft or inactive.",
  NO_PRICE: "It can't be sold: it has no selling price.",
  OUT_OF_STOCK: "It can't be sold: it's out of stock.",
};

/** Scan any code to see what it is */
export function QuickScan() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        <ScanBarcode className="size-4" aria-hidden /> Scan
      </Button>
      {isOpen && <QuickScanDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

function QuickScanDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [scan, { data, error, isFetching }] = useLazyScanCodeQuery();
  const find = (value: string) => {
    const code = value.trim();
    if (!code) return;
    setAsked(code);
    scan(code);
  };
  const isAnswered = asked !== "" && asked === text.trim() && !isFetching;
  const item = isAnswered && !error ? data?.data : undefined;
  const isUnknown = isAnswered && Boolean(error) && "data" in error! && (error.data as { code?: string }).code === "CODE_NOT_FOUND";

  return (
    <FormDialog title="What is it?" submitLabel="Find" isLoading={isFetching} error={isAnswered && !isUnknown ? getErrorMessage(error) : ""} onSubmit={() => find(text)} onClose={onClose}>
      <ScanInput label="Barcode or SKU" value={text} onChange={setText} onDone={find} />
      {isFetching && <Loader2 className="mx-auto size-5 animate-spin text-brand-600" aria-label="Looking" />}
      {item && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3" role="status">
          <div className="flex gap-3">
            {item.product.photoUrl && <FadeImage src={item.product.photoUrl} className="size-16 rounded-lg border border-gray-200" />}
            <div className="min-w-0 text-sm">
              <p className="break-words font-semibold text-gray-900">{[item.product.name, item.variation.name].filter(Boolean).join(" · ")}</p>
              <p className="text-gray-600">{[item.product.brand, item.variation.sku].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-gray-900">
                <strong className="font-semibold">{formatPrice(item.customerPrice)}</strong> · {item.onHand} in stock
                {item.nextExpiry && ` · expires ${formatDay(item.nextExpiry)}`}
              </p>
              <p className="mt-1">
                <ProductStatusBadge status={item.product.status} />
              </p>
            </div>
          </div>
          <p className={`text-sm ${item.problem ? "text-amber-800" : "text-emerald-700"}`}>{item.problem ? problems[item.problem] : "It can be sold."}</p>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-brand-700">
            <Link href={`/products/${item.product.id}`} className="hover:underline">
              Open product
            </Link>
            <Link href={`/inventory/${item.variation.id}`} className="hover:underline">
              Stock
            </Link>
          </div>
        </div>
      )}
      {isUnknown && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No product of yours has this code.{" "}
          <Link href={`/products/new?barcode=${encodeURIComponent(asked)}`} className="font-semibold underline">
            Register a new product
          </Link>
          , or add it to an existing product with “Add another barcode”.
        </div>
      )}
    </FormDialog>
  );
}
