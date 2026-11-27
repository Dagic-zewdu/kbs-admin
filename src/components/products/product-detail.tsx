"use client";

import clsx from "clsx";
import { Boxes, CircleAlert, Check, Expand, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ZoomImage } from "@/components/photos/zoom-image";
import { FadeImage } from "@/components/ui/fade-image";
import { formatDate, formatDay, formatPrice } from "@/lib/labels";
import { customerPrice, profitOf } from "@/lib/pricing";
import { useGetAdvisorOptionsQuery, useListCategoryFieldsQuery } from "@/store/api/products.api";
import { useGetSettingsQuery } from "@/store/api/settings.api";
import type { AdvisorOptions, Option } from "@/types/advisor";
import type { AttributeValue, Product, ProductVariation } from "@/types/product";
import { missingLabels } from "./product-labels";

/** Edit step that fills each missing thing */
const stepOfMissing: Record<string, string> = {
  brand: "basics",
  category: "basics",
  barcode: "variations",
  photo: "photos",
  cost: "variations",
  price: "variations",
  stock: "variations",
  shortDescription: "description",
  description: "description",
};

const variationTypeLabels: Record<Product["variationType"], string> = {
  none: "One version",
  size: "Size",
  shade: "Shade",
  scent: "Scent",
  pack: "Pack",
};

const EMPTY = "—";

type Value = React.ReactNode | string | number | null | undefined;
const isEmpty = (value: Value) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

/** One label and its value; "—" when empty */
function Item({ label, value, wide }: { label: string; value: Value; wide?: boolean }) {
  return (
    <div className={clsx("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className={clsx("mt-0.5 text-sm break-words whitespace-pre-wrap", isEmpty(value) ? "text-gray-400" : "text-gray-900")}>{isEmpty(value) ? EMPTY : value}</dd>
    </div>
  );
}

/** Several values as small chips */
function Chips({ values }: { values: string[] }) {
  if (!values.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          {value}
        </span>
      ))}
    </span>
  );
}

