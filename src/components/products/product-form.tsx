"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandSelect } from "@/components/brands/brand-select";
import { CategorySelect } from "@/components/categories/category-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-error";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useListCategoryFieldsQuery,
  useUpdateProductMutation,
} from "@/store/api/products.api";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { AttributeValue, CategoryField, Product, ProductPhoto, VariationType } from "@/types/product";
import { PhotoManager } from "./photo-manager";
import { missingLabels } from "./product-labels";
import { emptyVariation, VariationEditor, type VariationRow } from "./variation-editor";

const toForm = (product?: Product) => ({
  name: product?.name ?? "",
  brand: (product?.brand ?? null) as Brand | null,
  category: (product?.category ?? null) as Category | null,
  countryOfOrigin: product?.countryOfOrigin ?? "",
  efdaNumber: product?.efdaNumber ?? "",
  shortDescription: product?.shortDescription ?? "",
  description: product?.description ?? "",
  howToUse: product?.howToUse ?? "",
  warnings: product?.warnings ?? "",
  attributes: (product?.attributes ?? {}) as Record<string, AttributeValue>,
  variationType: (product?.variationType ?? "none") as VariationType,
  variations: (product?.variations.map((variation) => ({
    key: variation.id,
    id: variation.id,
    name: variation.name,
    sizeValue: variation.sizeValue === null ? "" : String(variation.sizeValue),
    sizeUnit: variation.sizeUnit ?? "ml",
    shadeHex: variation.shadeHex ?? "",
    barcode: variation.barcode ?? "",
  })) ?? [emptyVariation()]) as VariationRow[],
  photos: (product?.photos ?? []) as ProductPhoto[],
});

type FormState = ReturnType<typeof toForm>;

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Create or edit a product. Saved as a draft; only the name is required. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [create, createState] = useCreateProductMutation();
  const [update, updateState] = useUpdateProductMutation();
  const [remove, removeState] = useDeleteProductMutation();
  const isSaving = createState.isLoading || updateState.isLoading;
  const error = createState.error || updateState.error;

  const change = (values: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...values }));
    setIsDirty(true);
    setNotice("");
  };
  const field = (key: "name" | "countryOfOrigin" | "efdaNumber" | "shortDescription" | "description" | "howToUse" | "warnings") => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change({ [key]: event.target.value }),
  });

  // Ask before closing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    const badSize = form.variations.find((row) => row.sizeValue && !(Number(row.sizeValue) > 0));
    if (badSize) return setLocalError(`“${badSize.sizeValue}” is not a valid size.`);
    setLocalError("");

    const body = {
      name: form.name,
      brandId: form.brand?.id ?? null,
      categoryId: form.category?.id ?? null,
      countryOfOrigin: form.countryOfOrigin,
      efdaNumber: form.efdaNumber,
      shortDescription: form.shortDescription,
      description: form.description,
      howToUse: form.howToUse,
      warnings: form.warnings,
      attributes: form.attributes,
      variationType: form.variationType,
      variations: form.variations.map((row) => ({
        id: row.id,
        name: row.name,
        sizeValue: row.sizeValue ? Number(row.sizeValue) : null,
        sizeUnit: row.sizeValue ? row.sizeUnit : null,
        shadeHex: row.shadeHex || null,
        barcode: row.barcode.trim() || null,
      })),
      photoFileIds: form.photos.map((photo) => photo.fileId),
    };

    if (product) {
      const result = await update({ id: product.id, ...body });
      if (!result.data) return;
      // New variations now have ids, and sizes their names
      setForm(toForm(result.data.data));
      setIsDirty(false);
      setNotice("Saved.");
    } else {
      const result = await create(body);
      if (!result.data) return;
      setIsDirty(false);
      router.replace(`/products/${result.data.data.id}?created=1`);
    }
  };

  const missing = product?.missingToGoLive ?? [];

  return (
    <>
      <form onSubmit={save} className="space-y-5">
        {product && missing.length > 0 && !isDirty && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <span className="font-medium">Still needed to go live:</span> {missing.map((item) => missingLabels[item] ?? item).join(", ")}.
          </div>
        )}

        <Section title="Basics" description="Only the name is needed to save a draft.">
          <Input label="Product name" placeholder="Low pH Good Morning Gel Cleanser" required minLength={2} maxLength={200} {...field("name")} />
          <div className="grid gap-4 md:grid-cols-2">
            <BrandSelect label="Brand" value={form.brand} onChange={(brand) => change({ brand })} />
            <CategorySelect label="Category" value={form.category} onChange={(category) => change({ category, attributes: {} })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Country of origin (optional)" placeholder="South Korea" maxLength={100} {...field("countryOfOrigin")} />
            <Input label="EFDA number (optional)" maxLength={100} {...field("efdaNumber")} />
          </div>
          {form.category && (
            <ExtraFields categoryId={form.category.id} values={form.attributes} onChange={(attributes) => change({ attributes })} />
          )}
        </Section>

        <Section title="Photos" description="Front, back and texture. The first photo is the main one.">
          <PhotoManager
            photos={form.photos}
            onChange={(updatePhotos) => {
              setForm((current) => ({ ...current, photos: updatePhotos(current.photos) }));
              setIsDirty(true);
              setNotice("");
            }}
            onUploading={setIsUploading}
          />
        </Section>

        <Section title="Variations" description="Each version the customer can buy has its own barcode, and later its own price and stock.">
          <VariationEditor
            type={form.variationType}
            rows={form.variations}
            onChange={(variationType, variations) => change({ variationType, variations })}
          />
        </Section>

        <Section title="Description" description="What the customer reads.">
          <Textarea label="Short description" rows={2} placeholder="One or two lines for the product card" maxLength={300} {...field("shortDescription")} />
          <Textarea label="Full description" rows={6} maxLength={10000} {...field("description")} />
          <Textarea label="How to use (optional)" rows={3} maxLength={3000} {...field("howToUse")} />
          <Textarea label="Warnings (optional)" rows={2} placeholder="For external use only" maxLength={2000} {...field("warnings")} />
        </Section>

        {(localError || error) && <Alert>{localError || getErrorMessage(error)}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}

        <div className="flex flex-col-reverse gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          {product?.status === "draft" ? (
            <Button type="button" variant="ghost" onClick={() => setIsDeleting(true)} className="text-red-700 hover:bg-red-50">
              <Trash2 className="size-4" aria-hidden /> Delete draft
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => router.push("/products")}>
              {isDirty ? "Cancel" : "Back to products"}
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={isUploading}>
              {product ? "Save changes" : "Save draft"}
            </Button>
          </div>
        </div>

      </form>

        {/* Outside the form: the dialog has its own form */}
        {product && (
          <DeleteDialog
            open={isDeleting}
            name={product.name}
            isLoading={removeState.isLoading}
            error={getErrorMessage(removeState.error)}
            onCancel={() => setIsDeleting(false)}
            onConfirm={async () => {
              const result = await remove(product.id);
              if (!("error" in result) || !result.error) router.replace(`/products?deleted=${encodeURIComponent(product.name)}`);
            }}
          />
        )}
    </>
  );
}

