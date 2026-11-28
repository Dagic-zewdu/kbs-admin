"use client";

import clsx from "clsx";
import { Ban, Bike, Loader2, MapPin, Pencil, Phone, Plus, Printer, Undo2, Wallet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import { useGetSaleQuery, useRemoveSalePaymentMutation } from "@/store/api/sales.api";
import { deliveryStatusLabels, returnReasonLabels, type DeliveryStatus, type Sale, type SalePayment } from "@/types/sale";
import { DeliveryStatusBadge, formatTime, PaymentStatusBadge, SaleStatusBadge } from "./sale-badges";
import { AddPaymentDialog, CancelSaleDialog, DeliveryStatusDialog, EditDeliveryDialog, nextDeliveryStatuses, RefundDialog, ReturnDialog } from "./sale-dialogs";

type Dialog =
  | { type: "pay" }
  | { type: "status"; to: Exclude<DeliveryStatus, "cancelled"> }
  | { type: "editDelivery" }
  | { type: "cancel" }
  | { type: "return" }
  | { type: "refund" }
  | { type: "removePayment"; payment: SalePayment }
  | null;

const nextLabels: Record<DeliveryStatus, string> = {
  pending: "Back to pending",
  on_the_way: "On the way",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Came back",
  cancelled: "Cancelled",
};

/** One sale: what was sold, the money, the delivery, and what can still be done */
export function SaleView({ id }: { id: string }) {
  const params = useSearchParams();
  const { data, isLoading, error } = useGetSaleQuery(id);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState(params.get("new") ? "Sale completed. Stock went down." : "");
  const [removePayment, removeState] = useRemoveSalePaymentMutation();

  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Sale not found"}</p>;
  const sale = data.data;
  const { money, delivery } = sale;
  const isOpen = sale.status === "completed" || sale.status === "partly_returned";
  const canCancel = isOpen && (!delivery || ["pending", "failed"].includes(delivery.status));
  const canReturn = isOpen && (!delivery || delivery.status === "delivered");
  const close = () => setDialog(null);
  const done = (message: string) => {
    setDialog(null);
    setNotice(message);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={`Sale ${sale.code}`}
        description={[
          `Sold ${formatTime(sale.soldAt)}`,
          sale.channel?.name && (sale.fromLive ? `${sale.channel.name} live` : sale.channel.name),
          sale.contactedAt && `Contacted ${formatTime(sale.contactedAt)}`,
          sale.seller?.name && `by ${sale.seller.name}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        backHref="/sales"
        actions={
          <>
            <Link
              href={`/sales/${id}/receipt`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:h-10"
            >
              <Printer className="size-4" aria-hidden /> Receipt
            </Link>
            <Link href="/sales/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:h-10">
              <Plus className="size-4" aria-hidden /> New sale
            </Link>
          </>
        }
      />
      {notice && <Alert type="success">{notice}</Alert>}

      <div className="flex flex-wrap gap-2">
        <SaleStatusBadge status={sale.status} />
        <PaymentStatusBadge status={money.paymentStatus} />
        {delivery && <DeliveryStatusBadge status={delivery.status} />}
      </div>
      {sale.cancelReason && <p className="text-sm text-gray-600">Cancelled: {sale.cancelReason}</p>}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Customer pays", value: formatPrice(money.total) },
          { label: "Paid", value: formatPrice(money.paid) },
          money.toRefund > 0 ? { label: "To refund", value: formatPrice(money.toRefund), tone: "violet" } : { label: "Left to pay", value: formatPrice(money.left), tone: money.left > 0 ? "amber" : undefined },
          {
            label: "Profit",
            value: formatPrice(money.profit),
            hint: money.profitPercent !== null ? `${money.profitPercent}% of cost ${formatPrice(money.cost)}` : `Cost ${formatPrice(money.cost)}`,
            tone: money.profit < 0 ? "red" : "green",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd
              className={clsx(
                "mt-1 text-lg font-semibold",
                item.tone === "amber" ? "text-amber-800" : item.tone === "red" ? "text-red-700" : item.tone === "violet" ? "text-violet-800" : item.tone === "green" ? "text-emerald-700" : "text-gray-900",
              )}
            >
              {item.value}
            </dd>
            {"hint" in item && item.hint && <dd className="text-xs text-gray-500">{item.hint}</dd>}
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        {money.left > 0 && sale.status !== "cancelled" && (
          <Button type="button" onClick={() => setDialog({ type: "pay" })}>
            <Wallet className="size-4" aria-hidden /> Record payment
          </Button>
        )}
        {money.toRefund > 0 && (
          <Button type="button" onClick={() => setDialog({ type: "refund" })}>
            <Wallet className="size-4" aria-hidden /> Give money back
          </Button>
        )}
        {canReturn && (
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: "return" })}>
            <Undo2 className="size-4" aria-hidden /> Return
          </Button>
        )}
        {canCancel && (
          <Button type="button" variant="ghost" onClick={() => setDialog({ type: "cancel" })} className="text-red-700 hover:bg-red-50">
            <Ban className="size-4" aria-hidden /> Cancel sale
          </Button>
        )}
      </div>

      {delivery && <DeliverySection sale={sale} onStatus={(to) => setDialog({ type: "status", to })} onEdit={() => setDialog({ type: "editDelivery" })} />}

      <Lines sale={sale} />

      <section className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Payments</h2>
          {sale.payments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sale.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className={clsx("font-medium", payment.isRefund ? "text-violet-800" : "text-gray-900")}>
                      {payment.isRefund ? "Given back " : ""}
                      {formatPrice(payment.amount)} <span className="font-normal text-gray-500">· {payment.method.name}</span>
                    </p>
                    <p className="break-words text-xs text-gray-500">
                      {[formatDay(payment.paidOn), payment.viaDeliverer && `collected by ${payment.viaDeliverer.name}`, payment.by, payment.note].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDialog({ type: "removePayment", payment })}
                    className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
          <h2 className="font-semibold text-gray-900">Customer</h2>
          <p className="text-gray-700">{sale.customer.name ?? "Walk-in customer"}</p>
          {sale.customer.phone && (
            <a href={`tel:${sale.customer.phone}`} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
              <Phone className="size-4" aria-hidden /> {sale.customer.phone}
            </a>
          )}
          {sale.note && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">{sale.note}</p>}
        </div>
      </section>

      {sale.returns.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Returns</h2>
          <ul className="divide-y divide-gray-100">
            {sale.returns.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-gray-900">
                  {returnReasonLabels[item.reason]} · {formatPrice(item.total + item.vat)}
                </p>
                <p className="text-gray-600">
                  {item.items.map((line) => `${line.quantity} × ${[line.productName, line.variationName].filter(Boolean).join(" · ")}${line.damaged ? " (damaged)" : ""}`).join(", ")}
                </p>
                <p className="text-xs text-gray-500">{[formatTime(item.createdAt), item.by, item.note].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialog?.type === "pay" && <AddPaymentDialog sale={sale} onClose={close} onDone={done} />}
      {dialog?.type === "status" && <DeliveryStatusDialog sale={sale} to={dialog.to} onClose={close} onDone={done} />}
      {dialog?.type === "editDelivery" && <EditDeliveryDialog sale={sale} onClose={close} onDone={done} />}
      {dialog?.type === "cancel" && <CancelSaleDialog sale={sale} onClose={close} onDone={done} />}
      {dialog?.type === "return" && <ReturnDialog sale={sale} onClose={close} onDone={done} />}
      {dialog?.type === "refund" && <RefundDialog sale={sale} onClose={close} onDone={done} />}
      <ConfirmDialog
        open={dialog?.type === "removePayment"}
        tone="danger"
        title="Remove this payment?"
        description={dialog?.type === "removePayment" ? `${formatPrice(dialog.payment.amount)} on ${formatDay(dialog.payment.paidOn)}. Only for one entered by mistake. It stays in the activity log.` : ""}
        confirmLabel="Remove"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={() => {
          removeState.reset();
          close();
        }}
        onConfirm={async () => {
          if (dialog?.type !== "removePayment") return;
          const result = await removePayment(dialog.payment.id);
          if (result.data) done("Payment removed.");
        }}
      />
    </div>
  );
}

function DeliverySection({ sale, onStatus, onEdit }: { sale: Sale; onStatus: (to: Exclude<DeliveryStatus, "cancelled">) => void; onEdit: () => void }) {
  const delivery = sale.delivery!;
  const next = sale.status === "completed" ? nextDeliveryStatuses(delivery.status) : [];
  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 font-semibold text-gray-900">
          <Bike className="size-4 text-gray-400" aria-hidden /> Delivery
        </h2>
        {sale.status !== "cancelled" && (
          <button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-medium text-brand-700 hover:bg-brand-50">
            <Pencil className="size-4" aria-hidden /> Change
          </button>
        )}
      </div>
      <p className="text-gray-700">
        <Link href={`/deliverers/${delivery.deliverer.id}`} className="font-medium text-brand-700 hover:underline">
          {delivery.deliverer.name ?? "Deliverer"}
        </Link>
        {delivery.cashOnDelivery && " · cash on delivery"}
      </p>
      <p className="flex items-start gap-1.5 text-gray-700">
        <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden /> {delivery.address}
      </p>
      <p className="text-gray-600">
        Fee {formatPrice(delivery.totalFee)}: we pay {formatPrice(delivery.companyShare)}, the customer pays {formatPrice(delivery.customerShare)}.
      </p>
      {delivery.statusNote && <p className="text-gray-600">Note: {delivery.statusNote}</p>}
      <p className="text-xs text-gray-500">
        {[
          delivery.onTheWayAt && `Left ${formatTime(delivery.onTheWayAt)}`,
          delivery.failedAt && `Failed ${formatTime(delivery.failedAt)}`,
          delivery.deliveredAt && `Delivered ${formatTime(delivery.deliveredAt)}`,
          delivery.returnedAt && `Came back ${formatTime(delivery.returnedAt)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {next.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {next.map((to) => (
            <Button
              key={to}
              type="button"
              variant={to === "delivered" ? "primary" : to === "returned" || to === "failed" ? "ghost" : "secondary"}
              className={clsx(to === "returned" || to === "failed" ? "text-red-700 hover:bg-red-50" : "")}
              onClick={() => onStatus(to as Exclude<DeliveryStatus, "cancelled">)}
            >
              {to === "delivered" ? "Mark delivered" : nextLabels[to]}
            </Button>
          ))}
        </div>
      )}
      {delivery.status !== "pending" && next.length === 0 && sale.status === "completed" && <p className="text-xs text-gray-500">{deliveryStatusLabels[delivery.status]}.</p>}
    </section>
  );
}

function Lines({ sale }: { sale: Sale }) {
  const { money } = sale;
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">What was sold</h2>
      <ul className="divide-y divide-gray-100">
        {sale.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{[item.productName, item.variationName].filter(Boolean).join(" · ")}</p>
              <p className="text-gray-500">
                {item.quantity} × {formatPrice(item.unitPrice)} · {item.sku}
                {item.discount && ` · ${item.discount.percent ? `${item.discount.percent}%` : formatPrice(item.discount.amount)} off (${item.discount.reason})`}
              </p>
              <p className="text-xs text-gray-400">
                Cost {formatPrice(item.cost)}
                {item.batches.some((part) => part.expiryDate) && ` · expiry ${item.batches.map((part) => formatDay(part.expiryDate)).join(", ")}`}
              </p>
              {item.returned.quantity > 0 && sale.status !== "cancelled" && <p className="text-xs font-medium text-amber-800">{item.returned.quantity} returned</p>}
            </div>
            <p className="font-semibold text-gray-900">{formatPrice(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-gray-100 px-4 py-3 text-sm">
        <Total label="Products" value={money.grossTotal} />
        {money.discountTotal > 0 && <Total label="Discounts" value={-money.discountTotal} />}
        {money.vatAmount > 0 && <Total label={`VAT ${money.vatRate}%`} value={money.vatAmount} />}
        {money.returnedTotal > 0 && <Total label="Returned" value={-(money.returnedTotal + money.returnedVat)} />}
        {(money.deliveryCharge > 0 || sale.delivery) && <Total label="Delivery (customer's part)" value={money.deliveryCharge} />}
        <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
          <dt>Customer pays</dt>
          <dd>{formatPrice(money.total)}</dd>
        </div>
      </dl>
    </section>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-gray-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatPrice(value)}</dd>
    </div>
  );
}
