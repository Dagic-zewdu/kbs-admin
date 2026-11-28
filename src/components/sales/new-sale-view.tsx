"use client";

import clsx from "clsx";
import { Bike, Loader2, Minus, Plus, Printer, ShoppingBag, Store, Tag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScanInput } from "@/components/barcode/scan-input";
import { accountLine, MethodSelect, useMethods } from "@/components/company-lists/method-select";
import { useListChannelsQuery } from "@/store/api/settings.api";
import { MultiScanDialog, type ScannedLine } from "./multi-scan-dialog";
import { DelivererSelect } from "@/components/deliverers/deliverer-select";
import { Field, inputClasses } from "@/components/inventory/field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FadeImage } from "@/components/ui/fade-image";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import { useGetDelivererQuery } from "@/store/api/deliverers.api";
import { useCreateSaleMutation, useLazyLookupForSaleQuery } from "@/store/api/sales.api";
import { useGetSettingsQuery } from "@/store/api/settings.api";
import { useAppSelector } from "@/store/hooks";
import type { Deliverer } from "@/types/deliverer";
import type { SalesChannel } from "@/types/company-lists";
import { saleProblemLabels, type SaleInput, type SaleLookup } from "@/types/sale";
import { amountOf, birr, cents, emptySaleDraft, lineMoney, saleDraftStore, type CartLine, type SaleDraft } from "./sale-draft";

const chip = (isOn: boolean) =>
  clsx(
    "min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap",
    isOn ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
  );

/** Make a sale: scan products into the cart, then customer, delivery and payment */
export function NewSaleView() {
  const userId = useAppSelector((state) => state.auth.user?.id);
  if (!userId) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  return <SaleForm key={userId} userId={userId} />;
}

function SaleForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: settings } = useGetSettingsQuery();
  const autoPrint = Boolean(settings?.data.receiptAutoPrint);
  const { methods, cash } = useMethods();
  const { data: channelData } = useListChannelsQuery();
  const channels = channelData?.data ?? [];
  const walkInId = channels.find((channel) => channel.kind === "walk_in")?.id ?? channels[0]?.id ?? "";
  // The cart is kept on this device, so a refresh or a phone call doesn't lose it
  const [draft, setDraft] = useState<SaleDraft>(() => saleDraftStore.read(userId) ?? emptySaleDraft());
  const [localError, setLocalError] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [create, createState] = useCreateSaleMutation();

  useEffect(() => {
    saleDraftStore.write(userId, draft);
  }, [draft, userId]);

  const change = (update: Partial<SaleDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
    setLocalError("");
    createState.reset();
  };
  const setLine = (variationId: string, update: Partial<CartLine>) =>
    change({
      lines: draft.lines.map((line) => (line.variationId === variationId ? { ...line, ...update } : line)),
    });

  /** Adds units; the same product again adds to its line. Returns what couldn't be added in full. */
  const addLines = (items: ScannedLine[]) => {
    const warnings: string[] = [];
    setDraft((current) => {
      let next = current.lines;
      for (const item of items) {
        const variation = item.lookup.variations.find((option) => option.id === item.variationId)!;
        const existing = next.find((line) => line.variationId === item.variationId);
        const wanted = (existing?.quantity ?? 0) + item.quantity;
        const capped = Math.min(wanted, variation.onHand);
        if (capped < wanted) warnings.push(`Only ${variation.onHand} of ${[item.lookup.product.name, variation.name].filter(Boolean).join(" · ")} in stock.`);
        next = existing
          ? next.map((line) => (line === existing ? { ...line, quantity: capped, onHand: variation.onHand, price: variation.price ?? line.price } : line))
          : [
              ...next,
              {
                variationId: item.variationId,
                productName: item.lookup.product.name,
                variationName: variation.name,
                sku: variation.sku,
                price: variation.price ?? 0,
                onHand: variation.onHand,
                quantity: capped,
                discount: null,
              },
            ];
      }
      return { ...current, lines: next };
    });
    setLocalError("");
    createState.reset();
    return warnings.join(" ");
  };
  const addToCart = (lookup: SaleLookup, variationId: string, quantity: number) => addLines([{ lookup, variationId, quantity }]);

  // ----- money -----
  const lines = draft.lines.map((line) => ({ line, money: lineMoney(line) }));
  const gross = lines.reduce((sum, item) => sum + item.money.gross, 0);
  const discount = lines.reduce((sum, item) => sum + item.money.discount, 0);
  const linesTotal = gross - discount;
  const vatRate = settings?.data.vatEnabled ? settings.data.vatRate : 0;
  const vat = Math.round((linesTotal * cents(vatRate)) / 10000);
  const isDelivery = draft.mode === "delivery";
  const fee = isDelivery ? cents(amountOf(draft.delivery.totalFee)) : 0;
  const share = isDelivery ? cents(amountOf(draft.delivery.companyShare)) : 0;
  const customerShare = Math.max(fee - share, 0);
  const total = linesTotal + vat + customerShare;
  const paidNow = draft.pay === "full" ? total : draft.pay === "part" ? cents(amountOf(draft.partAmount)) : 0;

  const problem = (): string => {
    if (!draft.lines.length) return "Scan at least one product.";
    for (const { line, money } of lines) {
      const name = [line.productName, line.variationName].filter(Boolean).join(" · ");
      if (line.quantity < 1) return `Enter how many of ${name}.`;
      if (line.quantity > line.onHand) return `Only ${line.onHand} of ${name} in stock.`;
      if (line.discount) {
        const value = amountOf(line.discount.value);
        if (!(value > 0)) return `Enter the discount on ${name}, or remove it.`;
        if (line.discount.type === "percent" && value > 100) return `A percent discount can be at most 100 (${name}).`;
        if (money.discount > money.gross) return `The discount on ${name} is more than its price.`;
        if (line.discount.reason.trim().length < 2) return `Write why there is a discount on ${name}.`;
      }
    }
    if (isDelivery) {
      if (!draft.customerName.trim()) return "Enter the customer's name for delivery.";
      if (!draft.customerPhone.trim()) return "Enter the customer's phone for delivery.";
      if (!draft.delivery.delivererId) return "Choose the deliverer.";
      if (draft.delivery.address.trim().length < 3) return "Enter the delivery address.";
      if (draft.delivery.totalFee.trim() === "") return "Enter the delivery fee (0 if free).";
      if (share > fee) return "Our share can't be more than the delivery fee.";
    }
    if (draft.customerPhone.trim() && !/^\+?\d{7,15}$/.test(draft.customerPhone.replace(/[\s\-().]/g, ""))) return "Enter the phone like 0911 234 567.";
    if (draft.pay === "part" && !(paidNow > 0 && paidNow < total)) return "Enter what was paid now: more than 0 and less than the total.";
    return "";
  };

  const complete = async () => {
    const found = problem();
    if (found) return setLocalError(found);
    const input: SaleInput = {
      items: draft.lines.map((line) => ({
        variationId: line.variationId,
        quantity: line.quantity,
        discount:
          line.discount && amountOf(line.discount.value) > 0
            ? {
                type: line.discount.type,
                value: amountOf(line.discount.value),
                reason: line.discount.reason.trim(),
              }
            : null,
      })),
      channelId: draft.channelId || walkInId,
      customerName: draft.customerName.trim() || null,
      customerPhone: draft.customerPhone.trim() || null,
      note: draft.note.trim() || null,
      payments: paidNow > 0 ? [{ amount: birr(paidNow), methodId: draft.methodId || cash?.id || "", note: null }] : [],
      delivery: isDelivery
        ? {
            delivererId: draft.delivery.delivererId!,
            address: draft.delivery.address.trim(),
            totalFee: birr(fee),
            companyShare: birr(share),
            cashOnDelivery: draft.delivery.cashOnDelivery,
          }
        : null,
    };
    const result = await create(input);
    if (result.data) {
      saleDraftStore.clear(userId);
      // The company prints receipts: open it and print by itself
      router.push(autoPrint ? `/sales/${result.data.data.id}/receipt?print=1` : `/sales/${result.data.data.id}?new=1`);
    }
  };

  const clearAll = () => {
    saleDraftStore.clear(userId);
    setDraft(emptySaleDraft());
    setIsClearing(false);
    setLocalError("");
    createState.reset();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="New sale"
        description="Scan products into the sale. Stock goes down when you complete it."
        backHref="/sales"
        actions={
          draft.lines.length > 0 || draft.customerName ? (
            <Button type="button" variant="ghost" onClick={() => setIsClearing(true)}>
              <X className="size-4" aria-hidden /> Clear
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="space-y-5">
          <Scanner onAdd={addToCart} onAddMany={addLines} />
          <Cart
            lines={draft.lines}
            setLine={setLine}
            onRemove={(variationId) =>
              change({
                lines: draft.lines.filter((line) => line.variationId !== variationId),
              })
            }
          />
        </div>

        <div className="space-y-5 lg:sticky lg:top-4">
          <Customer draft={draft} change={change} channels={channels} walkInId={walkInId} />
          <DeliveryBox draft={draft} change={change} fee={fee} share={share} />
          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["full", "Paid in full"],
                  ["part", "Partly paid"],
                  ["none", isDelivery && draft.delivery.cashOnDelivery ? "Deliverer collects" : "Not paid yet"],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={draft.pay === value} onClick={() => change({ pay: value })} className={chip(draft.pay === value)}>
                  {label}
                </button>
              ))}
            </div>
            {draft.pay !== "none" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <MethodSelect value={draft.methodId || cash?.id || ""} onChange={(methodId) => change({ methodId })} />
                  {accountLine(methods.find((method) => method.id === (draft.methodId || cash?.id))) && (
                    <p className="mt-1 text-xs text-gray-500">Pay to: {accountLine(methods.find((method) => method.id === (draft.methodId || cash?.id)))}</p>
                  )}
                </div>
                {draft.pay === "part" && (
                  <Field label="Paid now, ETB" isRequired>
                    <input
                      inputMode="decimal"
                      value={draft.partAmount}
                      onChange={(event) => change({ partAmount: decimalText(event.target.value) })}
                      placeholder="1000"
                      className={inputClasses}
                    />
                  </Field>
                )}
              </div>
            )}

            <dl className="space-y-1.5 border-t border-gray-100 pt-3 text-sm">
              <Row label="Products" value={birr(gross)} />
              {discount > 0 && <Row label="Discounts" value={-birr(discount)} />}
              {vat > 0 && <Row label={`VAT ${vatRate}%`} value={birr(vat)} />}
              {isDelivery && <Row label="Delivery (customer's part)" value={birr(customerShare)} />}
              <div className="flex items-baseline justify-between border-t border-gray-100 pt-2">
                <dt className="font-semibold text-gray-900">Customer pays</dt>
                <dd className="text-xl font-semibold text-gray-900">{formatPrice(birr(total))}</dd>
              </div>
              {draft.pay !== "full" && total > 0 && (
                <Row label={draft.pay === "none" ? "Left to pay" : `Paid now ${formatPrice(birr(paidNow))}, left`} value={birr(Math.max(total - paidNow, 0))} tone="amber" />
              )}
            </dl>

            {(localError || createState.error) && <Alert>{localError || getErrorMessage(createState.error)}</Alert>}
            <Button type="button" className="w-full" onClick={complete} isLoading={createState.isLoading} disabled={!draft.lines.length}>
              {autoPrint ? <Printer className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />} {autoPrint ? "Complete sale and print" : "Complete sale"}
            </Button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={isClearing}
        tone="danger"
        title="Clear this sale?"
        description="The products, customer and delivery you entered are removed. Nothing was sold yet."
        confirmLabel="Clear"
        onCancel={() => setIsClearing(false)}
        onConfirm={clearAll}
      />
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone?: "amber" }) {
  return (
    <div className={clsx("flex justify-between gap-3", tone === "amber" ? "text-amber-800" : "text-gray-600")}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatPrice(value)}</dd>
    </div>
  );
}

