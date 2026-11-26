"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { wholeText } from "@/lib/numbers";
import { Field } from "./batch-fields";
import { FormDialog } from "./form-dialog";
import { Label, labelProblem, LabelSheets, papers, type LabelContent, type Paper } from "./label-sheet";

const MAX_LABELS = 1000;
const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

/** One variation to print */
export interface LabelItem {
  id: string;
  product: string;
  variation: string;
  /** The main one; null prints the SKU as the barcode (the scanner finds SKUs too) */
  barcode: string | null;
  sku: string;
  /** What the customer pays, VAT included */
  price: number | null;
  /** Suggested number of labels, e.g. the stock */
  suggested: number;
}

/** Barcode stickers of one or many variations. The browser prints them, or saves a PDF. */
export function PrintLabelsDialog({ items, onClose }: { items: LabelItem[]; onClose: () => void }) {
  const [paper, setPaper] = useState<Paper>(papers[0]);
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, String(Math.min(Math.max(item.suggested, 1), MAX_LABELS))])),
  );
  const [startAt, setStartAt] = useState("1");
  const [withPrice, setWithPrice] = useState(false);
  const [error, setError] = useState("");
  const perPage = paper.columns * paper.rows;
  const skip = perPage > 1 ? Number(startAt) - 1 : 0;
  const isStartValid = skip >= 0 && skip < perPage;
  const contentOf = (item: LabelItem): LabelContent => ({
    product: item.product,
    variation: item.variation,
    barcode: item.barcode ?? item.sku,
    sku: item.sku,
    price: withPrice ? item.price : null,
  });
  const problems = items.flatMap((item) => {
    const problem = labelProblem(item.barcode ?? item.sku, paper);
    return problem ? [`${item.product}${item.variation ? ` · ${item.variation}` : ""}: ${problem}`] : [];
  });
  const total = items.reduce((sum, item) => sum + Number(counts[item.id] || 0), 0);
  const isTotalValid = total >= 1 && total <= MAX_LABELS;
  const labels = isTotalValid && isStartValid && !problems.length ? items.flatMap((item) => Array.from({ length: Number(counts[item.id] || 0) }, () => contentOf(item))) : [];
  const sheets = perPage > 1 ? Math.ceil((skip + total) / perPage) : total;
  const isSingle = items.length === 1;

  const print = () => {
    if (problems.length) return setError(problems[0]);
    if (!isTotalValid) return setError(`Print 1 to ${MAX_LABELS} labels at a time.`);
    if (!isStartValid) return setError(`The first sticker is 1 to ${perPage}.`);
    setError("");
    window.print();
  };
  const setAll = (pick: (item: LabelItem) => number) => setCounts(Object.fromEntries(items.map((item) => [item.id, String(Math.min(Math.max(pick(item), 0), MAX_LABELS))])));

  return (
    <>
      <FormDialog title={isSingle ? "Print labels" : `Print labels of ${items.length} products`} submitLabel={`Print ${total || ""}`.trim()} isLoading={false} error={error || problems[0] || ""} onSubmit={print} onClose={onClose}>
        <Field label="Paper" isRequired>
          <select value={paper.id} onChange={(event) => setPaper(papers.find((item) => item.id === event.target.value) ?? papers[0])} className={inputClasses}>
            {papers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="space-y-2">
          <legend className="flex w-full flex-wrap items-center justify-between gap-2 text-sm font-medium text-gray-700">
            How many labels
            {!isSingle && (
              <span className="flex gap-3 text-sm font-medium text-brand-700">
                <button type="button" onClick={() => setAll((item) => item.suggested || 1)} className="min-h-8 hover:underline">
                  As many as in stock
                </button>
                <button type="button" onClick={() => setAll(() => 1)} className="min-h-8 hover:underline">
                  1 each
                </button>
              </span>
            )}
          </legend>
          <ul className="max-h-[40dvh] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="block break-words font-medium text-gray-900">{[item.product, item.variation].filter(Boolean).join(" · ")}</span>
                  <span className="block text-xs text-gray-500">
                    {item.barcode ?? `${item.sku} (no barcode: the SKU is printed)`} · {item.suggested} in stock
                  </span>
                </span>
                <input
                  aria-label={`Labels of ${item.product} ${item.variation}`.trim()}
                  inputMode="numeric"
                  value={counts[item.id]}
                  onChange={(event) => setCounts({ ...counts, [item.id]: wholeText(event.target.value).slice(0, 4) })}
                  className="h-10 w-20 shrink-0 rounded-lg border border-gray-300 bg-white px-2 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">
            {total} label{total === 1 ? "" : "s"}
            {perPage > 1 ? ` on ${sheets} sheet${sheets === 1 ? "" : "s"}` : ""}.
          </p>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          {perPage > 1 && (
            <Field label="Start at sticker (for a used sheet)" isRequired>
              <input inputMode="numeric" value={startAt} onChange={(event) => setStartAt(wholeText(event.target.value).slice(0, 2))} className={inputClasses} />
            </Field>
          )}
          <label className="flex min-h-11 items-center gap-2 self-end text-sm text-gray-700">
            <input type="checkbox" checked={withPrice} onChange={(event) => setWithPrice(event.target.checked)} className="size-4 accent-brand-600" />
            Print the price
          </label>
        </div>
        {!problems.length && (
          <div className="flex justify-center overflow-x-auto rounded-lg bg-gray-100 p-4">
            <div className="shrink-0 shadow-sm">
              <Label content={contentOf(items[0])} paper={paper} />
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500">In the print window choose the same paper size, no margins and scale 100%.</p>
      </FormDialog>
      {createPortal(
        <div id="print-root" className="hidden">
          <style>{`@media print {
            @page { size: ${paper.page}; margin: 0; }
            html, body { margin: 0; min-height: 0 !important; background: #fff !important; }
            body > *:not(#print-root) { display: none !important; }
            #print-root { display: block !important; }
          }`}</style>
          {labels.length > 0 && <LabelSheets labels={labels} paper={paper} skip={skip} />}
        </div>,
        document.body,
      )}
    </>
  );
}
