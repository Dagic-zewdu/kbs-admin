"use client";

import { useState } from "react";
import { PriceSummary } from "@/components/products/price-summary";
import { ScanInput } from "@/components/barcode/scan-input";
import { normalizeBarcode } from "@/lib/barcode";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { decimalText, toNumber, wholeText } from "@/lib/numbers";
import { useAdjustBatchMutation, useGetVariationStockQuery, useReceiveBatchMutation, useScanCodeQuery, useReduceStockMutation, useUpdateBatchMutation } from "@/store/api/inventory.api";
import { useGetSettingsQuery } from "@/store/api/settings.api";
import type { AdjustBatch, Batch, ReduceReason, VariationStockDetail } from "@/types/inventory";
import { BatchFields, emptyBatch, Field, inputClasses, toBatchDetails, toReceiveBatch, type BatchForm } from "./batch-fields";
import { FormDialog } from "./form-dialog";

interface DoneProps {
  onClose: () => void;
  onDone: (message: string, changed: VariationStockDetail) => void;
}

/** The variation's prices now, as typed */
export interface PricesNow {
  cost: string;
  price: string;
  oldPrice: string;
}

interface IncreaseDialogProps extends DoneProps {
  variationId: string;
  expiryRequired: boolean;
  now: PricesNow;
  /** Already in stock */
  onHand: number;
}

/** A delivery: how many, when they expire, and their prices */
export function IncreaseDialog({ variationId, expiryRequired, now, onHand, onClose, onDone }: IncreaseDialogProps) {
  const [form, setForm] = useState<BatchForm>(emptyBatch);
  const [barcode, setBarcode] = useState("");
  const [isSameProduct, setIsSameProduct] = useState(false);
  const detail = useGetVariationStockQuery(variationId).data?.data;
  const known = detail?.variation.barcodes;
  const code = normalizeBarcode(barcode);
  const isKnown = Boolean(known?.some((item) => item.barcode === code));
  // A first barcode needs no question: there is nothing to compare it with
  const isNew = Boolean(code.length >= 2 && known?.length && !isKnown);
  const owner = useScanCodeQuery(code, { skip: !isNew || code.length < 4 });
  const other = isNew && owner.currentData?.data.matchedBy === "barcode" ? owner.currentData.data : undefined;
  const [costText, setCostText] = useState(now.cost);
  const [priceText, setPriceText] = useState(now.price);
  const [localError, setLocalError] = useState("");
  const [receive, { isLoading, error }] = useReceiveBatchMutation();
  const settings = useGetSettingsQuery().data?.data;
  const cost = toNumber(costText);
  const price = toNumber(priceText);
  const isPriceChanged = price !== null && price > 0 && price !== toNumber(now.price);
  const losesDiscount = price !== null && toNumber(now.oldPrice) !== null && price >= Number(now.oldPrice);

  const submit = async () => {
    if (!code) return setLocalError("Scan or type the barcode on the units that arrived.");
    if (other) return setLocalError(`This barcode belongs to ${other.product.name}.`);
    if (isNew && !isSameProduct) return setLocalError("Confirm that the new barcode is the same product.");
    if (!(Number(form.quantity) > 0)) return setLocalError("Enter how many units to add.");
    if (expiryRequired && !form.expiryDate) return setLocalError("Enter the expiry date from the package.");
    if (cost === null || !Number.isFinite(cost)) return setLocalError("Enter the cost price of one unit.");
    if (price === null || !(price > 0)) return setLocalError("Enter the selling price of one unit.");
    setLocalError("");
    const result = await receive({ variationId, ...toReceiveBatch(form), barcode: code, addBarcode: isNew || undefined, unitCost: cost, unitPrice: price });
    if (result.data) onDone(`${form.quantity} units were added.`, result.data.data);
  };
  const typing = (apply: () => void) => {
    apply();
    setLocalError("");
  };

  return (
    <FormDialog title="Increase quantity" submitLabel="Increase" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <div className="space-y-2">
        <ScanInput
          label="Barcode on the units that arrived"
          isRequired
          value={barcode}
          onChange={(value) =>
            typing(() => {
              setBarcode(value);
              setIsSameProduct(false);
            })
          }
        />
        {Boolean(known?.length) && !code && (
          <div className="flex flex-wrap gap-2">
            {known?.map((item) => (
              <button
                key={item.barcode}
                type="button"
                onClick={() => typing(() => setBarcode(item.barcode))}
                className="min-h-9 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:border-brand-300 hover:bg-brand-50"
              >
                {item.barcode}
              </button>
            ))}
          </div>
        )}
        {isKnown && <p className="text-sm text-emerald-700">This product.</p>}
        {other && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
            This barcode belongs to <strong className="font-semibold">{other.product.name}</strong> ({other.variation.sku}).
          </p>
        )}
        {isNew && !other && (
          <label className="flex cursor-pointer gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={isSameProduct}
              onChange={(event) => typing(() => setIsSameProduct(event.target.checked))}
              className="mt-0.5 size-4 shrink-0 accent-brand-600"
            />
            <span>
              This barcode is new. <strong className="font-semibold">It&apos;s the same product, size and shade</strong>, only the barcode is different. Add it.
            </span>
          </label>
        )}
      </div>
      <BatchFields value={form} onChange={(change) => typing(() => setForm({ ...form, ...change }))} expiryRequired={expiryRequired}>
        <Field label="Cost price of one unit, ETB" isRequired>
          <input
            inputMode="decimal"
            value={costText}
            onChange={(event) => typing(() => setCostText(decimalText(event.target.value)))}
            placeholder="1000"
            className={inputClasses}
          />
        </Field>
        <Field label={settings?.vatEnabled ? "Selling price of one unit, before VAT" : "Selling price of one unit, ETB"} isRequired>
          <input
            inputMode="decimal"
            value={priceText}
            onChange={(event) => typing(() => setPriceText(decimalText(event.target.value)))}
            placeholder="1450"
            className={inputClasses}
          />
        </Field>
      </BatchFields>
      <PriceSummary price={price} cost={cost} settings={settings} />
      {isPriceChanged && toNumber(now.price) !== null && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
          The selling price changes from {formatPrice(toNumber(now.price))} to {formatPrice(price)}
          {onHand > 0 ? `, also for the ${onHand} units already in stock` : ""}.{losesDiscount && " The old selling price is removed."}
        </p>
      )}
    </FormDialog>
  );
}

