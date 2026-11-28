"use client";

import clsx from "clsx";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field, inputClasses } from "@/components/inventory/field";
import { FormDialog } from "@/components/inventory/form-dialog";
import { DeliveryStatusBadge, formatTime, PaymentStatusBadge } from "@/components/sales/sale-badges";
import { todayText } from "@/components/suppliers/pay-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import { useListDelivererMoneyQuery, usePayDelivererFeeMutation, useRecordHandinMutation, useRemoveDelivererMoneyMutation } from "@/store/api/deliverers.api";
import { useListDeliveriesQuery } from "@/store/api/sales.api";
import { moneyKindLabels, type DelivererMoneyEntry, type DelivererWithMoney } from "@/types/deliverer";
import { salePaymentMethodLabels, type SalePaymentMethod } from "@/types/sale";

const cents = (value: number) => Math.round(value * 100);

function MethodSelect({ value, onChange, label }: { value: SalePaymentMethod; onChange: (method: SalePaymentMethod) => void; label: string }) {
  return (
    <Field label={label} isRequired>
      <select value={value} onChange={(event) => onChange(event.target.value as SalePaymentMethod)} className={inputClasses}>
        {Object.entries(salePaymentMethodLabels).map(([method, text]) => (
          <option key={method} value={method}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Pay a deliverer their fees */
export function PayFeeDialog({ deliverer, onClose, onDone }: { deliverer: DelivererWithMoney; onClose: () => void; onDone: (message: string) => void }) {
  const owed = deliverer.money.feesOwed;
  const [amount, setAmount] = useState(String(owed));
  const [method, setMethod] = useState<SalePaymentMethod>(deliverer.accounts[0]?.method === "telebirr" ? "telebirr" : "cash");
  const [paidOn, setPaidOn] = useState(todayText);
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [pay, { isLoading, error }] = usePayDelivererFeeMutation();

  const submit = async () => {
    const value = Number(amount);
    if (!(value > 0) || cents(value) > cents(owed)) return setLocalError(`Enter up to ${formatPrice(owed)}.`);
    const result = await pay({ id: deliverer.id, amount: value, method, paidOn: paidOn || null, note: note.trim() || null });
    if (result.data) onDone(`${formatPrice(value)} fee paid.`);
  };

  return (
    <FormDialog title={`Pay ${deliverer.name}`} submitLabel="Record payment" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">Fees we owe: {formatPrice(owed)}</p>
      {deliverer.accounts[0] && (
        <p className="text-sm text-gray-600">
          Main account: {deliverer.accounts[0].accountNumber} ({deliverer.accounts[0].holderName})
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount, ETB" isRequired>
          <input inputMode="decimal" value={amount} onChange={(event) => (setAmount(decimalText(event.target.value)), setLocalError(""))} className={inputClasses} />
        </Field>
        <MethodSelect value={method} onChange={setMethod} label="Paid by" />
        <Field label="Paid on" isRequired>
          <input type="date" value={paidOn} max={todayText()} onChange={(event) => setPaidOn(event.target.value)} className={inputClasses} />
        </Field>
        <Field label="Note (optional)">
          <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} className={inputClasses} />
        </Field>
      </div>
    </FormDialog>
  );
}

/** Customer cash the deliverer gives us; they can keep their fee from it */
export function HandinDialog({ deliverer, onClose, onDone }: { deliverer: DelivererWithMoney; onClose: () => void; onDone: (message: string) => void }) {
  const { cashHeld, feesOwed } = deliverer.money;
  const canKeep = Math.max(Math.min(feesOwed, cashHeld), 0);
  const [keepFee, setKeepFee] = useState(String(canKeep));
  const [amount, setAmount] = useState(String(Math.max(cashHeld - canKeep, 0)));
  const [method, setMethod] = useState<SalePaymentMethod>("cash");
  const [receivedOn, setReceivedOn] = useState(todayText);
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");
  const [record, { isLoading, error }] = useRecordHandinMutation();

  const submit = async () => {
    const handed = Number(amount || 0);
    const kept = Number(keepFee || 0);
    if (handed + kept <= 0) return setLocalError("Enter what they handed in.");
    if (cents(kept) > cents(Math.max(feesOwed, 0))) return setLocalError(`They can keep at most ${formatPrice(Math.max(feesOwed, 0))} (fees we owe).`);
    if (cents(handed) + cents(kept) > cents(cashHeld)) return setLocalError(`They hold only ${formatPrice(cashHeld)}.`);
    const result = await record({ id: deliverer.id, amount: handed, keepFee: kept, method, receivedOn: receivedOn || null, note: note.trim() || null });
    if (result.data) onDone(`${formatPrice(handed)} handed in${kept ? `, ${formatPrice(kept)} kept as their fee` : ""}.`);
  };

  return (
    <FormDialog title={`Cash from ${deliverer.name}`} submitLabel="Record" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        They hold {formatPrice(cashHeld)} of customer money. We owe them {formatPrice(Math.max(feesOwed, 0))} in fees.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Handed to us, ETB" isRequired>
          <input inputMode="decimal" value={amount} onChange={(event) => (setAmount(decimalText(event.target.value)), setLocalError(""))} className={inputClasses} />
        </Field>
        <Field label="Kept as their fee, ETB">
          <input inputMode="decimal" value={keepFee} onChange={(event) => (setKeepFee(decimalText(event.target.value)), setLocalError(""))} className={inputClasses} />
        </Field>
        <MethodSelect value={method} onChange={setMethod} label="Given to us by" />
        <Field label="Received on" isRequired>
          <input type="date" value={receivedOn} max={todayText()} onChange={(event) => setReceivedOn(event.target.value)} className={inputClasses} />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} className={inputClasses} />
      </Field>
    </FormDialog>
  );
}

/** Their trips, newest first */
export function DelivererDeliveries({ delivererId }: { delivererId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListDeliveriesQuery({ page, limit: 20, status: "all", delivererId });
  const result = data?.data;
  if (isLoading) return <Loader2 className="mx-auto my-10 size-5 animate-spin text-brand-600" aria-label="Loading" />;
  if (!result) return <p className="px-4 py-8 text-center text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (!result.items.length) return <p className="px-4 py-8 text-center text-sm text-gray-500">No deliveries yet. Choose them when you make a sale with delivery.</p>;
  return (
    <>
      <ul className="divide-y divide-gray-100">
        {result.items.map((sale) => (
          <li key={sale.id}>
            <Link href={`/sales/${sale.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-gray-50">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{sale.code}</span>
                  {sale.delivery && <DeliveryStatusBadge status={sale.delivery.status} />}
                  <PaymentStatusBadge status={sale.money.paymentStatus} />
                </span>
                <span className="block text-gray-500">{[formatTime(sale.soldAt), sale.customer.name, sale.delivery?.address].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="text-right text-xs text-gray-600">Fee {formatPrice(sale.delivery?.totalFee ?? 0)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
    </>
  );
}

/** Fees paid, cash handed in and collected, newest first */
export function DelivererMoneyHistory({ delivererId, onRemoved }: { delivererId: string; onRemoved: (message: string) => void }) {
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState<DelivererMoneyEntry | null>(null);
  const { data, isLoading, error } = useListDelivererMoneyQuery({ id: delivererId, page, limit: 20 });
  const [remove, removeState] = useRemoveDelivererMoneyMutation();
  const result = data?.data;
  if (isLoading) return <Loader2 className="mx-auto my-10 size-5 animate-spin text-brand-600" aria-label="Loading" />;
  if (!result) return <p className="px-4 py-8 text-center text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (!result.items.length) return <p className="px-4 py-8 text-center text-sm text-gray-500">No money moved yet.</p>;
  return (
    <>
      <ul className="divide-y divide-gray-100">
        {result.items.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className={clsx("font-medium", entry.kind === "collected" ? "text-amber-800" : "text-gray-900")}>
                {moneyKindLabels[entry.kind]} {formatPrice(entry.amount)} <span className="font-normal text-gray-500">· {salePaymentMethodLabels[entry.method]}</span>
              </p>
              <p className="break-words text-xs text-gray-500">
                {formatDay(entry.date)}
                {entry.sale && (
                  <>
                    {" · "}
                    <Link href={`/sales/${entry.sale.id}`} className="text-brand-700 hover:underline">
                      {entry.sale.code}
                    </Link>
                  </>
                )}
                {[entry.by, entry.note].filter(Boolean).map((text) => ` · ${text}`)}
              </p>
            </div>
            {entry.kind !== "collected" && (
              <button type="button" onClick={() => setRemoving(entry)} aria-label="Remove" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
      <ConfirmDialog
        open={Boolean(removing)}
        tone="danger"
        title="Remove this entry?"
        description={removing ? `${moneyKindLabels[removing.kind]} ${formatPrice(removing.amount)} on ${formatDay(removing.date)}. Only for one entered by mistake. It stays in the activity log.` : ""}
        confirmLabel="Remove"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={() => {
          removeState.reset();
          setRemoving(null);
        }}
        onConfirm={async () => {
          if (!removing) return;
          const result = await remove({ kind: removing.kind === "handed_in" ? "handin" : "fee", id: removing.id });
          if (result.data) {
            setRemoving(null);
            onRemoved("Removed.");
          }
        }}
      />
    </>
  );
}
