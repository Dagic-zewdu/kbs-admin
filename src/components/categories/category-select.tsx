"use client";

import clsx from "clsx";
import { Check, ChevronDown, FolderPlus, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateCategoryMutation, useListCategoriesQuery, useSearchCategoriesQuery } from "@/store/api/categories.api";
import { categoryPath, MAX_CATEGORY_LEVELS, type Category } from "@/types/category";

interface CategorySelectProps {
  label: string;
  value: Category | null;
  onChange: (category: Category | null, isNew?: boolean) => void;
  error?: string;
}

/**
 * Select or create: type a name, choose an existing category, or create it for everyone when it doesn't exist.
 * Similar names are suggested first ("Did you mean Hair care?") to avoid duplicates.
 */
export function CategorySelect({ label, value, onChange, error }: CategorySelectProps) {
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
  const all = useListCategoriesQuery(undefined, { skip: !isOpen });
  const search = useSearchCategoriesQuery(query, { skip: !isOpen || !query });
  // Results of what is typed now, never of the previous text
  const found = query === typed && !search.isFetching ? search.data?.data : undefined;

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

  const choose = (category: Category, isNew = false) => {
    onChange(category, isNew);
    close();
  };

  const listed = typed ? [...(found?.exact ?? []), ...(found?.matches ?? [])] : (all.data?.data ?? []);
  // With an exact match there is nothing to correct
  const similar = typed && found && found.exact.length === 0 ? found.similar : [];
  const options = [...listed, ...similar];
  const canCreate = Boolean(found) && typed.length >= 2;
  const optionCount = options.length + (canCreate ? 1 : 0);
  const isLoading = typed ? !found && !search.error : all.isLoading;
  const loadError = typed ? search.error : all.error;

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

  const renderOption = (category: Category, index: number) => (
    <li
      key={category.id}
      id={`${listId}-${index}`}
      role="option"
      aria-selected={value?.id === category.id}
      onMouseEnter={() => setActive(index)}
      onClick={() => choose(category)}
      className={clsx("flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm", active === index && "bg-brand-50")}
    >
      <span className="min-w-0 flex-1">
        {category.path.length > 1 && <span className="text-gray-400">{category.path.slice(0, -1).join(" › ")} › </span>}
        <span className="font-medium text-gray-900">{category.name}</span>
      </span>
      {value?.id === category.id && <Check className="size-4 shrink-0 text-brand-600" aria-hidden />}
    </li>
  );

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
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
          value={isOpen ? text : value ? categoryPath(value) : ""}
          placeholder={isOpen && value ? categoryPath(value) : "Type to find or create a category"}
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
            aria-label="Clear category"
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
            <CreateCategoryPanel
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
                  {getErrorMessage(loadError)}
                </li>
              )}
              {listed.map(renderOption)}
              {similar.length > 0 && (
                <li role="presentation" className="px-3 pb-1 pt-3 text-xs font-semibold text-amber-700">
                  Did you mean…?
                </li>
              )}
              {similar.map((category, index) => renderOption(category, listed.length + index))}
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
                  <FolderPlus className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words">
                    {found!.exact.length ? `Create “${typed}” somewhere else` : `Create “${typed}”`}
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

/** Where the new category goes, then create it. If it exists there already, offers to select it. */
function CreateCategoryPanel({
  name,
  onBack,
  onSelect,
}: {
  name: string;
  onBack: () => void;
  onSelect: (category: Category, isNew?: boolean) => void;
}) {
  const parentFieldId = useId();
  const { data } = useListCategoriesQuery();
  // "" = not chosen yet, "main" = main category
  const [parent, setParent] = useState("");
  const [createCategory, { isLoading, error }] = useCreateCategoryMutation();

  const parents = (data?.data ?? []).filter((category) => category.depth < MAX_CATEGORY_LEVELS - 1);
  const errorBody = error && "data" in error ? (error.data as { code?: string; error?: Category }) : undefined;
  const existing = errorBody?.code === "CATEGORY_EXISTS" ? errorBody.error : undefined;

  const create = async () => {
    const result = await createCategory({ name, parentId: parent === "main" ? null : parent });
    if (result.data) onSelect(result.data.data, true);
  };

  return (
    <div className="space-y-3 p-3">
      <p className="break-words text-sm font-semibold text-gray-900">Create “{name}”</p>
      <div className="space-y-1.5">
        <label htmlFor={parentFieldId} className="block text-sm text-gray-700">
          Where does it belong?
        </label>
        <select
          id={parentFieldId}
          autoFocus
          value={parent}
          onChange={(event) => setParent(event.target.value)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            Choose…
          </option>
          <option value="main">New main category</option>
          {parents.map((category) => (
            <option key={category.id} value={category.id}>
              Under {categoryPath(category)}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-500">Every company will be able to use it. Only the platform can rename or remove it later.</p>
      {error && (
        <Alert>
          {getErrorMessage(error)}
          {existing && (
            <button type="button" onClick={() => onSelect(existing)} className="ml-1 font-semibold underline">
              Select it
            </button>
          )}
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={create} disabled={!parent} isLoading={isLoading}>
          Create category
        </Button>
      </div>
    </div>
  );
}
