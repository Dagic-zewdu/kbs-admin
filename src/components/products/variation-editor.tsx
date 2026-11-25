"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SizeUnit, VariationType } from "@/types/product";

/** A row while editing: text fields stay text until saving */
export interface VariationRow {
  key: string;
  id?: string;
  name: string;
  sizeValue: string;
  sizeUnit: SizeUnit;
  shadeHex: string;
  barcode: string;
}

let nextKey = 1;
export const emptyVariation = (): VariationRow => ({
  key: `new-${nextKey++}`,
  name: "",
  sizeValue: "",
  sizeUnit: "ml",
  shadeHex: "",
  barcode: "",
});

const types: { value: VariationType; label: string; hint: string }[] = [
  { value: "none", label: "No options", hint: "One version only" },
  { value: "size", label: "Size", hint: "50 ml, 150 ml" },
  { value: "shade", label: "Shade", hint: "21 Light, 23 Natural" },
  { value: "scent", label: "Scent", hint: "Rose, Vanilla" },
  { value: "pack", label: "Pack", hint: "1 mask, box of 10" },
];

const nameLabels: Partial<Record<VariationType, { label: string; placeholder: string }>> = {
  shade: { label: "Shade", placeholder: "21 Light Beige" },
  scent: { label: "Scent", placeholder: "Rose" },
  pack: { label: "Pack", placeholder: "Box of 10" },
};

const units: SizeUnit[] = ["ml", "g", "oz", "pcs", "sheets"];
const inputClasses =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

interface VariationEditorProps {
  type: VariationType;
  rows: VariationRow[];
  onChange: (type: VariationType, rows: VariationRow[]) => void;
}

export function VariationEditor({ type, rows, onChange }: VariationEditorProps) {
  const changeType = (next: VariationType) => {
    // No options = exactly one row
    const kept = next === "none" ? rows.slice(0, 1) : rows;
    // A size names itself ("150 ml"), which is no shade, scent or pack name
    onChange(next, type === "size" ? kept.map((row) => ({ ...row, name: "" })) : kept);
  };
  const changeRow = (key: string, change: Partial<VariationRow>) =>
    onChange(type, rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
  const nameField = nameLabels[type];
  const losesRows = type !== "none" && rows.length > 1;

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">Does it come in different versions?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {types.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-lg border border-gray-300 p-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
            >
              <input
                type="radio"
                name="variationType"
                className="sr-only"
                checked={type === option.value}
                onChange={() => changeType(option.value)}
                disabled={option.value === "none" && losesRows}
              />
              <span className={`block font-medium ${option.value === "none" && losesRows ? "text-gray-400" : "text-gray-900"}`}>{option.label}</span>
              <span className="block text-xs text-gray-500">{option.hint}</span>
            </label>
          ))}
        </div>
        {losesRows && <p className="mt-1.5 text-xs text-gray-500">Remove variations until one is left to choose “No options”.</p>}
      </fieldset>

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.key} className="rounded-xl border border-gray-200 p-3 sm:p-4">
            {type !== "none" && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variation {index + 1}</span>
                <button
                  type="button"
                  aria-label={`Remove variation ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => onChange(type, rows.filter((item) => item.key !== row.key))}
                  className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nameField && (
                <label className="space-y-1.5">
                  <span className="block text-sm font-medium text-gray-700">{nameField.label}</span>
                  <span className="flex gap-2">
                    <input
                      value={row.name}
                      onChange={(event) => changeRow(row.key, { name: event.target.value })}
                      placeholder={nameField.placeholder}
                      maxLength={80}
                      className={inputClasses}
                    />
                    {type === "shade" && (
                      <input
                        type="color"
                        aria-label="Shade colour"
                        title={row.shadeHex ? "Shade colour" : "Choose the shade colour"}
                        value={row.shadeHex || "#ffffff"}
                        onChange={(event) => changeRow(row.key, { shadeHex: event.target.value })}
                        className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 sm:h-10"
                      />
                    )}
                  </span>
                </label>
              )}
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-gray-700">{type === "size" ? "Size" : "Size (optional)"}</span>
                <div className="flex gap-2">
                  <input
                    aria-label="Size"
                    inputMode="decimal"
                    value={row.sizeValue}
                    onChange={(event) => changeRow(row.key, { sizeValue: event.target.value.replace(",", ".").replace(/[^\d.]/g, "") })}
                    placeholder="150"
                    className={inputClasses}
                  />
                  <select
                    aria-label="Unit"
                    value={row.sizeUnit}
                    onChange={(event) => changeRow(row.key, { sizeUnit: event.target.value as SizeUnit })}
                    className={`${inputClasses} w-24 shrink-0`}
                  >
                    {units.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="space-y-1.5">
                <span className="block text-sm font-medium text-gray-700">Barcode (optional)</span>
                <input
                  value={row.barcode}
                  onChange={(event) => changeRow(row.key, { barcode: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault(); // barcode scanners press Enter
                  }}
                  placeholder="8809416470009"
                  maxLength={40}
                  className={inputClasses}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {type !== "none" && (
        <Button type="button" variant="secondary" onClick={() => onChange(type, [...rows, emptyVariation()])} disabled={rows.length >= 60}>
          <Plus className="size-4" aria-hidden /> Add variation
        </Button>
      )}
    </div>
  );
}
