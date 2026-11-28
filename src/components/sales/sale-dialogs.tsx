"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, inputClasses } from "@/components/inventory/field";
import { FormDialog } from "@/components/inventory/form-dialog";
import { todayText } from "@/components/suppliers/pay-dialog";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import {
  useGetSaleQuery,
  useAddSalePaymentMutation,
  useCancelSaleMutation,
  useChangeDeliveryStatusMutation,
  useRefundSaleMutation,
  useReturnSaleItemsMutation,
  useUpdateDeliveryMutation,
} from "@/store/api/sales.api";
import { MethodSelect, useMethods } from "@/components/company-lists/method-select";
import { deliveryStatusLabels, returnReasonLabels, type DeliveryStatus, type ReturnReason, type Sale } from "@/types/sale";

const cents = (value: number) => Math.round(value * 100);
const birr = (value: number) => value / 100;

function AmountInput({ value, onChange, max, label }: { value: string; onChange: (value: string) => void; max: number; label: string }) {
  return (
    <Field label={label} isRequired>
      <div className="flex gap-2">
        <input inputMode="decimal" value={value} onChange={(event) => onChange(decimalText(event.target.value))} placeholder={String(max)} className={inputClasses} />
        <button type="button" onClick={() => onChange(String(max))} className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50">
          All
        </button>
      </div>
    </Field>
  );
}

type Done = (message: string) => void;

/** Money the customer paid after the sale */
export function AddPaymentDialog({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: Done }) {
  const [amount, setAmount] = useState("");
  const { cash } = useMethods();
  const [chosenMethod, setMethod] = useState("");
  const method = chosenMethod || cash?.id || "";
  const [paidOn, setPaidOn] = useState(todayText);
  const [note, setNote] = useState("");
  const [viaDeliverer, setViaDeliverer] = useState(false);
  const [localError, setLocalError] = useState("");
  const [pay, { isLoading, error }] = useAddSalePaymentMutation();

  const submit = async () => {
    const value = Number(amount);
    if (!(value > 0)) return setLocalError("Enter the amount paid.");
    if (cents(value) > cents(sale.money.left)) return setLocalError(`Only ${formatPrice(sale.money.left)} is left to pay.`);
    const result = await pay({ id: sale.id, amount: value, methodId: method, paidOn: paidOn || null, note: note.trim() || null, viaDeliverer });
    if (result.data) onDone(`${formatPrice(value)} recorded.`);
  };

  return (
    <FormDialog title="Record a payment" submitLabel="Record payment" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">Left to pay: {formatPrice(sale.money.left)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <AmountInput label="Amount, ETB" value={amount} onChange={(value) => (setAmount(value), setLocalError(""))} max={sale.money.left} />
        <MethodSelect value={method} onChange={setMethod} />
        <Field label="Paid on" isRequired>
          <input type="date" value={paidOn} max={todayText()} onChange={(event) => setPaidOn(event.target.value)} className={inputClasses} />
        </Field>
        <Field label="Note (optional)">
          <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} placeholder="Telebirr ref 8FK21" className={inputClasses} />
        </Field>
      </div>
      {sale.delivery && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-gray-800">
          <input type="checkbox" checked={viaDeliverer} onChange={(event) => setViaDeliverer(event.target.checked)} className="size-5 rounded border-gray-300 text-brand-600" />
          {sale.delivery.deliverer.name ?? "The deliverer"} collected it (they hold it until they hand it in)
        </label>
      )}
    </FormDialog>
  );
}

const NEXT: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["on_the_way", "delivered", "failed"],
  on_the_way: ["delivered", "failed", "returned", "pending"],
  failed: ["on_the_way", "delivered", "returned", "pending"],
  delivered: [],
  returned: [],
  cancelled: [],
};
export const nextDeliveryStatuses = (status: DeliveryStatus) => NEXT[status];

