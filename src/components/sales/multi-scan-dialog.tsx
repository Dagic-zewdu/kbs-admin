"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ScannerDialog } from "@/components/barcode/scanner-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { useLazyLookupForSaleQuery } from "@/store/api/sales.api";
import { problemText, saleProblemLabels, type SaleLookup } from "@/types/sale";

/** One product scanned so far */
export interface ScannedLine {
  lookup: SaleLookup;
  variationId: string;
  quantity: number;
}

/** The same code seen again this soon is the same item still in the frame */
const REPEAT_MS = 1500;

/** A short beep: scanned. A lower one: problem. */
const beep = (ok: boolean) => {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = ok ? 1250 : 320;
    gain.gain.value = 0.15;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (ok ? 0.09 : 0.25));
    oscillator.onended = () => context.close();
  } catch {
    // No sound: the vibration and the list still show it
  }
  navigator.vibrate?.(ok ? 60 : [80, 60, 80]);
};

const variationOf = (line: ScannedLine) => line.lookup.variations.find((variation) => variation.id === line.variationId)!;
const label = (line: ScannedLine) => [line.lookup.product.name, variationOf(line).name].filter(Boolean).join(" · ");

/**
 * The camera stays open: every scan goes into the list below it.
 * "Add" or closing puts the sellable ones into the sale; "Discard" closes without adding.
 */
export function MultiScanDialog({ onAdd, onClose }: { onAdd: (lines: ScannedLine[]) => void; onClose: () => void }) {
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(0);
  const [find] = useLazyLookupForSaleQuery();
  const lastSeen = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const scan = async (code: string) => {
    const now = Date.now();
    if (code === lastSeen.current.code && now - lastSeen.current.at < REPEAT_MS) return;
    lastSeen.current = { code, at: now };
    setPending((count) => count + 1);
    const response = await find(code);
    setPending((count) => count - 1);
    if (!response.data) {
      beep(false);
      const notFound = response.error && "data" in response.error && (response.error.data as { code?: string })?.code === "CODE_NOT_FOUND";
      return setMessage({ ok: false, text: notFound ? `Not found: no product has the code ${code}.` : getErrorMessage(response.error) });
    }
    const lookup = response.data.data;
    const scanned = lookup.variations.find((variation) => variation.id === lookup.scannedVariationId)!;
    beep(scanned.canBeSold);
    setLines((current) => {
      const existing = current.find((line) => line.variationId === scanned.id);
      if (existing) {
        return current.map((line) => (line === existing ? { ...line, quantity: Math.min(line.quantity + 1, Math.max(scanned.onHand, 1)) } : line));
      }
      return [{ lookup, variationId: scanned.id, quantity: 1 }, ...current];
    });
    const name = [lookup.product.name, scanned.name].filter(Boolean).join(" · ");
    setMessage({ ok: scanned.canBeSold, text: scanned.canBeSold ? `Added ${name}` : `${name}: ${problemText(scanned.problem!, lookup.product.status)}` });
  };

  const update = (index: number, change: Partial<ScannedLine>) => setLines((current) => current.map((line, at) => (at === index ? { ...line, ...change } : line)));
  const sellable = lines.filter((line) => variationOf(line).canBeSold);
  const units = sellable.reduce((sum, line) => sum + line.quantity, 0);
  const finish = () => {
    if (sellable.length) onAdd(sellable);
    onClose();
  };

  return (
    <ScannerDialog
      title="Scan the products"
      onScan={scan}
      onClose={finish}
      footer={
        <>
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2 text-sm">
            <span className="font-semibold">
              Scanned: {units} {units === 1 ? "unit" : "units"}
            </span>
            {pending > 0 && <Loader2 className="size-4 animate-spin text-brand-600" aria-label="Looking up" />}
          </div>
          {message && (
            <p
              role={message.ok ? "status" : "alert"}
              className={clsx(
                "flex items-start gap-2 border-b px-4 py-2.5 text-sm font-medium",
                message.ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
              )}
            >
              {message.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
              {message.text}
            </p>
          )}
          <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
            {lines.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">Point the camera at each product. They are listed here.</li>}
            {lines.map((line, index) => {
              const variation = variationOf(line);
              const max = Math.max(variation.onHand, 1);
              return (
                <li key={`${line.variationId}-${index}`} className={clsx("space-y-1.5 px-4 py-2.5 text-sm", !variation.canBeSold && "bg-red-50")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={clsx("font-medium", variation.canBeSold ? "text-gray-900" : "text-red-800")}>{label(line)}</p>
                      <p className={clsx("text-xs", variation.canBeSold ? "text-gray-500" : "text-red-700")}>
                        {variation.canBeSold ? `${formatPrice(variation.customerPrice)} · ${variation.onHand} in stock` : `Not added. ${problemText(variation.problem!, line.lookup.product.status)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLines((current) => current.filter((_, at) => at !== index))}
                      aria-label={`Remove ${label(line)}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {line.lookup.variations.length > 1 && (
                      <select
                        value={line.variationId}
                        aria-label="Size or shade"
                        onChange={(event) => update(index, { variationId: event.target.value, quantity: 1 })}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
                      >
                        {line.lookup.variations.map((option) => (
                          <option key={option.id} value={option.id} disabled={!option.canBeSold}>
                            {option.name || "Standard"}
                            {option.canBeSold ? ` · ${option.onHand} in stock` : ` · ${saleProblemLabels[option.problem!]}`}
                          </option>
                        ))}
                      </select>
                    )}
                    {variation.canBeSold && (
                      <div className="flex items-center rounded-lg border border-gray-300">
                        <button type="button" onClick={() => update(index, { quantity: Math.max(line.quantity - 1, 1) })} disabled={line.quantity <= 1} aria-label="One less" className="flex size-9 items-center justify-center disabled:opacity-40">
                          <Minus className="size-4" aria-hidden />
                        </button>
                        <span className="w-8 text-center tabular-nums">{line.quantity}</span>
                        <button type="button" onClick={() => update(index, { quantity: Math.min(line.quantity + 1, max) })} disabled={line.quantity >= max} aria-label="One more" className="flex size-9 items-center justify-center disabled:opacity-40">
                          <Plus className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Discard
            </button>
            <button type="button" onClick={finish} disabled={!sellable.length} className="min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-brand-300">
              Add {units ? `${units} ${units === 1 ? "item" : "items"}` : "items"} to the sale
            </button>
          </div>
        </>
      }
    />
  );
}
