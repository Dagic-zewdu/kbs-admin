"use client";

import clsx from "clsx";
import { Globe2, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Field, inputClasses } from "@/components/inventory/field";
import { accountsProblem, PaymentAccountsFields, toAccountForms, toAccountInputs, type AccountForm } from "@/components/payment-accounts/payment-accounts-fields";
import type { Supplier, SupplierInput, SupplierVisibility } from "@/types/supplier";

/** A supplier while typing */
export interface SupplierForm {
  name: string;
  phones: { phone: string; label: string }[];
  accounts: AccountForm[];
  country: string;
  contactPerson: string;
  email: string;
  address: string;
  notes: string;
  visibility: SupplierVisibility;
}

export const emptySupplierForm = (name = ""): SupplierForm => ({
  name,
  phones: [{ phone: "", label: "" }],
  accounts: [],
  country: "Ethiopia",
  contactPerson: "",
  email: "",
  address: "",
  notes: "",
  visibility: "private",
});

export const toSupplierForm = (supplier: Supplier): SupplierForm => ({
  name: supplier.name,
  phones: supplier.phones.length ? supplier.phones.map((item) => ({ phone: item.phone, label: item.label ?? "" })) : [{ phone: "", label: "" }],
  accounts: toAccountForms(supplier.accounts),
  country: supplier.country,
  contactPerson: supplier.contactPerson ?? "",
  email: supplier.email ?? "",
  address: supplier.address ?? "",
  notes: supplier.notes ?? "",
  visibility: supplier.visibility,
});

export const toSupplierInput = (form: SupplierForm): SupplierInput => ({
  name: form.name.trim(),
  phones: form.phones.filter((item) => item.phone.trim()).map((item) => ({ phone: item.phone.trim(), label: item.label.trim() || null })),
  accounts: toAccountInputs(form.accounts),
  country: form.country.trim(),
  contactPerson: form.contactPerson.trim() || null,
  email: form.email.trim() || null,
  address: form.address.trim() || null,
  notes: form.notes.trim() || null,
  visibility: form.visibility,
});

/** What is wrong before it's sent */
export const supplierProblem = (form: SupplierForm) => {
  if (form.name.trim().length < 2) return "Enter the supplier name.";
  const phones = form.phones.filter((item) => item.phone.trim());
  if (!phones.length) return "Add at least one phone number.";
  if (phones.some((item) => !/^\+?\d{7,15}$/.test(item.phone.replace(/[\s\-().]/g, "")))) return "Enter phone numbers like +251 911 234 567.";
  if (form.country.trim().length < 2) return "Enter the country.";
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email.";
  return accountsProblem(form.accounts);
};

const COUNTRIES = ["Ethiopia", "South Korea", "China", "United Arab Emirates", "Turkey", "India", "Kenya", "Japan", "France", "United States", "United Kingdom", "Italy"];

const visibilityOptions: { value: SupplierVisibility; label: string; hint: string; icon: typeof Lock }[] = [
  { value: "private", label: "Private", hint: "Only your company sees it", icon: Lock },
  { value: "shared", label: "Shared", hint: "Other companies can find and use it. Your notes and payments stay private", icon: Globe2 },
];

interface SupplierFieldsProps {
  value: SupplierForm;
  onChange: (change: Partial<SupplierForm>) => void;
  /** Quick create while adding stock: the rest under "More details" */
  compact?: boolean;
}

export function SupplierFields({ value, onChange, compact }: SupplierFieldsProps) {
  const [showMore, setShowMore] = useState(!compact);
  const setPhone = (index: number, change: Partial<SupplierForm["phones"][number]>) =>
    onChange({ phones: value.phones.map((item, at) => (at === index ? { ...item, ...change } : item)) });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Supplier name" isRequired>
          <input value={value.name} maxLength={120} onChange={(event) => onChange({ name: event.target.value })} placeholder="Addis Beauty Import" className={inputClasses} />
        </Field>
        <Field label="Country" isRequired>
          <input value={value.country} maxLength={100} list="supplier-countries" onChange={(event) => onChange({ country: event.target.value })} className={inputClasses} />
          <datalist id="supplier-countries">
            {COUNTRIES.map((country) => (
              <option key={country} value={country} />
            ))}
          </datalist>
        </Field>
      </div>

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
              placeholder="+251 911 234 567"
              aria-label={`Phone ${index + 1}`}
              className={clsx(inputClasses, "flex-[3]")}
            />
            <input
              value={item.label}
              maxLength={40}
              onChange={(event) => setPhone(index, { label: event.target.value })}
              placeholder="Label: Sales, WhatsApp"
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

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">Who can see it</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {visibilityOptions.map((option) => (
            <label
              key={option.value}
              className={clsx(
                "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm",
                value.visibility === option.value ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-gray-200 bg-white hover:border-brand-300",
              )}
            >
              <input
                type="radio"
                name="supplier-visibility"
                value={option.value}
                checked={value.visibility === option.value}
                onChange={() => onChange({ visibility: option.value })}
                className="sr-only"
              />
              <option.icon className={clsx("mt-0.5 size-4 shrink-0", value.visibility === option.value ? "text-brand-700" : "text-gray-400")} aria-hidden />
              <span>
                <span className="block font-medium text-gray-900">{option.label}</span>
                <span className="block text-gray-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {showMore ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact person (optional)">
            <input value={value.contactPerson} maxLength={120} onChange={(event) => onChange({ contactPerson: event.target.value })} placeholder="Hana Tesfaye" className={inputClasses} />
          </Field>
          <Field label="Email (optional)">
            <input type="email" value={value.email} maxLength={255} onChange={(event) => onChange({ email: event.target.value })} placeholder="sales@example.com" className={inputClasses} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address (optional)">
              <input value={value.address} maxLength={300} onChange={(event) => onChange({ address: event.target.value })} placeholder="Bole, Addis Ababa" className={inputClasses} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <PaymentAccountsFields value={value.accounts} onChange={(accounts) => onChange({ accounts })} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes (optional, only your company sees them)">
              <textarea
                value={value.notes}
                maxLength={2000}
                rows={3}
                onChange={(event) => onChange({ notes: event.target.value })}
                placeholder="Gives 30 days credit"
                className={clsx(inputClasses, "h-auto! py-2")}
              />
            </Field>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowMore(true)} className="min-h-9 text-sm font-medium text-brand-700 hover:underline">
          More details: contact person, email, address, payment accounts, notes
        </button>
      )}
    </div>
  );
}
