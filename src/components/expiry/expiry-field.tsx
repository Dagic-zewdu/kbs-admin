"use client";

import { CalendarDays, ScanText } from "lucide-react";
import { useId, useRef, useState } from "react";
import { RequiredMark } from "@/components/ui/required-mark";
import { parseTypedDate } from "@/lib/expiry-date";
import { formatDay } from "@/lib/labels";
import { ExpiryScanner } from "./expiry-scanner";

interface ExpiryFieldProps {
  label: string;
  isRequired?: boolean;
  /** yyyy-mm-dd, or "" */
  value: string;
  onChange: (value: string) => void;
}

const toText = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

/** Type it any way (18/05/2028, 180528, 05/28), pick it, or scan it from the package */
export function ExpiryField({ label, isRequired, value, onChange }: ExpiryFieldProps) {
  const inputId = useId();
  const hintId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => toText(value));
  const [shown, setShown] = useState(value);
  const [isScanning, setIsScanning] = useState(false);
  // Changed from outside (a scan, a reset): show it
  if (value !== shown) {
    setShown(value);
    setText(toText(value));
  }
  const typed = parseTypedDate(text);
  const isUnclear = text.trim() !== "" && !typed;

  const type = (next: string) => {
    setText(next);
    const parsed = parseTypedDate(next);
    const date = parsed?.date ?? "";
    setShown(date);
    onChange(date);
  };
  const use = (date: string) => {
    setShown(date);
    setText(toText(date));
    onChange(date);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={inputId}
            value={text}
            inputMode="numeric"
            autoComplete="off"
            maxLength={24}
            aria-required={isRequired}
            aria-invalid={isUnclear}
            aria-describedby={hintId}
            placeholder="18/05/2028"
            onChange={(event) => type(event.target.value)}
            onBlur={() => typed && setText(toText(typed.date))}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-red-400 sm:h-10"
          />
          <button
            type="button"
            aria-label="Choose on a calendar"
            onClick={() => pickerRef.current?.showPicker?.()}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-900"
          >
            <CalendarDays className="size-4" />
          </button>
          <input ref={pickerRef} type="date" tabIndex={-1} aria-hidden value={value} onChange={(event) => use(event.target.value)} className="pointer-events-none absolute bottom-0 right-0 size-px opacity-0" />
        </div>
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:h-10"
        >
          <ScanText className="size-4" aria-hidden /> Scan
        </button>
      </div>
      <p id={hintId} className={`text-xs ${isUnclear ? "text-red-600" : "text-gray-500"}`}>
        {isUnclear
          ? "Not a date. Try 18/05/2028, 180528 or 05/28."
          : typed
            ? `${formatDay(typed.date)}${typed.isMonthOnly ? " (the last day of the month)" : ""}${typed.swapped ? `. Or did you mean ${formatDay(typed.swapped)}?` : ""}`
            : "Type it, or scan it from the package."}
      </p>
      {isScanning && (
        <ExpiryScanner
          onClose={() => setIsScanning(false)}
          onUse={(date) => {
            setIsScanning(false);
            use(date);
          }}
        />
      )}
    </div>
  );
}
