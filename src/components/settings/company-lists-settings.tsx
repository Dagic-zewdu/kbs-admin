"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Field, inputClasses } from "@/components/inventory/field";
import { FormDialog } from "@/components/inventory/form-dialog";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/lib/api-error";
import {
  useCreateChannelMutation,
  useCreatePaymentMethodMutation,
  useDeleteChannelMutation,
  useDeletePaymentMethodMutation,
  useListChannelsQuery,
  useListPaymentMethodsQuery,
  useReorderChannelsMutation,
  useReorderPaymentMethodsMutation,
  useUpdateChannelMutation,
  useUpdatePaymentMethodMutation,
  useUpdateSettingsMutation,
} from "@/store/api/settings.api";
import { channelKindLabels, methodTypeLabels, type ChannelKind, type MethodType, type PaymentMethodOption, type SalesChannel } from "@/types/company-lists";
import type { CompanySettings } from "@/types/settings";

const section = "space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6";
const iconButton = "flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30";

const move = <T extends { id: string }>(list: T[], index: number, by: -1 | 1) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + by, 0, item);
  return next.map((entry) => entry.id);
};

/** A switch that reads like one */
function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50", checked ? "bg-brand-600" : "bg-gray-300")}
    >
      <span className={clsx("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

// ---------- Receipt printing ----------

export function ReceiptSettings({ saved, canEdit }: { saved: CompanySettings; canEdit: boolean }) {
  const [update, { isLoading, error }] = useUpdateSettingsMutation();
  const [notice, setNotice] = useState("");
  const save = async (change: Partial<CompanySettings>) => {
    setNotice("");
    const result = await update(change);
    if (result.data) setNotice("Saved.");
  };
  return (
    <section className={section}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Printer className="size-4 text-gray-400" aria-hidden /> Print the receipt when a sale is completed
          </h2>
          <p className="mt-1 text-sm text-gray-500">Off: “Sale completed” with a Print button. On: the receipt opens and prints by itself.</p>
        </div>
        <Toggle checked={saved.receiptAutoPrint} onChange={(receiptAutoPrint) => save({ receiptAutoPrint })} label="Print automatically" disabled={!canEdit || isLoading} />
      </div>
      <fieldset className="flex flex-wrap gap-2" disabled={!canEdit || isLoading}>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">Paper</legend>
        {(
          [
            ["80mm", "Receipt printer (80 mm)"],
            ["a4", "A4 paper"],
          ] as const
        ).map(([paper, label]) => (
          <button
            key={paper}
            type="button"
            aria-pressed={saved.receiptPaper === paper}
            onClick={() => save({ receiptPaper: paper })}
            className={clsx(
              "min-h-9 rounded-full border px-3 text-sm font-medium",
              saved.receiptPaper === paper ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-brand-300",
            )}
          >
            {label}
          </button>
        ))}
      </fieldset>
      {saved.receiptAutoPrint && (
        <details className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <summary className="cursor-pointer font-medium">Print without the print window (one-time set-up on the till)</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Set the receipt printer as the computer&apos;s default printer.</li>
            <li>Open Chrome with “kiosk printing”: right-click the Chrome shortcut → Properties → at the end of Target add <code className="rounded bg-white px-1">--kiosk-printing</code>.</li>
            <li>Open the admin site from that shortcut. Receipts now print straight away. Without it, Chrome shows its print window: press Print.</li>
          </ol>
        </details>
      )}
      {!canEdit && <p className="text-xs text-gray-500">Only a super admin can change this.</p>}
      {(notice || error) && <Alert type={error ? "error" : "success"}>{error ? getErrorMessage(error) : notice}</Alert>}
    </section>
  );
}

// ---------- Sales channels ----------

const KINDS = Object.keys(channelKindLabels) as ChannelKind[];

function ChannelDialog({ channel, onClose }: { channel: SalesChannel | null; onClose: (message?: string) => void }) {
  const [name, setName] = useState(channel?.name ?? "");
  const [kind, setKind] = useState<ChannelKind>(channel?.kind ?? "other");
  const [link, setLink] = useState(channel?.link ?? "");
  const [create, createState] = useCreateChannelMutation();
  const [update, updateState] = useUpdateChannelMutation();
  const submit = async () => {
    const body = { name: name.trim(), kind, link: link.trim() || null };
    const result = channel ? await update({ id: channel.id, ...body }) : await create(body);
    if (result.data) onClose(channel ? "Channel saved." : "Channel added.");
  };
  return (
    <FormDialog
      title={channel ? `Edit ${channel.name}` : "Add a sales channel"}
      submitLabel={channel ? "Save" : "Add"}
      isLoading={createState.isLoading || updateState.isLoading}
      error={name.trim().length < 2 && (createState.isError || updateState.isError) ? "Enter the name." : getErrorMessage(createState.error || updateState.error)}
      onSubmit={submit}
      onClose={() => onClose()}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" isRequired>
          <input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="WhatsApp" className={inputClasses} />
        </Field>
        <Field label="Type (picks the icon)">
          <select value={kind} onChange={(event) => setKind(event.target.value as ChannelKind)} className={inputClasses}>
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {channelKindLabels[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Your page or handle (optional)">
        <input value={link} maxLength={300} onChange={(event) => setLink(event.target.value)} placeholder="https://tiktok.com/@kbscosmetics" className={inputClasses} />
      </Field>
    </FormDialog>
  );
}

export function ChannelsSettings({ canEdit }: { canEdit: boolean }) {
  const { data, isLoading } = useListChannelsQuery({ all: true });
  const [update] = useUpdateChannelMutation();
  const [reorder] = useReorderChannelsMutation();
  const [remove, removeState] = useDeleteChannelMutation();
  const [editing, setEditing] = useState<SalesChannel | null | "new">(null);
  const [deleting, setDeleting] = useState<SalesChannel | null>(null);
  const [notice, setNotice] = useState("");
  const channels = data?.data ?? [];

  return (
    <section className={section}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Sales channels</h2>
          <p className="mt-1 text-sm text-gray-500">Where your customers come from. Shown on every new sale in this order; hidden ones are kept for old sales.</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setEditing("new")} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <Plus className="size-4" aria-hidden /> Add channel
          </button>
        )}
      </div>
      {notice && <Alert type="success">{notice}</Alert>}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {channels.map((channel, index) => (
            <li key={channel.id} className={clsx("flex items-center gap-2 px-3 py-2 text-sm", !channel.isActive && "opacity-60")}>
              <span className="min-w-0 flex-1">
                <span className="font-medium text-gray-900">{channel.name}</span>
                {!channel.isActive && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Hidden</span>}
                {channel.link && <span className="block truncate text-xs text-gray-500">{channel.link}</span>}
              </span>
              {canEdit && (
                <>
                  <button type="button" className={iconButton} disabled={index === 0} onClick={() => reorder(move(channels, index, -1))} aria-label={`Move ${channel.name} up`}>
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button type="button" className={iconButton} disabled={index === channels.length - 1} onClick={() => reorder(move(channels, index, 1))} aria-label={`Move ${channel.name} down`}>
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={channel.isProtected}
                    onClick={() => update({ id: channel.id, isActive: !channel.isActive })}
                    aria-label={channel.isActive ? `Hide ${channel.name}` : `Show ${channel.name}`}
                  >
                    {channel.isActive ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                  </button>
                  <button type="button" className={iconButton} onClick={() => setEditing(channel)} aria-label={`Edit ${channel.name}`}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className={clsx(iconButton, "hover:text-red-700")} disabled={channel.isProtected} onClick={() => setDeleting(channel)} aria-label={`Delete ${channel.name}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ChannelDialog
          channel={editing === "new" ? null : editing}
          onClose={(message) => {
            setEditing(null);
            if (message) setNotice(message);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        tone="danger"
        title={`Delete ${deleting?.name}?`}
        description="Only a channel no sale used can be deleted. Otherwise hide it."
        confirmLabel="Delete"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={() => {
          removeState.reset();
          setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await remove(deleting.id);
          if (result.data) {
            setDeleting(null);
            setNotice("Channel deleted.");
          }
        }}
      />
    </section>
  );
}

// ---------- Payment methods ----------

const TYPES = Object.keys(methodTypeLabels) as MethodType[];

function MethodDialog({ method, onClose }: { method: PaymentMethodOption | null; onClose: (message?: string) => void }) {
  const [name, setName] = useState(method?.name ?? "");
  const [type, setType] = useState<MethodType>(method?.type ?? "wallet");
  const [accountNumber, setAccountNumber] = useState(method?.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(method?.accountHolder ?? "");
  const [create, createState] = useCreatePaymentMethodMutation();
  const [update, updateState] = useUpdatePaymentMethodMutation();
  const submit = async () => {
    const body = { name: name.trim(), type, accountNumber: accountNumber.replace(/\s+/g, "") || null, accountHolder: accountHolder.trim() || null };
    const result = method ? await update({ id: method.id, ...body }) : await create(body);
    if (result.data) onClose(method ? `${body.name} saved.` : `${body.name} added.`);
  };
  return (
    <FormDialog
      title={method ? `Edit ${method.name}` : "Add a payment method"}
      submitLabel={method ? "Save" : "Add"}
      isLoading={createState.isLoading || updateState.isLoading}
      error={getErrorMessage(createState.error || updateState.error)}
      onSubmit={submit}
      onClose={() => onClose()}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" isRequired>
          <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Amole" className={inputClasses} />
        </Field>
        <Field label="Group" isRequired>
          <select value={type} onChange={(event) => setType(event.target.value as MethodType)} className={inputClasses} disabled={method?.isProtected}>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {methodTypeLabels[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your account number (optional)">
          <input inputMode="numeric" value={accountNumber} maxLength={45} onChange={(event) => setAccountNumber(event.target.value)} placeholder="1000 1234 5678" className={inputClasses} />
        </Field>
        <Field label="Account holder (optional)">
          <input value={accountHolder} maxLength={120} onChange={(event) => setAccountHolder(event.target.value)} placeholder="KBS Cosmetics PLC" className={inputClasses} />
        </Field>
      </div>
      <p className="text-xs text-gray-500">Staff see your account number when the customer pays with this method.</p>
    </FormDialog>
  );
}

export function PaymentMethodsSettings({ canEdit }: { canEdit: boolean }) {
  const { data, isLoading } = useListPaymentMethodsQuery({ all: true });
  const [update] = useUpdatePaymentMethodMutation();
  const [reorder] = useReorderPaymentMethodsMutation();
  const [remove, removeState] = useDeletePaymentMethodMutation();
  const [editing, setEditing] = useState<PaymentMethodOption | null | "new">(null);
  const [deleting, setDeleting] = useState<PaymentMethodOption | null>(null);
  const [notice, setNotice] = useState("");
  const [showOff, setShowOff] = useState(false);
  const methods = data?.data ?? [];
  const onCount = methods.filter((method) => method.isActive).length;

  return (
    <section className={section}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Payment methods</h2>
          <p className="mt-1 text-sm text-gray-500">
            What “Paid by” offers on sales, refunds, deliverer and supplier payments. Switch on the wallets and banks you use; {onCount} switched on.
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setEditing("new")} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <Plus className="size-4" aria-hidden /> Add method
          </button>
        )}
      </div>
      {notice && <Alert type="success">{notice}</Alert>}
      <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={showOff} onChange={(event) => setShowOff(event.target.checked)} className="size-4 rounded border-gray-300 text-brand-600" />
        Show the ones switched off too
      </label>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-4">
          {TYPES.map((type) => {
            const group = methods.map((method, index) => ({ method, index })).filter(({ method }) => method.type === type && (showOff || method.isActive));
            if (!group.length) return null;
            return (
              <div key={type}>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">{methodTypeLabels[type]}</h3>
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {group.map(({ method, index }) => (
                    <li key={method.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className={clsx("min-w-0 flex-1", !method.isActive && "opacity-60")}>
                        <span className="font-medium text-gray-900">{method.name}</span>
                        {method.accountNumber && (
                          <span className="block truncate text-xs text-gray-500">
                            {method.accountNumber}
                            {method.accountHolder && ` · ${method.accountHolder}`}
                          </span>
                        )}
                      </span>
                      {canEdit && (
                        <>
                          <button type="button" className={iconButton} disabled={index === 0} onClick={() => reorder(move(methods, index, -1))} aria-label={`Move ${method.name} up`}>
                            <ArrowUp className="size-4" aria-hidden />
                          </button>
                          <button type="button" className={iconButton} disabled={index === methods.length - 1} onClick={() => reorder(move(methods, index, 1))} aria-label={`Move ${method.name} down`}>
                            <ArrowDown className="size-4" aria-hidden />
                          </button>
                          <button type="button" className={iconButton} onClick={() => setEditing(method)} aria-label={`Edit ${method.name}`}>
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button type="button" className={clsx(iconButton, "hover:text-red-700")} disabled={method.isProtected} onClick={() => setDeleting(method)} aria-label={`Delete ${method.name}`}>
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </>
                      )}
                      <Toggle checked={method.isActive} onChange={(isActive) => update({ id: method.id, isActive })} label={`${method.name} on`} disabled={!canEdit || method.isProtected} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      {editing && (
        <MethodDialog
          method={editing === "new" ? null : editing}
          onClose={(message) => {
            setEditing(null);
            if (message) setNotice(message);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        tone="danger"
        title={`Delete ${deleting?.name}?`}
        description="Only a method no payment used can be deleted. Otherwise switch it off."
        confirmLabel="Delete"
        isLoading={removeState.isLoading}
        error={getErrorMessage(removeState.error) || undefined}
        onCancel={() => {
          removeState.reset();
          setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await remove(deleting.id);
          if (result.data) {
            setDeleting(null);
            setNotice("Payment method deleted.");
          }
        }}
      />
    </section>
  );
}
