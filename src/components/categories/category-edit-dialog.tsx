"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-error";
import { useUpdateCategoryMutation } from "@/store/api/categories.api";
import { categoryPath, MAX_CATEGORY_LEVELS, type CompanyCategory } from "@/types/category";

interface CategoryEditDialogProps {
  category: CompanyCategory;
  categories: CompanyCategory[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Rename, describe or move a category this company created. Mount it only while it's open. */
export function CategoryEditDialog({ category, categories, onClose, onSaved }: CategoryEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const parentFieldId = useId();
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [parentId, setParentId] = useState(category.parentId);
  const [update, { isLoading, error }] = useUpdateCategoryMutation();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const isUnder = (item: CompanyCategory): boolean => {
    if (item.id === category.id) return true;
    const parent = categories.find((other) => other.id === item.parentId);
    return parent ? isUnder(parent) : false;
  };
  const parents = categories.filter(
    (item) => (item.isVisible || item.id === category.parentId) && item.depth < MAX_CATEGORY_LEVELS - 1 && !isUnder(item),
  );
  const close = () => {
    if (!isLoading) onClose();
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await update({ id: category.id, name: name.trim(), description: description.trim() || null, parentId });
    if (result.data) onSaved(`${categoryPath(result.data.data)} was saved.`);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-left shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[1px]"
    >
      <form onSubmit={save} className="space-y-4 p-5 sm:p-6">
        <h2 id={titleId} className="text-base font-semibold text-gray-900">
          Edit category
        </h2>
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required minLength={2} autoFocus />
        <div className="space-y-1.5">
          <label htmlFor={parentFieldId} className="block text-sm font-medium text-gray-700">
            Where it belongs
          </label>
          <select
            id={parentFieldId}
            value={parentId ?? ""}
            onChange={(event) => setParentId(event.target.value || null)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10"
          >
            <option value="">Main category</option>
            {parents.map((item) => (
              <option key={item.id} value={item.id}>
                Under {categoryPath(item)}
              </option>
            ))}
          </select>
        </div>
        <Textarea label="Description (optional)" rows={3} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
        {error && <Alert>{getErrorMessage(error)}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </dialog>
  );
}
