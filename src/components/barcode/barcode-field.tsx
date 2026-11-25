"use client";

import { ScanBarcode, Tag } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/required-mark";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateInternalBarcodeMutation, useGetProductByBarcodeQuery } from "@/store/api/products.api";
import { ScannerDialog } from "./scanner-dialog";

interface BarcodeFieldProps {
  value: string;
  onChange: (barcode: string) => void;
  /** The product being edited: its own barcodes are fine */
  productId?: string;
  /** Big buttons, for the first step of a new product */
  prominent?: boolean;
  isRequired?: boolean;
}

/** Scan with the camera, type, or create a code for an item without a barcode. Says when another product already has it. */
export function BarcodeField({ value, onChange, productId, prominent, isRequired }: BarcodeFieldProps) {
  const inputId = useId();
  const [isScanning, setIsScanning] = useState(false);
  // Looked up after a scan or when leaving the field, not while typing
  const [checked, setChecked] = useState("");
  const [createCode, codeState] = useCreateInternalBarcodeMutation();
  const typed = value.trim();
  const lookup = useGetProductByBarcodeQuery(checked, { skip: checked.length < 2, refetchOnMountOrArgChange: true });
  const owner = checked === typed && !lookup.isFetching && !lookup.isError ? lookup.data?.data.product : undefined;
  const usedBy = owner && owner.id !== productId ? owner : undefined;

  const set = (barcode: string) => {
    onChange(barcode);
    setChecked(barcode.trim());
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        Barcode
        {isRequired && <RequiredMark />}
      </label>
      <div className={prominent ? "grid gap-2 sm:grid-cols-[1fr_auto]" : "flex flex-wrap gap-2"}>
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setChecked(typed)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault(); // USB scanners press Enter
              setChecked(typed);
            }
          }}
          aria-required={isRequired}
          placeholder="Scan or type it"
          maxLength={40}
          autoComplete="off"
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10"
        />
        <Button type="button" variant={prominent && !typed ? "primary" : "secondary"} onClick={() => setIsScanning(true)}>
          <ScanBarcode className="size-4" aria-hidden /> Scan
        </Button>
      </div>
      {!typed && (
        <button
          type="button"
          disabled={codeState.isLoading}
          onClick={async () => {
            const result = await createCode();
            if (result.data) set(result.data.data.barcode);
          }}
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline disabled:opacity-50"
        >
          <Tag className="size-4" aria-hidden /> No barcode on the package? Create a code
        </button>
      )}
      {codeState.error && <p className="text-sm text-red-600">{getErrorMessage(codeState.error)}</p>}
      {usedBy && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
          You already have this product: <strong className="font-semibold">{usedBy.name}</strong>.{" "}
          <Link href={`/products/${usedBy.id}`} className="font-semibold underline">
            Open it
          </Link>
        </p>
      )}
      {isScanning && (
        <ScannerDialog
          onClose={() => setIsScanning(false)}
          onScan={(barcode) => {
            setIsScanning(false);
            set(barcode);
          }}
        />
      )}
    </div>
  );
}