/** Move a delivery on; delivered can record what the deliverer collected */
export function DeliveryStatusDialog({ sale, to, onClose, onDone }: { sale: Sale; to: Exclude<DeliveryStatus, "cancelled">; onClose: () => void; onDone: Done }) {
  const delivery = sale.delivery!;
  const collects = to === "delivered" && sale.money.left > 0;
  const [collect, setCollect] = useState(collects && delivery.cashOnDelivery);
  const [amount, setAmount] = useState(String(sale.money.left));
  const { cash } = useMethods();
  const [chosenMethod, setMethod] = useState("");
  const method = chosenMethod || cash?.id || "";
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [change, { isLoading, error }] = useChangeDeliveryStatusMutation();
  const needsNote = to === "failed" || to === "returned";

  const submit = async () => {
    if (needsNote && note.trim().length < 2) return setLocalError("Write why.");
    const value = Number(amount);
    if (collect && !(value > 0 && cents(value) <= cents(sale.money.left))) return setLocalError(`Collected must be more than 0 and at most ${formatPrice(sale.money.left)}.`);
    const result = await change({
      id: sale.id,
      status: to,
      note: note.trim() || null,
      collected: to === "delivered" ? { amount: collect ? value : 0, methodId: method || undefined } : undefined,
    });
    if (result.data) onDone(`Delivery: ${deliveryStatusLabels[to].toLowerCase()}.`);
  };

  const titles: Record<typeof to, string> = {
    pending: "Back to pending",
    on_the_way: "On the way",
    delivered: "Delivered",
    failed: "Delivery failed",
    returned: "Delivery came back",
  };

  return (
    <FormDialog title={titles[to]} submitLabel="Save" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      {to === "returned" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          The units go back into stock and the sale becomes Returned. We pay the whole delivery fee ({formatPrice(delivery.totalFee)}).
          {sale.money.paid > 0 && ` The customer paid ${formatPrice(sale.money.paid)}: refund it on the sale page.`}
        </p>
      )}
      {to === "failed" && <p className="text-sm text-gray-600">The deliverer can take it out again later. The trip&apos;s fee counts as earned.</p>}
      {collects && (
        <div className="space-y-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" checked={collect} onChange={(event) => setCollect(event.target.checked)} className="size-5 rounded border-gray-300 text-brand-600" />
            {delivery.deliverer.name ?? "The deliverer"} collected money from the customer
          </label>
          {collect && (
            <div className="grid gap-3 sm:grid-cols-2">
              <AmountInput label="Collected, ETB" value={amount} onChange={setAmount} max={sale.money.left} />
              <MethodSelect value={method} onChange={setMethod} label="Customer paid by" />
            </div>
          )}
        </div>
      )}
      <Field label={needsNote ? "Why" : "Note (optional)"} isRequired={needsNote}>
        <input
          value={note}
          maxLength={300}
          onChange={(event) => (setNote(event.target.value), setLocalError(""))}
          placeholder={to === "failed" ? "Customer didn't answer" : to === "returned" ? "Customer refused it" : ""}
          className={inputClasses}
        />
      </Field>
    </FormDialog>
  );
}

/** Address, fee split and cash on delivery. Once delivered or back, only the fee */
export function EditDeliveryDialog({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: Done }) {
  const delivery = sale.delivery!;
  const isDone = ["delivered", "returned", "cancelled"].includes(delivery.status);
  const [address, setAddress] = useState(delivery.address);
  const [fee, setFee] = useState(String(delivery.totalFee));
  const [share, setShare] = useState(String(delivery.companyShare));
  const [cashOnDelivery, setCashOnDelivery] = useState(delivery.cashOnDelivery);
  const [localError, setLocalError] = useState("");
  const [update, { isLoading, error }] = useUpdateDeliveryMutation();

  const submit = async () => {
    const totalFee = Number(fee || 0);
    const companyShare = Number(share || 0);
    if (companyShare > totalFee) return setLocalError("Our share can't be more than the fee.");
    if (!isDone && address.trim().length < 3) return setLocalError("Enter the address.");
    const result = await update({ id: sale.id, totalFee, companyShare, ...(isDone ? {} : { address: address.trim(), cashOnDelivery }) });
    if (result.data) onDone("Delivery saved.");
  };

  return (
    <FormDialog title="Change the delivery" submitLabel="Save" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      {!isDone && (
        <Field label="Address" isRequired>
          <input value={address} maxLength={300} onChange={(event) => setAddress(event.target.value)} className={inputClasses} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Delivery fee, ETB" isRequired>
          <input inputMode="decimal" value={fee} onChange={(event) => (setFee(decimalText(event.target.value)), setLocalError(""))} className={inputClasses} />
        </Field>
        <Field label="We pay, ETB">
          <input inputMode="decimal" value={share} onChange={(event) => (setShare(decimalText(event.target.value)), setLocalError(""))} className={inputClasses} />
        </Field>
      </div>
      <p className="text-sm text-gray-600">The customer pays {formatPrice(Math.max(birr(cents(Number(fee || 0)) - cents(Number(share || 0))), 0))} of it.</p>
      {!isDone && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-gray-800">
          <input type="checkbox" checked={cashOnDelivery} onChange={(event) => setCashOnDelivery(event.target.checked)} className="size-5 rounded border-gray-300 text-brand-600" />
          Cash on delivery
        </label>
      )}
    </FormDialog>
  );
}

function RefundFields({ refund, setRefund, max }: { refund: { on: boolean; amount: string; method: string }; setRefund: (value: { on: boolean; amount: string; method: string }) => void; max: number }) {
  if (max <= 0) return null;
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
      <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-gray-800">
        <input type="checkbox" checked={refund.on} onChange={(event) => setRefund({ ...refund, on: event.target.checked })} className="size-5 rounded border-gray-300 text-brand-600" />
        Give money back now
      </label>
      {refund.on && (
        <div className="grid gap-3 sm:grid-cols-2">
          <AmountInput label="Refund, ETB" value={refund.amount} onChange={(amount) => setRefund({ ...refund, amount })} max={max} />
          <RefundMethod value={refund.method} onChange={(method) => setRefund({ ...refund, method })} />
        </div>
      )}
    </div>
  );
}

