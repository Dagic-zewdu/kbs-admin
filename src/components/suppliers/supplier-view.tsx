"use client";

import clsx from "clsx";
import { Globe2, Loader2, Lock, Mail, MapPin, Pencil, Phone, Power, Trash2, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getErrorMessage } from "@/lib/api-error";
import { formatDay, formatPrice } from "@/lib/labels";
import {
  useChangeSupplierStatusMutation,
  useDeleteSupplierMutation,
  useGetSupplierQuery,
  useListSupplierDeliveriesQuery,
  useListSupplierPaymentsQuery,
  usePayDeliveryMutation,
  usePaySupplierMutation,
  useRemovePaymentMutation,
} from "@/store/api/suppliers.api";
import { paymentMethodLabels, type SupplierDelivery, type SupplierPayment, type SupplierWithMoney } from "@/types/supplier";
import { PaymentAccountsList } from "@/components/payment-accounts/payment-accounts-list";
import { PayDialog } from "./pay-dialog";
import { PaymentBadge } from "./payment-badge";

type Dialog = { type: "pay" } | { type: "payDelivery"; delivery: SupplierDelivery } | { type: "remove"; payment: SupplierPayment } | { type: "status" } | { type: "delete" } | null;

/** One supplier: details, our deliveries from it, and our payments */
export function SupplierView({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading, error } = useGetSupplierQuery(id);
  const [tab, setTab] = useState<"deliveries" | "payments">("deliveries");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState(params.get("saved") ? "Saved." : "");
  const [paySupplier, payState] = usePaySupplierMutation();
  const [payDelivery, payDeliveryState] = usePayDeliveryMutation();
  const [removePayment, removeState] = useRemovePaymentMutation();
  const [changeStatus, statusState] = useChangeSupplierStatusMutation();
  const [remove, deleteState] = useDeleteSupplierMutation();

  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Supplier not found"}</p>;
  const supplier = data.data;
  const isMine = supplier.createdBy === "us";
  const close = () => setDialog(null);
  const done = (message: string) => {
    setDialog(null);
    setNotice(message);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={supplier.name}
        backHref="/suppliers"
        actions={
          <>
            {isMine && (
              <Link
                href={`/suppliers/${id}/edit`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:h-10"
              >
                <Pencil className="size-4" aria-hidden /> Edit
              </Link>
            )}
            <Button type="button" onClick={() => setDialog({ type: "pay" })} disabled={supplier.money.owed <= 0}>
              <Wallet className="size-4" aria-hidden /> Pay supplier
            </Button>
          </>
        }
      />
      {notice && <Alert type="success">{notice}</Alert>}

      <div className="flex flex-wrap gap-2">
        {supplier.visibility === "shared" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
            <Globe2 className="size-3.5" aria-hidden /> {isMine ? "Shared with other companies" : "Shared by another company"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            <Lock className="size-3.5" aria-hidden /> Private
          </span>
        )}
        {!supplier.isActive && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Deactivated: can&apos;t be chosen for new stock</span>}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Bought", value: formatPrice(supplier.money.total), hint: `${supplier.money.deliveries} ${supplier.money.deliveries === 1 ? "delivery" : "deliveries"}` },
          { label: "Paid", value: formatPrice(supplier.money.paid) },
          { label: "We owe", value: formatPrice(supplier.money.owed), tone: supplier.money.owed > 0 ? "amber" : undefined },
          { label: "Overdue", value: formatPrice(supplier.money.overdue), tone: supplier.money.overdue > 0 ? "red" : undefined },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd className={clsx("mt-1 text-lg font-semibold", item.tone === "red" ? "text-red-700" : item.tone === "amber" ? "text-amber-800" : "text-gray-900")}>{item.value}</dd>
            {item.hint && <dd className="text-xs text-gray-500">{item.hint}</dd>}
          </div>
        ))}
      </dl>

      <Details supplier={supplier} />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div role="tablist" className="flex border-b border-gray-100 px-2">
          {(["deliveries", "payments"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={clsx("min-h-11 border-b-2 px-3 text-sm font-medium", tab === item ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}
            >
              {item === "deliveries" ? "Deliveries" : "Payments"}
            </button>
          ))}
        </div>
        {tab === "deliveries" ? (
          <Deliveries id={id} onPay={(delivery) => setDialog({ type: "payDelivery", delivery })} />
        ) : (
          <Payments id={id} onRemove={(payment) => setDialog({ type: "remove", payment })} />
        )}
      </section>

      {isMine && (
        <section className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setDialog({ type: "status" })}>
            <Power className="size-4" aria-hidden /> {supplier.isActive ? "Deactivate" : "Activate"}
          </Button>
          {supplier.money.deliveries === 0 && (
            <Button type="button" variant="ghost" onClick={() => setDialog({ type: "delete" })} className="text-red-700 hover:bg-red-50">
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          )}
        </section>
      )}

      {dialog?.type === "pay" && (
        <PayDialog
          title={`Pay ${supplier.name}`}
          owed={supplier.money.owed}
          hint="The oldest deliveries not fully paid are paid first."
          isLoading={payState.isLoading}
          error={payState.error}
          onClose={() => {
            payState.reset();
            close();
          }}
          onPay={async (payment) => {
            const result = await paySupplier({ id, ...payment });
            if (result.data) done(`${formatPrice(payment.amount)} paid, for ${result.data.data.deliveriesPaid} ${result.data.data.deliveriesPaid === 1 ? "delivery" : "deliveries"}.`);
          }}
        />
      )}
      {dialog?.type === "payDelivery" && (
        <PayDialog
          title={`Pay for ${dialog.delivery.product.name}`}
          owed={dialog.delivery.left}
          hint={`${dialog.delivery.quantity} units received ${formatDay(dialog.delivery.receivedDate)}.`}
          isLoading={payDeliveryState.isLoading}
          error={payDeliveryState.error}
          onClose={() => {
            payDeliveryState.reset();
            close();
          }}
          onPay={async (payment) => {
            const result = await payDelivery({ batchId: dialog.delivery.id, ...payment });
            if (result.data) done(`${formatPrice(payment.amount)} paid.`);
          }}
        />
      )}
      <ConfirmDialog
        open={dialog?.type === "remove"}
        tone="danger"
        title="Remove this payment?"
        description={
          dialog?.type === "remove"
            ? `${formatPrice(dialog.payment.amount)} paid ${formatDay(dialog.payment.paidOn)}. Only for a payment entered by mistake: what you owe goes up again. It stays in the activity log.`
            : ""
        }
        confirmLabel="Remove payment"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={close}
        onConfirm={async () => {
          if (dialog?.type !== "remove") return;
          const result = await removePayment(dialog.payment.id);
          if (result.data) done("The payment was removed.");
        }}
      />
      <ConfirmDialog
        open={dialog?.type === "status"}
        tone={supplier.isActive ? "danger" : "default"}
        title={supplier.isActive ? `Deactivate ${supplier.name}?` : `Activate ${supplier.name}?`}
        description={supplier.isActive ? "It can't be chosen for new stock. Its deliveries and payments stay, and you can still pay it." : "It can be chosen for new stock again."}
        confirmLabel={supplier.isActive ? "Deactivate" : "Activate"}
        isLoading={statusState.isLoading}
        error={getErrorMessage(statusState.error) || undefined}
        onCancel={() => {
          statusState.reset();
          close();
        }}
        onConfirm={async () => {
          const result = await changeStatus({ id, isActive: !supplier.isActive });
          if (result.data) done(supplier.isActive ? "Deactivated." : "Activated.");
        }}
      />
      <ConfirmDialog
        open={dialog?.type === "delete"}
        tone="danger"
        title={`Delete ${supplier.name}?`}
        description="No stock was received from it. This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteState.isLoading}
        error={getErrorMessage(deleteState.error) || undefined}
        onCancel={() => {
          deleteState.reset();
          close();
        }}
        onConfirm={async () => {
          const result = await remove(id);
          if (result.data) router.replace(`/suppliers?deleted=${encodeURIComponent(supplier.name)}`);
        }}
      />
    </div>
  );
}