function DeleteDialog(props: {
  open: boolean;
  name: string;
  isLoading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={props.open}
      tone="danger"
      title={`Delete ${props.name}?`}
      description="The draft and its photos and variations are removed. This can't be undone."
      confirmLabel="Delete draft"
      isLoading={props.isLoading}
      error={props.error || undefined}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
    />
  );
}

/** Fields that depend on the category, e.g. SPF for sunscreens */
function ExtraFields({
  categoryId,
  values,
  onChange,
}: {
  categoryId: string;
  values: Record<string, AttributeValue>;
  onChange: (values: Record<string, AttributeValue>) => void;
}) {
  const { data } = useListCategoryFieldsQuery(categoryId);
  const fields = data?.data ?? [];
  if (!fields.length) return null;

  const set = (key: string, value: AttributeValue | "") => {
    const next = { ...values };
    if (value === "") delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <div className="grid gap-4 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 sm:p-4">
      {fields.map((item) => (
        <ExtraField key={item.key} field={item} value={values[item.key]} onChange={(value) => set(item.key, value)} />
      ))}
    </div>
  );
}

function ExtraField({
  field,
  value,
  onChange,
}: {
  field: CategoryField;
  value: AttributeValue | undefined;
  onChange: (value: AttributeValue | "") => void;
}) {
  const label = `${field.label}${field.unit ? ` (${field.unit})` : ""}`;
  if (field.type === "number" || field.type === "text") {
    return (
      <Input
        label={label}
        type={field.type === "number" ? "number" : "text"}
        min={0}
        step="any"
        maxLength={200}
        value={value === undefined ? "" : String(value)}
        onChange={(event) => {
          const text = event.target.value;
          onChange(field.type === "number" && text !== "" ? Number(text) : text);
        }}
      />
    );
  }
  const options = field.type === "boolean" ? ["Yes", "No"] : field.options;
  const current = typeof value === "boolean" ? (value ? "Yes" : "No") : (value ?? "");
  return (
    <label className="space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select
        value={String(current)}
        onChange={(event) => onChange(field.type === "boolean" && event.target.value ? event.target.value === "Yes" : event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10"
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