/** Cash unless another method was chosen */
function RefundMethod({ value, onChange }: { value: string; onChange: (methodId: string) => void }) {
  const { cash } = useMethods();
  return <MethodSelect value={value || cash?.id || ""} onChange={onChange} label="Given back by" />;
}

/** Money goes back the way it came: the method of the customer's last payment */
const paidWith = (sale: Sale) => [...sale.payments].reverse().find((payment) => !payment.isRefund)?.method.id ?? "";

const toRefundInput = (refund: { on: boolean; amount: string; method: string }, cashId: string) =>
  refund.on && Number(refund.amount) > 0 ? { amount: Number(refund.amount), methodId: refund.method || cashId, note: null } : null;

/** The whole sale, before the customer got it */
export function CancelSaleDialog({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: Done }) {
  const { cash } = useMethods();
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState({ on: sale.money.paid > 0, amount: String(sale.money.paid), method: paidWith(sale) });
  const [localError, setLocalError] = useState("");
  const [cancel, { isLoading, error }] = useCancelSaleMutation();

  const submit = async () => {
    if (reason.trim().length < 3) return setLocalError("Write why the sale is cancelled.");
    const result = await cancel({ id: sale.id, reason: reason.trim(), refund: toRefundInput(refund, cash?.id ?? "") });
    if (result.data) onDone("The sale was cancelled and the units are back in stock.");
  };

  return (
    <FormDialog title={`Cancel ${sale.code}?`} submitLabel="Yes, cancel sale" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="text-sm text-gray-600">
        Every unit goes back into stock and the sale counts for nothing.
        {sale.delivery?.status === "failed" && ` The failed trip's fee (${formatPrice(sale.delivery.totalFee)}) is still ours to pay.`}
        {sale.delivery?.status === "pending" && " The delivery is cancelled too."}
      </p>
      <Field label="Why" isRequired>
        <input value={reason} maxLength={300} onChange={(event) => (setReason(event.target.value), setLocalError(""))} placeholder="Customer changed their mind" className={inputClasses} />
      </Field>
      <RefundFields refund={refund} setRefund={setRefund} max={sale.money.paid} />
    </FormDialog>
  );
}