function Details({ supplier }: { supplier: SupplierWithMoney }) {
  return (
    <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2 sm:p-5">
      <div className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Phone numbers</h2>
        <ul className="space-y-1.5">
          {supplier.phones.map((item) => (
            <li key={item.phone} className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
              <a href={`tel:${item.phone}`} className="font-medium text-brand-700 hover:underline">
                {item.phone}
              </a>
              {item.label && <span className="text-gray-500">{item.label}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Details</h2>
        <ul className="space-y-1.5 text-gray-700">
          <li className="flex items-center gap-2">
            <Globe2 className="size-4 shrink-0 text-gray-400" aria-hidden /> {supplier.country}
          </li>
          {supplier.contactPerson && (
            <li className="flex items-center gap-2">
              <User className="size-4 shrink-0 text-gray-400" aria-hidden /> {supplier.contactPerson}
            </li>
          )}
          {supplier.email && (
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-gray-400" aria-hidden />
              <a href={`mailto:${supplier.email}`} className="break-all text-brand-700 hover:underline">
                {supplier.email}
              </a>
            </li>
          )}
          {supplier.address && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-gray-400" aria-hidden /> {supplier.address}
            </li>
          )}
        </ul>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Payment accounts</h2>
        <PaymentAccountsList accounts={supplier.accounts ?? []} />
      </div>
      {supplier.notes && (
        <div className="rounded-lg bg-amber-50 p-3 text-amber-900 sm:col-span-2">
          <p className="text-xs font-semibold">Notes (only your company sees them)</p>
          <p className="mt-1 whitespace-pre-wrap">{supplier.notes}</p>
        </div>
      )}
    </section>
  );
}

function Deliveries({ id, onPay }: { id: string; onPay: (delivery: SupplierDelivery) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListSupplierDeliveriesQuery({ id, page, limit: 20 });
  const result = data?.data;
  if (isLoading) return <Loader2 className="mx-auto my-10 size-5 animate-spin text-brand-600" aria-label="Loading" />;
  if (!result) return <p className="px-4 py-8 text-center text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (!result.items.length) return <p className="px-4 py-8 text-center text-sm text-gray-500">No stock was received from this supplier yet. Choose it when you add stock to a product.</p>;
  return (
    <>
      <ul className="divide-y divide-gray-100">
        {result.items.map((delivery) => (
          <li key={delivery.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-sm">
            <div className="min-w-0">
              <Link href={`/inventory/${delivery.variation.id}`} className="font-medium text-gray-900 hover:text-brand-700 hover:underline">
                {delivery.product.name}
                {delivery.variation.name && ` · ${delivery.variation.name}`}
              </Link>
              <p className="text-xs text-gray-500">
                {formatDay(delivery.receivedDate)} · {delivery.quantity} × {formatPrice(delivery.unitCost)} = {formatPrice(delivery.total)}
                {delivery.payByDate && delivery.left > 0 && ` · pay by ${formatDay(delivery.payByDate)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PaymentBadge payment={delivery} />
              {delivery.left > 0 && (
                <Button type="button" variant="secondary" className="h-9! px-3!" onClick={() => onPay(delivery)}>
                  Pay
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
    </>
  );
}

function Payments({ id, onRemove }: { id: string; onRemove: (payment: SupplierPayment) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListSupplierPaymentsQuery({ id, page, limit: 20 });
  const result = data?.data;
  if (isLoading) return <Loader2 className="mx-auto my-10 size-5 animate-spin text-brand-600" aria-label="Loading" />;
  if (!result) return <p className="px-4 py-8 text-center text-sm text-red-600">{getErrorMessage(error)}</p>;
  if (!result.items.length) return <p className="px-4 py-8 text-center text-sm text-gray-500">No payments yet.</p>;
  return (
    <>
      <ul className="divide-y divide-gray-100">
        {result.items.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {formatPrice(payment.amount)} <span className="font-normal text-gray-500">· {paymentMethodLabels[payment.method]}</span>
              </p>
              <p className="break-words text-xs text-gray-500">
                {[formatDay(payment.paidOn), payment.delivery.productName && `for ${payment.delivery.productName}${payment.delivery.variationName ? ` · ${payment.delivery.variationName}` : ""}`, payment.by, payment.note]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button type="button" onClick={() => onRemove(payment)} aria-label="Remove this payment" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
    </>
  );
}
