"use client";

import clsx from "clsx";
import { Bike, Loader2, Phone, Plus, Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { FormDialog } from "@/components/inventory/form-dialog";
import { RequiredMark } from "@/components/ui/required-mark";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateDelivererMutation, useSearchDeliverersQuery } from "@/store/api/deliverers.api";
import type { Deliverer } from "@/types/deliverer";
import { DelivererFields, delivererProblem, emptyDelivererForm, toDelivererInput, type DelivererForm } from "./deliverer-fields";

interface DelivererSelectProps {
  value: Deliverer | null;
  onChange: (deliverer: Deliverer | null) => void;
}

/** Choose who delivers a sale (active deliverers), or add one right here */
export function DelivererSelect({ value, onChange }: DelivererSelectProps) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const query = useDebouncedValue(text.trim(), 250);
  const { currentData, isFetching } = useSearchDeliverersQuery(query, { skip: !isOpen || Boolean(value) });
  const found = currentData?.data ?? [];
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const choose = (deliverer: Deliverer) => {
    onChange(deliverer);
    setText("");
    setIsOpen(false);
  };

  if (value) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700">
          Deliverer
          <RequiredMark />
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Bike className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-medium text-gray-900">{value.name}</span>
            <span className="block truncate text-gray-500">
              {[value.phones[0]?.phone, value.type === "company" && "Delivery company"].filter(Boolean).join(" · ")}
            </span>
          </span>
          <button type="button" onClick={() => onChange(null)} className="min-h-9 shrink-0 rounded-lg px-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative space-y-1.5"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setIsOpen(false);
      }}
    >
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        Deliverer
        <RequiredMark />
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          autoComplete="off"
          value={text}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setText(event.target.value);
            setIsOpen(true);
          }}
          placeholder="Type a name or phone"
          className="h-11 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-9 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none sm:h-10"
        />
        {text && (
          <button type="button" onClick={() => setText("")} aria-label="Clear" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {isOpen && (
        <div id={listId} role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {isFetching && !found.length && (
            <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Searching
            </p>
          )}
          {!isFetching && !found.length && <p className="px-3 py-2.5 text-sm text-gray-500">{query ? "No deliverer found." : "No active deliverers yet."}</p>}
          {found.map((deliverer) => (
            <button
              key={deliverer.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => choose(deliverer)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50 focus:bg-brand-50 focus:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900">{deliverer.name}</span>
                <span className="flex items-center gap-1 truncate text-gray-500">
                  <Phone className="size-3" aria-hidden /> {deliverer.phones.map((item) => item.phone).join(", ")}
                </span>
              </span>
              {deliverer.type === "company" && <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">Company</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCreating(text.trim());
              setIsOpen(false);
            }}
            className={clsx("flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50 focus:bg-brand-50 focus:outline-none", found.length > 0 && "border-t border-gray-100")}
          >
            <Plus className="size-4" aria-hidden /> {text.trim() ? `Add deliverer “${text.trim()}”` : "Add a new deliverer"}
          </button>
        </div>
      )}
      {creating !== null && (
        <CreateDelivererDialog
          name={creating}
          onClose={() => setCreating(null)}
          onCreated={(deliverer) => {
            setCreating(null);
            choose(deliverer);
          }}
        />
      )}
    </div>
  );
}

/** A new deliverer without leaving the sale: name and phone; accounts can be added later */
function CreateDelivererDialog({ name, onClose, onCreated }: { name: string; onClose: () => void; onCreated: (deliverer: Deliverer) => void }) {
  const [form, setForm] = useState<DelivererForm>(() => emptyDelivererForm(name));
  const [localError, setLocalError] = useState("");
  const [create, { isLoading, error }] = useCreateDelivererMutation();

  const submit = async () => {
    const problem = delivererProblem(form);
    if (problem) return setLocalError(problem);
    setLocalError("");
    const result = await create(toDelivererInput(form));
    if (result.data) onCreated(result.data.data);
  };

  return (
    <FormDialog title="New deliverer" submitLabel="Add deliverer" isLoading={isLoading} error={localError || getErrorMessage(error)} onSubmit={submit} onClose={onClose}>
      <DelivererFields
        compact
        value={form}
        onChange={(change) => {
          setForm((current) => ({ ...current, ...change }));
          setLocalError("");
        }}
      />
    </FormDialog>
  );
}