/** Units the customer brought back */
/** all: every unit still out is chosen (revert a sale) */
export function ReturnDialog({ sale, onClose, onDone, all = false }: { sale: Sale; onClose: () => void; onDone: Done; all?: boolean }) {
  const { cash } = useMethods();
  const open = sale.items.filter((item) => item.quantity > item.returned.quantity);
  const [counts, setCounts] = useState<Record<string, { quantity: number; damaged: boolean }>>(() => Object.fromEntries(open.map((item) => [item.id, { quantity: all ? item.quantity - item.returned.quantity : 0, damaged: false }])));
  const [reason, setReason] = useState<ReturnReason>("changed_mind");
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState({ on: true, amount: "", method: paidWith(sale) });
  const [localError, setLocalError] = useState("");
  const [returnItems, { isLoading, error }] = useReturnSaleItemsMutation();

  // What these units were sold for, with VAT: the most to give back
  const value = open.reduce((sum, item) => sum + Math.round((cents(item.lineTotal) * (counts[item.id]?.quantity ?? 0)) / item.quantity), 0);
  const withVat = value + Math.round((value * cents(sale.money.vatRate)) / 10000);
  const suggested = birr(Math.min(withVat, cents(sale.money.paid)));

  const submit = async () => {
    const items = Object.entries(counts)
      .filter(([, line]) => line.quantity > 0)
      .map(([saleItemId, line]) => ({ saleItemId, quantity: line.quantity, damaged: line.damaged }));
    if (!items.length) return setLocalError("Choose how many units came back.");
    if (reason === "other" && note.trim().length < 2) return setLocalError("Write why.");
    const refundInput = refund.on ? toRefundInput({ ...refund, amount: refund.amount || String(suggested) }, cash?.id ?? "") : null;
    const result = await returnItems({ id: sale.id, items, reason, note: note.trim() || null, refund: refundInput });
    if (result.data) onDone("Return recorded.");
  };

  return (
    <FormDialog title={all ? `Revert ${sale.code}: everything back` : "Units brought back"} submitLabel={all ? "Revert sale" : "Record return"} isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <ul className="space-y-2">
        {open.map((item) => {
          const left = item.quantity - item.returned.quantity;
          const line = counts[item.id];
          return (
            <li key={item.id} className="space-y-2 rounded-lg border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-900">{[item.productName, item.variationName].filter(Boolean).join(" · ")}</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="text-gray-600">Came back</span>
                  <select
                    value={line.quantity}
                    onChange={(event) => setCounts({ ...counts, [item.id]: { ...line, quantity: Number(event.target.value) } })}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm"
                  >
                    {Array.from({ length: left + 1 }, (_, count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">of {left}</span>
                </label>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-gray-700">
                  <input type="checkbox" checked={line.damaged} onChange={(event) => setCounts({ ...counts, [item.id]: { ...line, damaged: event.target.checked } })} className="size-5 rounded border-gray-300 text-brand-600" />
                  Damaged (not back in stock)
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Why" isRequired>
          <select value={reason} onChange={(event) => setReason(event.target.value as ReturnReason)} className={inputClasses}>
            {Object.entries(returnReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={reason === "other" ? "Note" : "Note (optional)"} isRequired={reason === "other"}>
          <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} className={inputClasses} />
        </Field>
      </div>
      {value > 0 && <p className="text-sm text-gray-600">These units were sold for {formatPrice(birr(withVat))} with VAT. The delivery charge stays.</p>}
      <RefundFields refund={{ ...refund, amount: refund.amount || (suggested ? String(suggested) : "") }} setRefund={setRefund} max={sale.money.paid} />
    </FormDialog>
  );
}

/** Money given back later */
export function RefundDialog({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: Done }) {
  const [amount, setAmount] = useState(String(sale.money.toRefund));
  const { cash } = useMethods();
  const [chosenMethod, setMethod] = useState(() => paidWith(sale));
  const method = chosenMethod || cash?.id || "";
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [refund, { isLoading, error }] = useRefundSaleMutation();

  const submit = async () => {
    const value = Number(amount);
    if (!(value > 0) || cents(value) > cents(sale.money.toRefund)) return setLocalError(`Enter up to ${formatPrice(sale.money.toRefund)}.`);
    const result = await refund({ id: sale.id, amount: value, methodId: method, note: note.trim() || null });
    if (result.data) onDone(`${formatPrice(value)} given back.`);
  };

  return (
    <FormDialog title="Give money back" submitLabel="Record refund" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-900">To refund: {formatPrice(sale.money.toRefund)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <AmountInput label="Amount, ETB" value={amount} onChange={setAmount} max={sale.money.toRefund} />
        <MethodSelect value={method} onChange={setMethod} label="Given back by" />
      </div>
      <Field label="Note (optional)">
        <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} className={inputClasses} />
      </Field>
    </FormDialog>
  );
}

/**
 * Revert a sale from the list: before the customer got it, cancel it;
 * after (pickup or delivered), record that everything came back. A sale on the way can't be reverted yet.
 */
export function RevertSaleDialog({ saleId, onClose, onDone }: { saleId: string; onClose: () => void; onDone: Done }) {
  const { data, isLoading } = useGetSaleQuery(saleId);
  if (isLoading || !data) {
    return (
      <FormDialog title="Revert sale" submitLabel="Revert sale" isLoading={isLoading} error={isLoading ? "" : "Sale not found."} onSubmit={() => undefined} onClose={onClose}>
        <Loader2 className="mx-auto size-5 animate-spin text-brand-600" aria-label="Loading" />
      </FormDialog>
    );
  }
  const sale = data.data;
  const status = sale.delivery?.status;
  if (!sale.delivery || status === "pending" || status === "failed") {
    // A pickup that was never handed over is also simply cancelled
    if (!sale.delivery && sale.status === "partly_returned") return <ReturnDialog sale={sale} all onClose={onClose} onDone={onDone} />;
    return <CancelSaleDialog sale={sale} onClose={onClose} onDone={onDone} />;
  }
  if (status === "delivered") return <ReturnDialog sale={sale} all onClose={onClose} onDone={onDone} />;
  return (
    <FormDialog title={`Revert ${sale.code}`} submitLabel="OK" isLoading={false} error="" onSubmit={onClose} onClose={onClose}>
      <p className="text-sm text-gray-700">The delivery is on the way. When it comes back, open the sale and mark it “Came back”: the units go back into stock by themselves.</p>
    </FormDialog>
  );
}