export function EditBatchDialog({ batch, expiryRequired, onClose, onDone }: DoneProps & { batch: Batch; expiryRequired: boolean }) {
  const [form, setForm] = useState<BatchForm>({
    quantity: "",
    expiryDate: batch.expiryDate ?? "",
    batchNumber: batch.batchNumber ?? "",
    manufacturingDate: batch.manufacturingDate ?? "",
  });
  const [costText, setCostText] = useState(batch.unitCost === null ? "" : String(batch.unitCost));
  const [update, { isLoading, error }] = useUpdateBatchMutation();

  const submit = async () => {
    const result = await update({ id: batch.id, ...toBatchDetails(form), unitCost: toNumber(costText) });
    if (result.data) onDone("The batch was saved.", result.data.data);
  };

  return (
    <FormDialog title="Correct the batch" submitLabel="Save" isLoading={isLoading} error={getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <BatchFields value={form} onChange={(change) => setForm({ ...form, ...change })} expiryRequired={expiryRequired} withQuantity={false}>
        <Field label="Cost price of these units, ETB (optional)">
          <input inputMode="decimal" value={costText} onChange={(event) => setCostText(decimalText(event.target.value))} className={inputClasses} />
        </Field>
      </BatchFields>
    </FormDialog>
  );
}

const reasons: { value: ReduceReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost or stolen" },
  { value: "expired", label: "Expired" },
  { value: "tester", label: "Used as a tester" },
  { value: "gift", label: "Given as a gift" },
  { value: "supplier_return", label: "Sent back to the supplier" },
  { value: "wrong_count", label: "Wrong count: there are fewer" },
  { value: "other", label: "Other" },
];
const NOTE_MIN = 3;

interface DecreaseDialogProps extends DoneProps {
  variationId: string;
  onHand: number;
  expired: number;
}

/** Fewer units, without choosing a batch. Always with a reason. */
export function DecreaseDialog({ variationId, onHand, expired, onClose, onDone }: DecreaseDialogProps) {
  const [reasonCode, setReasonCode] = useState<ReduceReason | "">("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [reduce, { isLoading, error }] = useReduceStockMutation();
  const units = Number(quantity);
  const isExpired = reasonCode === "expired";
  const available = isExpired ? expired : onHand;
  const typing = (apply: () => void) => {
    apply();
    setLocalError("");
  };

  const submit = async () => {
    if (!reasonCode) return setLocalError("Choose why.");
    if (!(units > 0)) return setLocalError("Enter how many units to take away.");
    if (units > available) return setLocalError(`Only ${available} ${isExpired ? "expired " : ""}units are in stock.`);
    if (note.trim().length < NOTE_MIN) return setLocalError("Write what happened.");
    setLocalError("");
    const result = await reduce({ variationId, reasonCode, quantity: units, reason: note.trim() });
    if (result.data) onDone(`${units} units were taken away.`, result.data.data);
  };

  return (
    <FormDialog title="Decrease quantity" submitLabel="Decrease" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="text-sm text-gray-600">
        {isExpired ? `${expired} expired units.` : `${onHand} in stock. The units that expire first are taken away.`}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Why" isRequired>
          <select value={reasonCode} onChange={(event) => typing(() => setReasonCode(event.target.value as ReduceReason | ""))} className={inputClasses}>
            <option value="">Choose why</option>
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How many to take away" isRequired>
          <input
            inputMode="numeric"
            value={quantity}
            onChange={(event) => typing(() => setQuantity(wholeText(event.target.value).slice(0, 7)))}
            className={inputClasses}
          />
        </Field>
      </div>
      <Field label="What happened" isRequired>
        <input
          value={note}
          maxLength={300}
          onChange={(event) => typing(() => setNote(event.target.value))}
          placeholder="The bottle broke in the store"
          className={inputClasses}
        />
      </Field>
      {units > 0 && units <= available && (
        <p className="text-sm text-gray-700">
          After this: <strong className="font-semibold">{available - units}</strong> {isExpired ? "expired units" : "in stock"}
        </p>
      )}
    </FormDialog>
  );
}

type Adjustment = ReduceReason | "returned" | "recount";
const adjustments: { value: Adjustment; label: string }[] = [
  // Fewer by a wrong count is "Counted again" here: the batch is known
  ...reasons.filter((item) => item.value !== "wrong_count"),
  { value: "returned", label: "Returned by a customer" },
  { value: "recount", label: "Counted again" },
];

/** One batch. "Counted again" sets the number there really is. */
export function AdjustDialog({ batch, onClose, onDone }: DoneProps & { batch: Batch }) {
  const [what, setWhat] = useState<Adjustment | "">("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [adjust, { isLoading, error }] = useAdjustBatchMutation();
  const noteRequired = what !== "returned";
  const typing = (apply: () => void) => {
    apply();
    setLocalError("");
  };

  const submit = async () => {
    if (!what) return setLocalError("Choose what happened.");
    if (quantity === "" || (what !== "recount" && Number(quantity) === 0)) return setLocalError("Enter the number of units.");
    if (noteRequired && note.trim().length < NOTE_MIN) return setLocalError("Write what happened.");
    setLocalError("");
    const common = { quantity: Number(quantity), reason: note.trim() };
    const body: AdjustBatch =
      what === "returned" ? { type: "returned", ...common } : what === "recount" ? { type: "corrected", ...common } : { type: "damaged", reasonCode: what, ...common };
    const result = await adjust({ id: batch.id, ...body });
    if (result.data) onDone("The stock was changed.", result.data.data);
  };

  return (
    <FormDialog title="Change stock" submitLabel="Change" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="text-sm text-gray-600">This batch has {batch.quantityOnHand} units.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Why" isRequired>
          <select value={what} onChange={(event) => typing(() => setWhat(event.target.value as Adjustment | ""))} className={inputClasses}>
            <option value="">Choose why</option>
            {adjustments.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={what === "recount" ? "Units there really are" : "How many units"} isRequired>
          <input
            inputMode="numeric"
            value={quantity}
            onChange={(event) => typing(() => setQuantity(wholeText(event.target.value).slice(0, 7)))}
            className={inputClasses}
          />
        </Field>
      </div>
      <Field label={noteRequired ? "What happened" : "Note (optional)"} isRequired={noteRequired}>
        <input value={note} maxLength={300} onChange={(event) => typing(() => setNote(event.target.value))} className={inputClasses} />
      </Field>
    </FormDialog>
  );
}
