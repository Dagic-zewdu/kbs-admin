"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { wholeText } from "@/lib/numbers";
import { Field } from "./batch-fields";
import { FormDialog } from "./form-dialog";
import { Label, labelProblem, LabelSheets, papers, type Paper } from "./label-sheet";

const MAX_LABELS = 500;
const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

interface PrintLabelsDialogProps {
  product: string;
  variation: string;
  barcode: string;
  /** What the customer pays, VAT included */
  price: number | null;
  /** Suggested number of labels */
  suggested: number;
  onClose: () => void;
}

/** Barcode stickers of one variation. The browser prints them, or saves a PDF. */
export function PrintLabelsDialog({ product, variation, barcode, price, suggested, onClose }: PrintLabelsDialogProps) {
  const [paper, setPaper] = useState<Paper>(papers[0]);
  const [count, setCount] = useState(String(Math.min(Math.max(suggested, 1), MAX_LABELS)));
  const [startAt, setStartAt] = useState("1");
  const [withPrice, setWithPrice] = useState(false);
  const [error, setError] = useState("");
  const perPage = paper.columns * paper.rows;
  const content = { product, variation, barcode, price: withPrice ? price : null };
  const problem = labelProblem(barcode, paper);
  const total = Number(count);
  const skip = perPage > 1 ? Number(startAt) - 1 : 0;
  const isCountValid = total >= 1 && total <= MAX_LABELS;
  const isStartValid = skip >= 0 && skip < perPage;

  const print = () => {
    if (problem) return;
    if (!isCountValid) return setError(`Enter 1 to ${MAX_LABELS} labels.`);
    if (!isStartValid) return setError(`The first sticker is 1 to ${perPage}.`);
    setError("");
    window.print();
  };

  return (
    <>
      <FormDialog title="Print labels" submitLabel="Print" isLoading={false} error={problem || error} onSubmit={print} onClose={onClose}>
        <Field label="Paper">
          <select
            value={paper.id}
            onChange={(event) => setPaper(papers.find((item) => item.id === event.target.value) ?? papers[0])}
            className={inputClasses}
          >
            {papers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="How many labels">
            <input inputMode="numeric" value={count} onChange={(event) => setCount(wholeText(event.target.value).slice(0, 3))} className={inputClasses} />
          </Field>
          {perPage > 1 && (
            <Field label="Start at sticker (for a used sheet)">
              <input inputMode="numeric" value={startAt} onChange={(event) => setStartAt(wholeText(event.target.value).slice(0, 2))} className={inputClasses} />
            </Field>
          )}
        </div>
        {price !== null && (
          <label className="flex min-h-9 items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={withPrice} onChange={(event) => setWithPrice(event.target.checked)} className="size-4 accent-brand-600" />
            Print the price
          </label>
        )}
        {!problem && (
          <div className="flex justify-center overflow-x-auto rounded-lg bg-gray-100 p-4">
            <div className="shrink-0 shadow-sm">
              <Label content={content} paper={paper} />
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
          {!problem && isCountValid && isStartValid && <LabelSheets content={content} paper={paper} count={total} skip={skip} />}
        </div>,
        document.body,
      )}
    </>
  );
}
