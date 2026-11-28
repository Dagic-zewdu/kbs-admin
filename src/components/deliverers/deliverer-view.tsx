"use client";

import clsx from "clsx";
import { Banknote, Bike, Building2, HandCoins, Loader2, Pencil, Phone, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PaymentAccountsList } from "@/components/payment-accounts/payment-accounts-list";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { useChangeDelivererStatusMutation, useDeleteDelivererMutation, useGetDelivererQuery } from "@/store/api/deliverers.api";
import { delivererTypeLabels } from "@/types/deliverer";
import { DelivererDeliveries, DelivererMoneyHistory, HandinDialog, PayFeeDialog } from "./deliverer-money";

/** One deliverer: how to call and pay them, and where things stand */
export function DelivererView({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading, error } = useGetDelivererQuery(id);
  const [dialog, setDialog] = useState<"status" | "delete" | "fee" | "handin" | null>(null);
  const [tab, setTab] = useState<"deliveries" | "money">("deliveries");
  const [notice, setNotice] = useState(params.get("saved") ? "Saved." : "");
  const [changeStatus, statusState] = useChangeDelivererStatusMutation();
  const [remove, deleteState] = useDeleteDelivererMutation();

  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Deliverer not found"}</p>;
  const deliverer = data.data;
  const { money } = deliverer;
  const TypeIcon = deliverer.type === "company" ? Building2 : Bike;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={deliverer.name}
        backHref="/deliverers"
        actions={
          <>
            <Link
              href={`/deliverers/${id}/edit`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:h-10"
            >
              <Pencil className="size-4" aria-hidden /> Edit
            </Link>
            <Button type="button" variant="secondary" onClick={() => setDialog("handin")} disabled={money.cashHeld <= 0}>
              <HandCoins className="size-4" aria-hidden /> Cash handed in
            </Button>
            <Button type="button" onClick={() => setDialog("fee")} disabled={money.feesOwed <= 0}>
              <Banknote className="size-4" aria-hidden /> Pay fees
            </Button>
          </>
        }
      />
      {notice && <Alert type="success">{notice}</Alert>}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          <TypeIcon className="size-3.5" aria-hidden /> {delivererTypeLabels[deliverer.type]}
        </span>
        {!deliverer.isActive && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Deactivated: can&apos;t be chosen for new deliveries</span>}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Deliveries", value: String(money.deliveries), hint: money.openDeliveries ? `${money.openDeliveries} open` : undefined },
          { label: "Fees earned", value: formatPrice(money.feesEarned) },
          {
            label: money.feesOwed < 0 ? "Fees paid ahead" : "Fees we owe",
            value: formatPrice(Math.abs(money.feesOwed)),
            tone: money.feesOwed > 0 ? "amber" : undefined,
          },
          { label: "Customer cash they hold", value: formatPrice(money.cashHeld), tone: money.cashHeld > 0 ? "amber" : undefined },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{item.label}</dt>
            <dd className={clsx("mt-1 text-lg font-semibold", item.tone === "amber" ? "text-amber-800" : "text-gray-900")}>{item.value}</dd>
            {item.hint && <dd className="text-xs text-gray-500">{item.hint}</dd>}
          </div>
        ))}
      </dl>

      <section className="grid gap-5 rounded-xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2 sm:p-5">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Phone numbers</h2>
          <ul className="space-y-1.5">
            {deliverer.phones.map((item) => (
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
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Payment accounts</h2>
          <PaymentAccountsList accounts={deliverer.accounts} />
        </div>
        {deliverer.notes && (
          <div className="rounded-lg bg-amber-50 p-3 text-amber-900 sm:col-span-2">
            <p className="text-xs font-semibold">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{deliverer.notes}</p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div role="tablist" className="flex border-b border-gray-100 px-2">
          {(["deliveries", "money"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={clsx("min-h-11 border-b-2 px-3 text-sm font-medium", tab === item ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}
            >
              {item === "deliveries" ? "Deliveries" : "Money"}
            </button>
          ))}
        </div>
        {tab === "deliveries" ? <DelivererDeliveries delivererId={id} /> : <DelivererMoneyHistory delivererId={id} onRemoved={setNotice} />}
      </section>

      <section className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setDialog("status")}>
          <Power className="size-4" aria-hidden /> {deliverer.isActive ? "Deactivate" : "Activate"}
        </Button>
        {money.deliveries === 0 && (
          <Button type="button" variant="ghost" onClick={() => setDialog("delete")} className="text-red-700 hover:bg-red-50">
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        )}
      </section>

      {dialog === "fee" && (
        <PayFeeDialog
          deliverer={deliverer}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null);
            setNotice(message);
          }}
        />
      )}
      {dialog === "handin" && (
        <HandinDialog
          deliverer={deliverer}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null);
            setNotice(message);
          }}
        />
      )}
      <ConfirmDialog
        open={dialog === "status"}
        tone={deliverer.isActive ? "danger" : "default"}
        title={deliverer.isActive ? `Deactivate ${deliverer.name}?` : `Activate ${deliverer.name}?`}
        description={deliverer.isActive ? "They can't be chosen for new deliveries. Their deliveries, fees and cash stay." : "They can be chosen for new deliveries again."}
        confirmLabel={deliverer.isActive ? "Deactivate" : "Activate"}
        isLoading={statusState.isLoading}
        error={getErrorMessage(statusState.error) || undefined}
        onCancel={() => {
          statusState.reset();
          setDialog(null);
        }}
        onConfirm={async () => {
          const result = await changeStatus({ id, isActive: !deliverer.isActive });
          if (result.data) {
            setDialog(null);
            setNotice(deliverer.isActive ? "Deactivated." : "Activated.");
          }
        }}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        tone="danger"
        title={`Delete ${deliverer.name}?`}
        description="They have no deliveries. This can't be undone."
        confirmLabel="Delete"
        isLoading={deleteState.isLoading}
        error={getErrorMessage(deleteState.error) || undefined}
        onCancel={() => {
          deleteState.reset();
          setDialog(null);
        }}
        onConfirm={async () => {
          const result = await remove(id);
          if (result.data) router.replace(`/deliverers?deleted=${encodeURIComponent(deliverer.name)}`);
        }}
      />
    </div>
  );
}
