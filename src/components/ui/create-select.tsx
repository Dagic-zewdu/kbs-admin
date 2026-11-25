"use client";

import clsx from "clsx";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RequiredMark } from "./required-mark";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/** What the API found for the typed text */
export interface CreateSelectResults<T> {
  exact: T[];
  matches: T[];
  /** "Did you mean…?" */
  similar: T[];
}

export interface CreatePanelProps<T> {
  name: string;
  onBack: () => void;
  onSelect: (item: T, isNew?: boolean) => void;
}

interface CreateSelectProps<T> {
  label: string;
  isRequired?: boolean;
  placeholder: string;
  clearLabel: string;
  value: T | null;
  onChange: (item: T | null, isNew?: boolean) => void;
  error?: string;
  /** Shown before anything is typed, and the results of `query` (undefined while loading) */
  useOptions: (query: string, isOpen: boolean) => { all?: T[]; found?: CreateSelectResults<T>; isFetching: boolean; loadError?: string };
  getText: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  /** Offered together with an exact match, e.g. the same name under another parent. Left out = not offered. */
  createAnywayLabel?: (name: string) => string;
  CreatePanel: React.ComponentType<CreatePanelProps<T>>;
}

/**
 * Select or create: type a name, choose an existing item, or create it for everyone when it doesn't exist.
 * Similar names are suggested first ("Did you mean…?") to avoid duplicates.
 */
export function CreateSelect<T extends { id: string }>({
  label,
  isRequired,
  placeholder,
  clearLabel,
  value,
  onChange,
  error,
  useOptions,
  getText,
  renderItem,
  createAnywayLabel,
  CreatePanel,
}: CreateSelectProps<T>) {
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [active, setActive] = useState(-1);

  const typed = text.trim().replace(/\s+/g, " ");
  const query = useDebouncedValue(typed, 250);
  const result = useOptions(query, isOpen);
  // Results of what is typed now, never of the previous text
  const found = query === typed && !result.isFetching ? result.found : undefined;

  const close = useCallback(() => {
    setIsOpen(false);
    setText("");
    setCreatingName(null);
    setActive(-1);
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [close]);

  const choose = (item: T, isNew = false) => {
    onChange(item, isNew);
    close();
  };

  const listed = typed ? [...(found?.exact ?? []), ...(found?.matches ?? [])] : (result.all ?? []);
  // With an exact match there is nothing to correct
  const similar = typed && found && found.exact.length === 0 ? found.similar : [];
  const options = [...listed, ...similar];
  const canCreate = Boolean(found) && typed.length >= 2 && (found!.exact.length === 0 || Boolean(createAnywayLabel));
  const optionCount = options.length + (canCreate ? 1 : 0);
  const loadError = result.loadError;
  const isLoading = !loadError && (typed ? !found : !result.all);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") return close();
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (optionCount) setActive((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + optionCount) % optionCount);
    }
    if (event.key === "Enter") {
      event.preventDefault(); // never submits the form around it
      if (active >= 0 && active < options.length) choose(options[active]);
      else if (active === options.length && canCreate) setCreatingName(typed);
      else if (found?.exact.length === 1) choose(found.exact[0]);
    }
  };

  const renderOption = (item: T, index: number) => (
    <li
      key={item.id}
      id={`${listId}-${index}`}
      role="option"
      aria-selected={value?.id === item.id}
      onMouseEnter={() => setActive(index)}
      onClick={() => choose(item)}
      className={clsx("flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm", active === index && "bg-brand-50")}
    >
      <span className="min-w-0 flex-1">{renderItem(item)}</span>
      {value?.id === item.id && <Check className="size-4 shrink-0 text-brand-600" aria-hidden />}
    </li>
  );

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          maxLength={80}
          value={isOpen ? text : value ? getText(value) : ""}
          placeholder={isOpen && value ? getText(value) : placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            setIsOpen(true);
            setText(event.target.value);
            setCreatingName(null);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          className={clsx(
            "h-11 w-full rounded-lg border bg-white pl-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
            error ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand-500 focus:ring-brand-100",
          )}
        />
        {value && !isOpen ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => onChange(null)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {creatingName ? (
            <CreatePanel
              name={creatingName}
              onBack={() => {
                setCreatingName(null);
                inputRef.current?.focus();
              }}
              onSelect={choose}
            />
          ) : (
            <ul id={listId} role="listbox" aria-label={label} className="max-h-72 overflow-y-auto py-1">
              {isLoading && (
                <li role="presentation" className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-brand-600" aria-label="Loading" />
                </li>
              )}
              {loadError && (
                <li role="presentation" className="px-3 py-3 text-sm text-red-600">
                  {loadError}
                </li>
              )}
              {listed.map(renderOption)}
              {similar.length > 0 && (
                <li role="presentation" className="px-3 pb-1 pt-3 text-xs font-semibold text-amber-700">
                  Did you mean…?
                </li>
              )}
              {similar.map((item, index) => renderOption(item, listed.length + index))}
              {canCreate && (
                <li
                  id={`${listId}-${options.length}`}
                  role="option"
                  aria-selected={false}
                  onMouseEnter={() => setActive(options.length)}
                  onClick={() => setCreatingName(typed)}
                  className={clsx(
                    "flex min-h-11 cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm font-medium text-brand-700",
                    active === options.length && "bg-brand-50",
                  )}
                >
                  <Plus className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words">
                    {found!.exact.length ? createAnywayLabel?.(typed) : `Create “${typed}”`}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
