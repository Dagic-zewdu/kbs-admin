"use client";

import { Boxes, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BarcodeField } from "@/components/barcode/barcode-field";
import { BatchFields, emptyBatch, Field, type BatchForm } from "@/components/inventory/batch-fields";
import { RequiredMark } from "@/components/ui/required-mark";
import { ReceiveDialog, ReduceDialog } from "@/components/inventory/stock-dialogs";
import { Button } from "@/components/ui/button";
import { PriceSummary } from "./price-summary";
import { formatDay } from "@/lib/labels";
import { decimalText, toNumber, wholeText } from "@/lib/numbers";
import { useGetSettingsQuery } from "@/store/api/settings.api";
import type { VariationStock } from "@/types/inventory";
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
  sku: string;
  costPrice: string;
  price: string;
  compareAtPrice: string;
  lowStockLevel: string;
  /** Saved stock; undefined for a new variation */
  stock?: VariationStock;
  /** Stock received now, saved as a batch */
  newBatch: BatchForm;
}

let nextKey = 1;
export const emptyVariation = (): VariationRow => ({
  key: `new-${nextKey++}`,
  name: "",
  sizeValue: "",
  sizeUnit: "ml",
  shadeHex: "",
  barcode: "",
  sku: "",
  costPrice: "",
  price: "",
  compareAtPrice: "",
  lowStockLevel: "5",
  newBatch: emptyBatch,
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
  "h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";
const fullWidth = `${inputClasses} w-full min-w-0`;

interface VariationEditorProps {
  type: VariationType;
  rows: VariationRow[];
  onChange: (type: VariationType, rows: VariationRow[]) => void;
  /** The stock was changed and saved */
  onStockChange: (id: string, stock: VariationStock) => void;
  productId?: string;
  expiryRequired: boolean;
}

export function VariationEditor({ type, rows, onChange, onStockChange, productId, expiryRequired }: VariationEditorProps) {
  const changeType = (next: VariationType) => {
    // No options = exactly one row
    const kept = next === "none" ? rows.slice(0, 1) : rows;
    // A size names itself ("150 ml"), which is no shade, scent or pack name
    onChange(next, type === "size" ? kept.map((row) => ({ ...row, name: "" })) : kept);
  };
  const changeRow = (key: string, change: Partial<VariationRow>) =>
    onChange(
      type,
      rows.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
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

      <ul className="space-y-4">
        {rows.map((row, index) => (
          <li key={row.key} className="space-y-4 rounded-xl border border-gray-200 p-3 sm:p-4">
            {type !== "none" && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variation {index + 1}</span>
                <button
                  type="button"
                  aria-label={`Remove variation ${index + 1}`}
                  title={row.stock?.batches ? "It has stock, so it can't be removed" : undefined}
                  disabled={rows.length === 1 || Boolean(row.stock?.batches)}
                  onClick={() =>
                    onChange(
                      type,
                      rows.filter((item) => item.key !== row.key),
                    )
                  }
                  className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
            <VariationFields
              type={type}
              row={row}
              onChange={(change) => changeRow(row.key, change)}
              onStockChange={(stock) => row.id && onStockChange(row.id, stock)}
              productId={productId}
              expiryRequired={expiryRequired}
            />
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

interface VariationFieldsProps {
  type: VariationType;
  row: VariationRow;
  onChange: (change: Partial<VariationRow>) => void;
  onStockChange: (stock: VariationStock) => void;
  productId?: string;
  expiryRequired: boolean;
}

function VariationFields({ type, row, onChange, onStockChange, productId, expiryRequired }: VariationFieldsProps) {
  const nameField = nameLabels[type];
  const settings = useGetSettingsQuery().data?.data;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {nameField && (
          <Field label={nameField.label} isRequired>
            <span className="flex gap-2">
              <input
                value={row.name}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder={nameField.placeholder}
                maxLength={80}
                className={fullWidth}
              />
              {type === "shade" && (
                <input
                  type="color"
                  aria-label="Shade colour"
                  title={row.shadeHex ? "Shade colour" : "Choose the shade colour"}
                  value={row.shadeHex || "#ffffff"}
                  onChange={(event) => onChange({ shadeHex: event.target.value })}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 sm:h-10"
                />
              )}
            </span>
          </Field>
        )}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-gray-700">
            {type === "size" ? "Size" : "Size (optional)"}
            {type === "size" && <RequiredMark />}
          </span>
          <div className="flex gap-2">
            <input
              aria-label="Size"
              inputMode="decimal"
              value={row.sizeValue}
              onChange={(event) => onChange({ sizeValue: decimalText(event.target.value) })}
              placeholder="150"
              className={fullWidth}
            />
            <select
              aria-label="Unit"
              value={row.sizeUnit}
              onChange={(event) => onChange({ sizeUnit: event.target.value as SizeUnit })}
              className={`${inputClasses} w-24 shrink-0`}
            >
              {units.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <BarcodeField isRequired value={row.barcode} onChange={(barcode) => onChange({ barcode })} productId={productId} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Field label="Cost price, ETB" isRequired>
          <input
            inputMode="decimal"
            value={row.costPrice}
            onChange={(event) => onChange({ costPrice: decimalText(event.target.value) })}
            placeholder="1000"
            className={fullWidth}
          />
        </Field>
        <Field label={settings?.vatEnabled ? "Selling price, before VAT" : "Selling price, ETB"} isRequired>
          <input
            inputMode="decimal"
            value={row.price}
            onChange={(event) => onChange({ price: decimalText(event.target.value) })}
            placeholder="1450"
            className={fullWidth}
          />
        </Field>
        <Field label="Old selling price (optional)">
          <input
            inputMode="decimal"
            value={row.compareAtPrice}
            onChange={(event) => onChange({ compareAtPrice: decimalText(event.target.value) })}
            placeholder="1700"
            className={fullWidth}
          />
        </Field>
      </div>
      <PriceSummary price={toNumber(row.price)} cost={toNumber(row.costPrice)} settings={settings} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU (created for you)">
          <input
            value={row.sku}
            onChange={(event) => onChange({ sku: event.target.value.toUpperCase() })}
            placeholder="K12"
            maxLength={50}
            className={fullWidth}
          />
        </Field>
        <Field label="Low-stock alert at (optional)">
          <input
            inputMode="numeric"
            value={row.lowStockLevel}
            onChange={(event) => onChange({ lowStockLevel: wholeText(event.target.value).slice(0, 6) })}
            placeholder="5"
            className={fullWidth}
          />
        </Field>
      </div>

      <Quantity row={row} onChange={onChange} onStockChange={onStockChange} expiryRequired={expiryRequired} />
    </>
  );
}

/** How many there are of this variation. Once saved, it is increased and decreased right away, whatever else is being edited. */
function Quantity({ row, onChange, onStockChange, expiryRequired }: Pick<VariationFieldsProps, "row" | "onChange" | "onStockChange" | "expiryRequired">) {
  const [dialog, setDialog] = useState<"increase" | "decrease" | null>(null);
  const [notice, setNotice] = useState("");
  const stock = row.stock;
  const close = () => setDialog(null);
  const done = (message: string, changed: VariationStock) => {
    setDialog(null);
    setNotice(message);
    onStockChange(changed);
  };

  return (
    <fieldset className="space-y-3 rounded-lg bg-gray-50 p-3 sm:p-4">
      <legend className="sr-only">Quantity in stock</legend>
      {row.id && stock?.batches ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">Quantity in stock</p>
              <p className="text-gray-600">
                {stock.nextExpiry ? `Next expiry ${formatDay(stock.nextExpiry)}` : stock.onHand ? "Doesn't expire" : "Out of stock"}
                {stock.expired > 0 && <span className="text-red-700"> · {stock.expired} expired</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setDialog("decrease")} disabled={stock.onHand === 0}>
                <Minus className="size-4" aria-hidden /> Decrease
              </Button>
              <output className={`min-w-12 text-center text-lg font-semibold ${stock.onHand ? "text-gray-900" : "text-red-700"}`}>{stock.onHand}</output>
              <Button type="button" variant="secondary" onClick={() => setDialog("increase")}>
                <Plus className="size-4" aria-hidden /> Increase
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span role="status" className="text-emerald-700">
              {notice}
            </span>
            <Link href={`/inventory/${row.id}`} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-brand-700 hover:underline">
              <Boxes className="size-4" aria-hidden /> Batches and history
            </Link>
          </div>
          {dialog === "increase" && (
            <ReceiveDialog
              variationId={row.id}
              expiryRequired={expiryRequired}
              title="Increase quantity"
              submitLabel="Increase"
              onClose={close}
              onDone={done}
            />
          )}
          {dialog === "decrease" && <ReduceDialog variationId={row.id} onHand={stock.onHand} onClose={close} onDone={done} />}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-900">Quantity in stock</p>
          <BatchFields value={row.newBatch} expiryRequired={expiryRequired} onChange={(change) => onChange({ newBatch: { ...row.newBatch, ...change } })} />
        </>
      )}
    </fieldset>
  );
}
