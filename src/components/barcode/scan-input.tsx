"use client";

import { ScanBarcode } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/required-mark";
import { ScannerDialog } from "./scanner-dialog";

interface ScanInputProps {
  label: string;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** A scan, or Enter (USB scanners press it) */
  onDone?: (value: string) => void;
}

/** A barcode to scan with the camera or a USB scanner, or to type */
export function ScanInput({ label, isRequired, value, onChange, onDone }: ScanInputProps) {
  const inputId = useId();
  const [isScanning, setIsScanning] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          aria-required={isRequired}
          maxLength={40}
          autoComplete="off"
          placeholder="Scan or type it"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault(); // a USB scanner never submits the form
            onDone?.(value);
          }}
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10"
        />
        <Button type="button" variant="secondary" onClick={() => setIsScanning(true)}>
          <ScanBarcode className="size-4" aria-hidden /> Scan
        </Button>
      </div>
      {isScanning && (
        <ScannerDialog
          onClose={() => setIsScanning(false)}
          onScan={(code) => {
            setIsScanning(false);
            onChange(code);
            onDone?.(code);
          }}
        />
      )}
    </div>
  );
}