/** Scan or type a code; one variation is added at once, several are picked from */
function Scanner({
  onAdd,
  onAddMany,
}: {
  onAdd: (lookup: SaleLookup, variationId: string, quantity: number) => string;
  onAddMany: (lines: ScannedLine[]) => string;
}) {
  const [text, setText] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [lookup, setLookup] = useState<SaleLookup | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [find, { isFetching }] = useLazyLookupForSaleQuery();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (type: "success" | "error", value: string) => {
    setMessage({ type, text: value });
    clearTimeout(timer.current);
    if (type === "success") timer.current = setTimeout(() => setMessage(null), 2500);
  };

  const add = (result: SaleLookup, variationId: string) => {
    const variation = result.variations.find((item) => item.id === variationId)!;
    const warning = onAdd(result, variationId, 1);
    say(warning ? "error" : "success", warning || `Added ${[result.product.name, variation.name].filter(Boolean).join(" · ")}.`);
    setLookup(null);
    setText("");
  };

  const search = async (value: string) => {
    const code = value.trim();
    if (!code) return;
    setMessage(null);
    const response = await find(code);
    if (!response.data) {
      setLookup(null);
      const notFound = response.error && "data" in response.error && (response.error.data as { code?: string })?.code === "CODE_NOT_FOUND";
      return say("error", notFound ? "No product of yours has this code." : getErrorMessage(response.error));
    }
    const result = response.data.data;
    const scanned = result.variations.find((item) => item.id === result.scannedVariationId);
    // One sellable variation: straight into the cart, ready for the next scan
    if (result.variations.length === 1 && scanned?.canBeSold) return add(result, scanned.id);
    setLookup(result);
    setChosen(scanned?.canBeSold ? scanned.id : (result.variations.find((item) => item.canBeSold)?.id ?? null));
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <ScanInput label="Scan a product" value={text} onChange={setText} onDone={search} onScanClick={() => setIsCameraOpen(true)} />
      <p className="text-xs text-gray-500">Barcode or SKU. A USB scanner adds the product by itself. Scan opens the camera for many products at once.</p>
      {isCameraOpen && (
        <MultiScanDialog
          onClose={() => setIsCameraOpen(false)}
          onAdd={(lines) => {
            const warning = onAddMany(lines);
            const units = lines.reduce((sum, line) => sum + line.quantity, 0);
            say(warning ? "error" : "success", warning || `Added ${units} ${units === 1 ? "item" : "items"} from the camera.`);
          }}
        />
      )}
      {isFetching && <Loader2 className="size-5 animate-spin text-brand-600" aria-label="Looking" />}
      {message && (
        <p role="status" className={clsx("rounded-lg px-3 py-2 text-sm", message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
          {message.text}
        </p>
      )}
      {lookup && (
        <div className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/30 p-3">
          <div className="flex items-start gap-3">
            {lookup.product.photoUrl && <FadeImage src={lookup.product.photoUrl} className="size-14 shrink-0 rounded-lg border border-gray-200" />}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-gray-900">{lookup.product.name}</p>
              {lookup.product.brand && <p className="text-gray-500">{lookup.product.brand}</p>}
            </div>
            <button type="button" onClick={() => setLookup(null)} aria-label="Close" className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <p className="text-sm font-medium text-gray-700">Choose the size or shade</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {lookup.variations.map((variation) => (
              <button
                key={variation.id}
                type="button"
                disabled={!variation.canBeSold}
                aria-pressed={chosen === variation.id}
                onClick={() => setChosen(variation.id)}
                className={clsx(
                  "rounded-lg border p-3 text-left text-sm",
                  !variation.canBeSold && "cursor-not-allowed opacity-50",
                  chosen === variation.id ? "border-brand-500 bg-white ring-1 ring-brand-500" : "border-gray-200 bg-white hover:border-brand-300",
                )}
              >
                <span className="block font-medium text-gray-900">
                  {variation.name || "Standard"}
                  {variation.id === lookup.scannedVariationId && <span className="ml-1.5 text-xs font-normal text-brand-700">scanned</span>}
                </span>
                <span className="block text-gray-600">{formatPrice(variation.customerPrice)}</span>
                <span className="block text-xs text-gray-500">
                  {variation.problem
                    ? saleProblemLabels[variation.problem]
                    : `${variation.onHand} in stock${variation.nextExpiry ? ` · expires ${formatDay(variation.nextExpiry)}` : ""}`}
                </span>
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => chosen && add(lookup, chosen)} disabled={!chosen}>
            <Plus className="size-4" aria-hidden /> Add to sale
          </Button>
        </div>
      )}
    </section>
  );
}

function Cart({ lines, setLine, onRemove }: { lines: CartLine[]; setLine: (variationId: string, update: Partial<CartLine>) => void; onRemove: (variationId: string) => void }) {
  if (!lines.length) {
    return (
      <section className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-12 text-center">
        <ShoppingBag className="size-8 text-brand-300" aria-hidden />
        <p className="mt-3 text-sm font-medium text-gray-800">No products yet</p>
        <p className="mt-1 text-sm text-gray-500">Scan a barcode or type a SKU above.</p>
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
        In this sale · {lines.reduce((sum, line) => sum + line.quantity, 0)} {lines.reduce((sum, line) => sum + line.quantity, 0) === 1 ? "unit" : "units"}
      </h2>
      <ul className="divide-y divide-gray-100">
        {lines.map((line) => {
          const money = lineMoney(line);
          return (
            <li key={line.variationId} className="space-y-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-gray-900">{[line.productName, line.variationName].filter(Boolean).join(" · ")}</p>
                  <p className="text-gray-500">
                    {line.sku} · {formatPrice(line.price)} each · {line.onHand} in stock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.variationId)}
                  aria-label={`Remove ${line.productName}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button
                    type="button"
                    onClick={() =>
                      setLine(line.variationId, {
                        quantity: Math.max(line.quantity - 1, 1),
                      })
                    }
                    disabled={line.quantity <= 1}
                    aria-label="One less"
                    className="flex size-10 items-center justify-center text-gray-600 disabled:opacity-40"
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <input
                    inputMode="numeric"
                    value={line.quantity}
                    aria-label="Quantity"
                    onChange={(event) =>
                      setLine(line.variationId, {
                        quantity: Math.min(Number(event.target.value.replace(/\D/g, "")) || 0, line.onHand),
                      })
                    }
                    className="h-10 w-12 border-x border-gray-300 text-center text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLine(line.variationId, {
                        quantity: Math.min(line.quantity + 1, line.onHand),
                      })
                    }
                    disabled={line.quantity >= line.onHand}
                    aria-label="One more"
                    className="flex size-10 items-center justify-center text-gray-600 disabled:opacity-40"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
                {!line.discount && (
                  <button
                    type="button"
                    onClick={() =>
                      setLine(line.variationId, {
                        discount: { type: "amount", value: "", reason: "" },
                      })
                    }
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                  >
                    <Tag className="size-4" aria-hidden /> Discount
                  </button>
                )}
                <p className="ml-auto text-right text-sm">
                  {money.discount > 0 && <span className="mr-2 text-gray-400 line-through">{formatPrice(birr(money.gross))}</span>}
                  <span className="font-semibold text-gray-900">{formatPrice(birr(money.total))}</span>
                </p>
              </div>
              {line.discount && (
                <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                  <div className="flex gap-2">
                    <div className="flex shrink-0 rounded-lg border border-gray-300 bg-white p-0.5 text-sm">
                      {(["amount", "percent"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={line.discount!.type === type}
                          onClick={() =>
                            setLine(line.variationId, {
                              discount: { ...line.discount!, type },
                            })
                          }
                          className={clsx("min-h-9 rounded-md px-3 font-medium", line.discount!.type === type ? "bg-brand-600 text-white" : "text-gray-600")}
                        >
                          {type === "amount" ? "ETB" : "%"}
                        </button>
                      ))}
                    </div>
                    <input
                      inputMode="decimal"
                      value={line.discount.value}
                      aria-label="Discount"
                      placeholder={line.discount.type === "amount" ? "100" : "10"}
                      onChange={(event) =>
                        setLine(line.variationId, {
                          discount: {
                            ...line.discount!,
                            value: decimalText(event.target.value),
                          },
                        })
                      }
                      className={inputClasses}
                    />
                  </div>
                  <input
                    value={line.discount.reason}
                    maxLength={200}
                    aria-label="Why the discount"
                    placeholder="Why: regular customer, damaged box…"
                    onChange={(event) =>
                      setLine(line.variationId, {
                        discount: {
                          ...line.discount!,
                          reason: event.target.value,
                        },
                      })
                    }
                    className={inputClasses}
                  />
                  <button type="button" onClick={() => setLine(line.variationId, { discount: null })} className="min-h-9 text-sm font-medium text-gray-600 hover:text-red-700">
                    Remove discount
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Customer({ draft, change, channels, walkInId }: { draft: SaleDraft; change: (update: Partial<SaleDraft>) => void; channels: SalesChannel[]; walkInId: string }) {
  const chosen = draft.channelId || walkInId;
  const isDelivery = draft.mode === "delivery";
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {channels.map((channel) => (
          <button key={channel.id} type="button" aria-pressed={chosen === channel.id} onClick={() => change({ channelId: channel.id })} className={chip(chosen === channel.id)}>
            {channel.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label={isDelivery ? "Name" : "Name (optional)"} isRequired={isDelivery}>
          <input value={draft.customerName} maxLength={120} onChange={(event) => change({ customerName: event.target.value })} placeholder="Meron Alemu" className={inputClasses} />
        </Field>
        <Field label={isDelivery ? "Phone" : "Phone (optional)"} isRequired={isDelivery}>
          <input
            type="tel"
            inputMode="tel"
            value={draft.customerPhone}
            maxLength={25}
            onChange={(event) => change({ customerPhone: event.target.value })}
            placeholder="0911 234 567"
            className={inputClasses}
          />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input value={draft.note} maxLength={500} onChange={(event) => change({ note: event.target.value })} placeholder="Gift wrap" className={inputClasses} />
      </Field>
    </section>
  );
}

function DeliveryBox({ draft, change, fee, share }: { draft: SaleDraft; change: (update: Partial<SaleDraft>) => void; fee: number; share: number }) {
  const delivery = draft.delivery;
  // The chosen deliverer is kept by id in the draft; its details come from the server
  const { data } = useGetDelivererQuery(delivery.delivererId ?? "", {
    skip: !delivery.delivererId,
  });
  const chosen: Deliverer | null = delivery.delivererId ? (data?.data ?? null) : null;
  const setDelivery = (update: Partial<SaleDraft["delivery"]>) => change({ delivery: { ...delivery, ...update } });
  const customerShare = Math.max(fee - share, 0);

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["pickup", "Pickup", Store],
            ["delivery", "Delivery", Bike],
          ] as const
        ).map(([mode, label, Icon]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={draft.mode === mode}
            onClick={() =>
              change({
                mode,
                pay: mode === "delivery" && delivery.cashOnDelivery ? "none" : draft.pay === "none" && mode === "pickup" ? "full" : draft.pay,
              })
            }
            className={clsx(
              "flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium",
              draft.mode === mode ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500" : "border-gray-200 text-gray-700 hover:border-brand-300",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>
      {draft.mode === "delivery" && (
        <div className="space-y-3">
          {delivery.delivererId && !chosen ? (
            <Loader2 className="size-5 animate-spin text-brand-600" aria-label="Loading" />
          ) : (
            <DelivererSelect
              value={chosen}
              onChange={(deliverer) =>
                setDelivery({
                  delivererId: deliverer?.id ?? null,
                  delivererName: deliverer?.name ?? "",
                })
              }
            />
          )}
          <Field label="Address" isRequired>
            <input
              value={delivery.address}
              maxLength={300}
              onChange={(event) => setDelivery({ address: event.target.value })}
              placeholder="Bole, near Edna Mall, house 12"
              className={inputClasses}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery fee, ETB" isRequired>
              <input
                inputMode="decimal"
                value={delivery.totalFee}
                onChange={(event) => setDelivery({ totalFee: decimalText(event.target.value) })}
                placeholder="500"
                className={inputClasses}
              />
            </Field>
            <Field label="We pay, ETB">
              <input
                inputMode="decimal"
                value={delivery.companyShare}
                onChange={(event) => setDelivery({ companyShare: decimalText(event.target.value) })}
                placeholder="0"
                className={inputClasses}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setDelivery({ companyShare: "0" })} className={chip(share === 0)}>
              Customer pays all
            </button>
            <button type="button" onClick={() => setDelivery({ companyShare: delivery.totalFee })} className={chip(fee > 0 && share === fee)} disabled={!fee}>
              We pay all
            </button>
          </div>
          {fee > 0 && share <= fee && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              The deliverer gets {formatPrice(birr(fee))}. We pay {formatPrice(birr(share))} (taken off the profit), the customer pays {formatPrice(birr(customerShare))}.
            </p>
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={delivery.cashOnDelivery}
              onChange={(event) =>
                change({
                  delivery: {
                    ...delivery,
                    cashOnDelivery: event.target.checked,
                  },
                  pay: event.target.checked ? "none" : draft.pay === "none" ? "full" : draft.pay,
                })
              }
              className="size-5 rounded border-gray-300 text-brand-600"
            />
            Cash on delivery: the deliverer collects what is left
          </label>
          <p className="text-xs text-gray-500">
            No deliverer yet?{" "}
            <Link href="/deliverers/new" className="font-medium text-brand-700 hover:underline">
              Add one
            </Link>{" "}
            or type a new name above.
          </p>
        </div>
      )}
    </section>
  );
}
