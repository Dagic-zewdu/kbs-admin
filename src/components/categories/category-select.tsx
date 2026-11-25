"use client";

import { useId, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateSelect, type CreatePanelProps } from "@/components/ui/create-select";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateCategoryMutation, useListCategoriesQuery, useSearchCategoriesQuery } from "@/store/api/categories.api";
import { categoryPath, MAX_CATEGORY_LEVELS, type Category } from "@/types/category";

interface CategorySelectProps {
  label: string;
  value: Category | null;
  onChange: (category: Category | null, isNew?: boolean) => void;
  error?: string;
}

const useCategoryOptions = (query: string, isOpen: boolean) => {
  const all = useListCategoriesQuery(undefined, { skip: !isOpen });
  const search = useSearchCategoriesQuery(query, { skip: !isOpen || !query });
  return {
    all: all.data?.data,
    found: search.data?.data,
    isFetching: search.isFetching,
    loadError: getErrorMessage(query ? search.error : all.error) || undefined,
  };
};

/** Select a shared category or create it for everyone */
export function CategorySelect(props: CategorySelectProps) {
  return (
    <CreateSelect
      {...props}
      placeholder="Type to find or create a category"
      clearLabel="Clear category"
      useOptions={useCategoryOptions}
      getText={categoryPath}
      renderItem={(category) => (
        <>
          {category.path.length > 1 && <span className="text-gray-400">{category.path.slice(0, -1).join(" › ")} › </span>}
          <span className="font-medium text-gray-900">{category.name}</span>
        </>
      )}
      createAnywayLabel={(name) => `Create “${name}” somewhere else`}
      CreatePanel={CreateCategoryPanel}
    />
  );
}

/** Where the new category goes, then create it. If it exists there already, offers to select it. */
function CreateCategoryPanel({ name, onBack, onSelect }: CreatePanelProps<Category>) {
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
      <p className="text-xs text-gray-500">Every company will be able to use it.</p>
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
