"use client";

import clsx from "clsx";
import { FolderTree, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ItemActions } from "@/components/shared-items/item-actions";
import { ActiveBadge, CreatedByBadge } from "@/components/shared-items/ownership";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useListManagedCategoriesQuery } from "@/store/api/categories.api";
import { categoryPath, type Category, type CompanyCategory } from "@/types/category";
import { CategoryEditDialog } from "./category-edit-dialog";
import { CategorySelect } from "./category-select";

/** The shared categories. Find or create one; change the ones this company created. */
export function CategoriesView() {
  const { data, isLoading, error } = useListManagedCategoriesQuery();
  const [selected, setSelected] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | "us">("all");
  const [editing, setEditing] = useState<CompanyCategory | null>(null);
  const categories = data?.data ?? [];
  // Ours together with the categories above them, so the tree stays readable
  const shown =
    filter === "all" ? categories : categories.filter((category) => categories.some((item) => item.createdBy === "us" && isAtOrAbove(category, item)));

  function isAtOrAbove(category: CompanyCategory, item: CompanyCategory): boolean {
    if (category.id === item.id) return true;
    const parent = categories.find((other) => other.id === item.parentId);
    return parent ? isAtOrAbove(category, parent) : false;
  }

  // Show the chosen category in the list below
  useEffect(() => {
    if (selected) document.getElementById(`category-${selected.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected, data]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Categories" description="Shared by every company. You can change the categories you created." />

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <CategorySelect
          label="Find or create a category"
          value={selected}
          onChange={(category, isNew) => {
            setSelected(category);
            setNotice(category && isNew ? `${categoryPath(category)} was created. Every company can use it now.` : "");
          }}
        />
      </section>

      {notice && <Alert type="success">{notice}</Alert>}

      <select
        aria-label="Filter by who created it"
        value={filter}
        onChange={(event) => setFilter(event.target.value as typeof filter)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-56"
      >
        <option value="all">All categories</option>
        <option value="us">Created by you</option>
      </select>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading && <Loader2 className="mx-auto my-16 size-6 animate-spin text-brand-600" aria-label="Loading" />}
        {error && <p className="px-4 py-10 text-center text-sm text-red-600">{getErrorMessage(error)}</p>}
        {data && shown.length === 0 && (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <FolderTree className="size-8 text-brand-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">
              {filter === "us" ? "You haven't created any categories" : "No categories yet"}
            </p>
          </div>
        )}
        {shown.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Created by</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((category) => (
                  <tr
                    key={category.id}
                    id={`category-${category.id}`}
                    className={clsx(category.depth === 0 && "bg-gray-50", selected?.id === category.id && "bg-brand-50")}
                  >
                    <td className="px-4 py-2" style={{ paddingLeft: `${1 + category.depth * 1.25}rem` }}>
                      <span className={clsx("break-words", category.depth === 0 ? "font-semibold text-gray-900" : "text-gray-800", !category.isVisible && "text-gray-400")}>
                        {category.name}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
                        <CreatedByBadge createdBy={category.createdBy} />
                        {!category.isActive && <ActiveBadge isActive={false} />}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <CreatedByBadge createdBy={category.createdBy} />
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <ActiveBadge isActive={category.isActive} />
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex justify-end">
                        <ItemActions kind="category" item={category} onEdit={() => setEditing(category)} onDone={setNotice} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <CategoryEditDialog
          category={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
