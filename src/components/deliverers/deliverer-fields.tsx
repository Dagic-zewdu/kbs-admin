"use client";

import clsx from "clsx";
import { Building2, Plus, Trash2, User } from "lucide-react";
import { Field, inputClasses } from "@/components/inventory/field";
import { accountsProblem, PaymentAccountsFields, toAccountForms, toAccountInputs, type AccountForm } from "@/components/payment-accounts/payment-accounts-fields";
import { delivererTypeLabels, type Deliverer, type DelivererInput, type DelivererType } from "@/types/deliverer";

/** A deliverer while typing */
export interface DelivererForm {
  type: DelivererType;
  name: string;
  phones: { phone: string; label: string }[];
  accounts: AccountForm[];
  notes: string;
}

export const emptyDelivererForm = (name = ""): DelivererForm => ({ type: "person", name, phones: [{ phone: "", label: "" }], accounts: [], notes: "" });

export const toDelivererForm = (deliverer: Deliverer): DelivererForm => ({
  type: deliverer.type,
  name: deliverer.name,
  phones: deliverer.phones.length ? deliverer.phones.map((item) => ({ phone: item.phone, label: item.label ?? "" })) : [{ phone: "", label: "" }],
  accounts: toAccountForms(deliverer.accounts),
  notes: deliverer.notes ?? "",
});

export const toDelivererInput = (form: DelivererForm): DelivererInput => ({
  type: form.type,
  name: form.name.trim(),
  phones: form.phones.filter((item) => item.phone.trim()).map((item) => ({ phone: item.phone.trim(), label: item.label.trim() || null })),
  accounts: toAccountInputs(form.accounts),
  notes: form.notes.trim() || null,
});

/** What is wrong before it's sent */
export const delivererProblem = (form: DelivererForm) => {
  if (form.name.trim().length < 2) return "Enter the deliverer's name.";
  const phones = form.phones.filter((item) => item.phone.trim());
  if (!phones.length) return "Add at least one phone number.";
  if (phones.some((item) => !/^\+?\d{7,15}$/.test(item.phone.replace(/[\s\-().]/g, "")))) return "Enter phone numbers like 0911 234 567.";
  return accountsProblem(form.accounts);
};

const typeOptions: { value: DelivererType; hint: string; icon: typeof User }[] = [
  { value: "person", hint: "One person, e.g. a motorbike rider", icon: User },
  { value: "company", hint: "A delivery company with its own riders", icon: Building2 },
];

interface DelivererFieldsProps {
  value: DelivererForm;
  onChange: (change: Partial<DelivererForm>) => void;
  /** Quick create while making a sale: name and phone only */
  compact?: boolean;
}

export function DelivererFields({ value, onChange, compact }: DelivererFieldsProps) {
  const setPhone = (index: number, change: Partial<DelivererForm["phones"][number]>) =>
    onChange({ phones: value.phones.map((item, at) => (at === index ? { ...item, ...change } : item)) });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">Who is it</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {typeOptions.map((option) => (
            <label
              key={option.value}
              className={clsx(
                "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm",
                value.type === option.value ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-gray-200 bg-white hover:border-brand-300",
              )}
            >
              <input type="radio" name="deliverer-type" value={option.value} checked={value.type === option.value} onChange={() => onChange({ type: option.value })} className="sr-only" />
              <option.icon className={clsx("mt-0.5 size-4 shrink-0", value.type === option.value ? "text-brand-700" : "text-gray-400")} aria-hidden />
              <span>
                <span className="block font-medium text-gray-900">{delivererTypeLabels[option.value]}</span>
                <span className="block text-gray-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={value.type === "company" ? "Company name" : "Full name"} isRequired>
        <input
          value={value.name}
          maxLength={120}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder={value.type === "company" ? "Fast Delivery PLC" : "Abel Girma"}
          className={inputClasses}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium text-gray-700">
          Phone numbers<span className="text-red-600"> *</span>
        </legend>
        {value.phones.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={item.phone}
              maxLength={25}
              onChange={(event) => setPhone(index, { phone: event.target.value })}
              placeholder="0911 234 567"
              aria-label={`Phone ${index + 1}`}
              className={clsx(inputClasses, "flex-[3]")}
            />
            <input
              value={item.label}
              maxLength={40}
              onChange={(event) => setPhone(index, { label: event.target.value })}
              placeholder="Label: WhatsApp"
              aria-label={`Label of phone ${index + 1}`}
              className={clsx(inputClasses, "flex-[2]")}
            />
            {value.phones.length > 1 && (
              <button
                type="button"
                onClick={() => onChange({ phones: value.phones.filter((_, at) => at !== index) })}
                aria-label={`Remove phone ${index + 1}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 sm:size-10"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </div>
        ))}
        {value.phones.length < 10 && (
          <button
            type="button"
            onClick={() => onChange({ phones: [...value.phones, { phone: "", label: "" }] })}
            className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            <Plus className="size-4" aria-hidden /> Add another phone
          </button>
        )}
      </fieldset>

      {!compact && (
        <>
          <PaymentAccountsFields value={value.accounts} onChange={(accounts) => onChange({ accounts })} />
          <Field label="Notes (optional)">
            <textarea
              value={value.notes}
              maxLength={2000}
              rows={3}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Only works Bole and CMC"
              className={clsx(inputClasses, "h-auto! py-2")}
            />
          </Field>
        </>
      )}
    </div>
  );
}
