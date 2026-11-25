"use client";

import clsx from "clsx";
import { FolderTree, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useListCategoriesQuery } from "@/store/api/categories.api";
import { categoryPath, type Category } from "@/types/category";
import { CategorySelect } from "./category-select";

/** The shared categories. Find one, or create it when it doesn't exist. */
export function CategoriesView() {
  const { data, isLoading, error } = useListCategoriesQuery();
  const [selected, setSelected] = useState<Category | null>(null);
  const [createdPath, setCreatedPath] = useState("");
  const categories = data?.data ?? [];
  const mainCategories = categories.filter((category) => !category.parentId);

  // Show the chosen category in the list below
  useEffect(() => {
    if (selected) document.getElementById(`category-${selected.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected, data]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Categories" description="Shared by every company. Use an existing category, or create one when it's missing." />

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <CategorySelect
          label="Find or create a category"
          value={selected}
          onChange={(category, isNew) => {
            setSelected(category);
            setCreatedPath(category && isNew ? categoryPath(category) : "");
          }}
        />
        {createdPath && (
          <div className="mt-3">
            <Alert type="success">{createdPath} was created. Every company can use it now.</Alert>
          </div>
        )}
      </section>

      {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {data && categories.length === 0 && (
        <div className="flex flex-col items-center py-14 text-center">
          <FolderTree className="size-8 text-brand-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-800">No categories yet</p>
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mainCategories.map((main) => (
          <section key={main.id} className="rounded-xl border border-gray-200 bg-white p-2">
            <CategoryRow category={main} selectedId={selected?.id} />
            <ul>
              {categories
                .filter((category) => category.parentId && category.path[0] === main.name)
                .map((category) => (
                  <li key={category.id}>
                    <CategoryRow category={category} selectedId={selected?.id} />
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ category, selectedId }: { category: Category; selectedId?: string }) {
  return (
    <div
      id={`category-${category.id}`}
      style={{ paddingLeft: `${0.5 + category.depth}rem` }}
      className={clsx(
        "break-words rounded-lg py-1.5 pr-2 text-sm",
        category.depth === 0 ? "font-semibold text-gray-900" : "text-gray-700",
        selectedId === category.id && "bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-200",
      )}
    >
      {category.name}
    </div>
  );
}