function Card({ title, id, editStep, productId, children }: { title: string; id: string; editStep?: string; productId: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <h2 id={`${id}-title`} className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        {editStep && (
          <Link href={`/products/${productId}/edit?step=${editStep}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            <Pencil className="size-3.5" aria-hidden /> Edit
          </Link>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

const grid = "grid gap-x-6 gap-y-4 sm:grid-cols-2";

/** Chips, or nothing so the label shows "—" */
const chips = (values: string[]) => (values.length ? <Chips values={values} /> : null);

/** Option names from the API, for a value or a list of values */
const namer = (options: Option[] | undefined) => {
  const names = new Map((options ?? []).map((option) => [option.value, option.label]));
  return {
    one: (value: string | null) => (value ? (names.get(value) ?? value) : null),
    many: (values: string[]) => values.map((value) => names.get(value) ?? value),
  };
};

const attributeText = (value: AttributeValue) => (typeof value === "boolean" ? (value ? "Yes" : "No") : String(value));

const variationName = (variation: ProductVariation) =>
  [variation.name, variation.sizeValue !== null ? `${variation.sizeValue} ${variation.sizeUnit ?? ""}`.trim() : null].filter(Boolean).join(" · ") || "One version";

/** Everything about a product, read only. Editing is on /products/{id}/edit. */
export function ProductDetail({ product }: { product: Product }) {
  const options = useGetAdvisorOptionsQuery().data?.data;
  const settings = useGetSettingsQuery().data?.data;
  const fields = useListCategoryFieldsQuery(product.category?.id ?? "", { skip: !product.category }).data?.data ?? [];
  const [shown, setShown] = useState(0);
  const [isLarge, setIsLarge] = useState(false);
  const photo = product.photos[shown] ?? product.photos[0];
  const advisor = product.advisor;
  const name = (key: keyof AdvisorOptions) => namer(options?.[key]);
  const extraKeys = Object.keys(product.attributes ?? {});
  const unknownKeys = extraKeys.filter((key) => !fields.some((field) => field.key === key));

  return (
    <div className="space-y-5">
      {product.missingToGoLive.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert className="size-4 shrink-0" aria-hidden /> Still needed to go live
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {product.missingToGoLive.map((item) => (
              <li key={item}>
                <Link
                  href={`/products/${product.id}/edit?step=${stepOfMissing[item] ?? "review"}`}
                  className="inline-flex min-h-8 items-center rounded-full border border-amber-300 bg-white px-3 font-medium first-letter:uppercase hover:bg-amber-100"
                >
                  {missingLabels[item] ?? item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <Check className="size-4 shrink-0" aria-hidden />
          {product.status === "live" ? "It's live on the website." : "Everything needed to go live is there."}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title="Photos" id="photos" editStep="photos" productId={product.id}>
          {photo ? (
            <div className="space-y-3">
              <div className="aspect-square w-full rounded-lg border border-gray-100 bg-white p-1">
                <ZoomImage key={photo.url} src={photo.url} alt={product.name} wheelZoom={false} />
              </div>
              {product.photos.length > 1 && (
                <ul className="flex flex-wrap gap-2">
                  {product.photos.map((item, index) => (
                    <li key={item.fileId}>
                      <button
                        type="button"
                        onClick={() => setShown(index)}
                        aria-label={`Show photo ${index + 1}`}
                        aria-pressed={index === shown}
                        className={clsx("block rounded-lg border-2", index === shown ? "border-brand-500" : "border-transparent hover:border-gray-300")}
                      >
                        <FadeImage src={item.url} className="size-14 rounded-md bg-white" imageClassName="object-contain" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Photo {shown + 1} of {product.photos.length}
                  {shown === 0 && " · main photo"} · point at it to magnify
                </p>
                <button
                  type="button"
                  onClick={() => setIsLarge(true)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Expand className="size-4" aria-hidden /> View large
                </button>
              </div>
              {isLarge && <LargePhoto src={photo.url} label={`${product.name} · photo ${shown + 1}`} onClose={() => setIsLarge(false)} />}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No photos yet.</p>
          )}
        </Card>

        <Card title="Basics" id="basics" editStep="basics" productId={product.id}>
          <dl className={grid}>
            <Item label="Product name" value={product.name} wide />
            <Item label="Brand" value={product.brand?.name} />
            <Item label="Category" value={product.category?.path.join(" › ")} />
            <Item label="Country of origin" value={product.countryOfOrigin} />
            <Item label="EFDA number" value={product.efdaNumber} />
            {fields.map((field) => (
              <Item
                key={field.key}
                label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}
                value={product.attributes[field.key] === undefined ? null : attributeText(product.attributes[field.key])}
              />
            ))}
            {unknownKeys.map((key) => (
              <Item key={key} label={key} value={attributeText(product.attributes[key])} />
            ))}
            <Item label="Options" value={`${variationTypeLabels[product.variationType]}${product.variationType === "none" ? "" : ` · ${product.variations.length} variations`}`} />
            <Item label="Added" value={formatDate(product.createdAt)} />
            <Item label="Last changed" value={formatDate(product.updatedAt)} />
          </dl>
        </Card>
      </div>

      <Card title="Price and stock" id="variations" editStep="variations" productId={product.id}>
        <div className="space-y-4">
          {product.variations.map((variation) => {
            const profit = variation.price !== null && variation.costPrice !== null ? profitOf(variation.price, variation.costPrice) : null;
            return (
              <div key={variation.id} className="rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-medium text-gray-900">
                    {variation.shadeHex && <span className="size-4 rounded-full border border-gray-300" style={{ backgroundColor: variation.shadeHex }} aria-hidden />}
                    {variationName(variation)}
                  </p>
                  <Link href={`/inventory/${variation.id}`} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                    <Boxes className="size-4" aria-hidden /> Batches, suppliers and history
                  </Link>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                  <Item label="SKU" value={variation.sku} />
                  <Item label="Main barcode" value={variation.barcode} />
                  <Item label="Other barcodes" value={variation.barcodes.filter((item) => !item.isMain).map((item) => item.barcode).join(", ")} />
                  {variation.shadeHex && <Item label="Shade colour" value={variation.shadeHex} />}
                  <Item label="Cost price" value={variation.costPrice === null ? null : formatPrice(variation.costPrice)} />
                  <Item label={settings?.vatEnabled ? "Selling price, before VAT" : "Selling price"} value={variation.price === null ? null : formatPrice(variation.price)} />
                  {settings?.vatEnabled && <Item label={`Customer pays (VAT ${settings.vatRate}%)`} value={variation.price === null ? null : formatPrice(customerPrice(variation.price, settings))} />}
                  <Item label="Old selling price" value={variation.compareAtPrice === null ? null : formatPrice(variation.compareAtPrice)} />
                  <Item
                    label={profit && profit.amount < 0 ? "Loss per unit" : "Profit per unit"}
                    value={
                      profit ? (
                        <span className={profit.amount < 0 ? "text-red-700" : "text-emerald-700"}>
                          {formatPrice(Math.abs(profit.amount))}
                          {profit.percent !== null && ` · ${Math.abs(profit.percent)}% of the cost`}
                        </span>
                      ) : null
                    }
                  />
                  <Item label="In stock" value={<span className={variation.stock.onHand === 0 ? "text-red-700" : undefined}>{variation.stock.onHand}</span>} />
                  <Item label="Expired" value={<span className={variation.stock.expired > 0 ? "text-red-700" : undefined}>{variation.stock.expired}</span>} />
                  <Item label="Next expiry" value={variation.stock.nextExpiry ? formatDay(variation.stock.nextExpiry) : null} />
                  <Item label="Low-stock alert at" value={variation.lowStockLevel} />
                </dl>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Description" id="description" editStep="description" productId={product.id}>
        <dl className={grid}>
          <Item label="Short description" value={product.shortDescription} wide />
          <Item label="Full description" value={product.description} wide />
          <Item label="Key benefits" value={advisor.keyBenefits.length ? <ul className="list-disc space-y-0.5 pl-5">{advisor.keyBenefits.map((item) => <li key={item}>{item}</li>)}</ul> : null} wide />
          <Item label="How to use" value={product.howToUse} wide />
          <Item label="Warnings" value={product.warnings} wide />
        </dl>
      </Card>

      <Card title="Ingredients" id="ingredients" editStep="ingredients" productId={product.id}>
        <dl className={grid}>
          <Item label="Claims" value={chips(name("claims").many(product.claims))} wide />
          <Item label="Use within after opening" value={product.monthsAfterOpening ? `${product.monthsAfterOpening} months` : null} />
          <Item label="Ingredients counted" value={product.ingredients.length || null} />
          <Item label="Ingredient list" value={product.ingredientsText} wide />
          <Item
            label="Recognized ingredients"
            value={
              product.ingredients.some((item) => item.types.length) ? (
                <ul className="space-y-0.5">
                  {product.ingredients
                    .filter((item) => item.types.length)
                    .map((item) => (
                      <li key={item.name}>
                        {item.name}
                        {item.percent !== null && ` ${item.percent}%`} <span className="text-gray-500">· {item.types.map((type) => type.label).join(", ")}</span>
                      </li>
                    ))}
                </ul>
              ) : null
            }
            wide
          />
          <Item label="Warnings from the ingredients" value={chips([...product.ingredientAnalysis.warnings, ...product.ingredientAnalysis.cautions])} wide />
          <Item label="Don't combine with (from the ingredients)" value={chips(product.ingredientAnalysis.dontCombineWith.map((item) => item.label))} wide />
          {product.ingredientAnalysis.claimConflicts.length > 0 && (
            <Item
              label="Claims that don't match the ingredients"
              value={<span className="text-red-700">{product.ingredientAnalysis.claimConflicts.map((item) => `${item.label}: ${item.ingredients.join(", ")}`).join("\n")}</span>}
              wide
            />
          )}
          <Item label="Works well with" value={chips(advisor.worksWith)} />
          <Item label="Don't use with" value={chips(advisor.avoidWith)} />
        </dl>
      </Card>

      <Card title="Advisor details" id="advisor" editStep="advisor" productId={product.id}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${product.advisorCompleteness.percent}%` }} />
          </div>
          <p className="text-sm text-gray-700">
            {product.advisorCompleteness.percent}% filled in ·{" "}
            {product.advisorCompleteness.canBeRecommended ? <span className="text-emerald-700">can be recommended</span> : "can't be recommended yet"}
          </p>
        </div>
        <dl className={grid}>
          <Item label="What it does" value={chips(name("purposes").many(advisor.purposes))} />
          <Item label="Concerns it helps" value={chips(name("concerns").many(advisor.concerns))} />
          <Item label="Used on" value={chips(name("bodyAreas").many(advisor.bodyAreas))} />
          <Item label="Good for: skin" value={chips(name("skinTypes").many(advisor.goodForSkin))} />
          <Item label="Good for: hair" value={chips(name("hairTypes").many(advisor.goodForHair))} />
          <Item label="Not for: skin" value={chips(name("skinTypes").many(advisor.notForSkin))} />
          <Item label="Not for: hair" value={chips(name("hairTypes").many(advisor.notForHair))} />
          <Item label="Age groups" value={chips(name("ageGroups").many(advisor.ageGroups))} />
          <Item label="Skin tones" value={chips(name("skinTones").many(advisor.skinTones))} />
          <Item label="Undertones" value={chips(name("undertones").many(advisor.undertones))} />
          <Item label="Made for" value={name("madeFor").one(advisor.madeFor)} />
          <Item label="Experience needed" value={name("experiences").one(advisor.experience)} />
          <Item label="Routine step" value={name("routineSteps").one(advisor.routineStep)} />
          <Item label="When" value={name("timesOfDay").one(advisor.timeOfDay)} />
          <Item label="How often" value={name("frequencies").one(advisor.frequency)} />
          <Item label="Results after" value={name("resultsAfter").one(advisor.resultsAfter)} />
          <Item label="Best weather" value={chips(name("weather").many(advisor.weather))} />
          <Item label="Strength" value={name("strengths").one(advisor.strength)} />
          <Item label="Texture" value={name("textures").one(advisor.texture)} />
          <Item label="Feel" value={name("feels").one(advisor.feel)} />
          <Item label="Scent" value={name("scents").one(advisor.scent)} />
          <Item label="Finish (makeup)" value={name("finishes").one(advisor.finish)} />
          <Item label="Coverage (makeup)" value={name("coverages").one(advisor.coverage)} />
          <Item label="Cautions" value={chips(name("cautions").many(advisor.cautions))} />
          <Item
            label="Key ingredients"
            value={chips(advisor.keyIngredients.map((item) => (item.percent !== null ? `${item.name} ${item.percent}%` : item.name)))}
            wide
          />
          <Item label="Summary for the advisor" value={advisor.summary} wide />
          <Item label="Search words" value={chips(advisor.keywords)} wide />
          <Item
            label="Customer questions"
            value={
              advisor.customerQuestions.length ? (
                <ul className="space-y-2">
                  {advisor.customerQuestions.map((item) => (
                    <li key={item.question}>
                      <p className="font-medium">{item.question}</p>
                      <p className="text-gray-700">{item.answer}</p>
                    </li>
                  ))}
                </ul>
              ) : null
            }
            wide
          />
        </dl>
      </Card>
    </div>
  );
}

/** The photo as big as the screen allows, to zoom into labels and small print */
function LargePhoto({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-gray-900/60 sm:h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-4xl sm:rounded-xl"
    >
      <div className="flex h-full flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">{label}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <ZoomImage src={src} alt={label} />
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
