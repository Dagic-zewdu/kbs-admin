"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CloudCheck, History, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BarcodeField } from "@/components/barcode/barcode-field";
import { BrandSelect } from "@/components/brands/brand-select";
import { CategorySelect } from "@/components/categories/category-select";
import { emptyBatch, toReceiveBatch } from "@/components/inventory/batch-fields";
import { deliveryPaymentProblem, deliveryTotal, emptyDeliveryPayment } from "@/components/suppliers/delivery-payment-fields";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-error";
import { useAppSelector } from "@/store/hooks";
import { formatPrice } from "@/lib/labels";
import { toNumber } from "@/lib/numbers";
import { profitOf } from "@/lib/pricing";
import {
  useChangeProductStatusMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetAdvisorOptionsQuery,
  useListCategoryFieldsQuery,
  useUpdateProductMutation,
} from "@/store/api/products.api";
import type { Brand } from "@/types/brand";
import type { VariationStockDetail } from "@/types/inventory";
import type { Category } from "@/types/category";
import type { AttributeValue, CategoryField, Product, ProductPhoto, VariationType } from "@/types/product";
import { emptyAdvisorProfile } from "@/types/advisor";
import { AdvisorSection } from "./advisor-section";
import { IngredientsSection } from "./ingredients-section";
import { PhotoManager } from "./photo-manager";
import { PhraseList } from "./phrase-list";
import { draftKey, readDraft, removeDraft, timeAgo, writeDraft } from "./product-draft";
import { missingLabels } from "./product-labels";
import { StepProgress, type StepState } from "./step-progress";
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
  claims: product?.claims ?? [],
  monthsAfterOpening: product?.monthsAfterOpening ? String(product.monthsAfterOpening) : "",
  ingredientsText: product?.ingredientsText ?? "",
  advisor: product?.advisor ?? emptyAdvisorProfile,
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
    barcodes: variation.barcodes,
    sku: variation.sku,
    costPrice: variation.costPrice === null ? "" : String(variation.costPrice),
    price: variation.price === null ? "" : String(variation.price),
    compareAtPrice: variation.compareAtPrice === null ? "" : String(variation.compareAtPrice),
    lowStockLevel: String(variation.lowStockLevel),
    stock: variation.stock,
    newBatch: emptyBatch,
  })) ?? [emptyVariation()]) as VariationRow[],
  photos: (product?.photos ?? []) as ProductPhoto[],
});

type FormState = ReturnType<typeof toForm>;

const steps = [
  { id: "basics", label: "Basics" },
  { id: "photos", label: "Photos" },
  { id: "variations", label: "Price & stock" },
  { id: "description", label: "Description" },
  { id: "ingredients", label: "Ingredients" },
  { id: "advisor", label: "Advisor" },
  { id: "review", label: "Review" },
] as const;
type StepId = (typeof steps)[number]["id"];
const isStep = (value: unknown): value is StepId => steps.some((item) => item.id === value);

/** Shows the step in the address, so a refresh or Back opens it again */
const showStepInAddress = (id: StepId) => {
  const url = new URL(window.location.href);
  url.searchParams.set("step", id);
  window.history.replaceState(window.history.state, "", url);
};

/** Rows kept from an earlier visit get fresh keys, so they never clash with new rows */
const rekey = (form: FormState): FormState => ({
  ...form,
  // Kept before suppliers existed: the new stock gets an empty supplier and payment
  variations: form.variations.map((row, index) => {
    const newBatch = { ...emptyBatch, ...row.newBatch, payment: { ...emptyDeliveryPayment, ...row.newBatch?.payment } };
    return row.id ? { ...row, newBatch } : { ...row, newBatch, key: `kept-${Date.now()}-${index}` };
  }),
});

/** Where each missing thing is filled in */
const stepOfMissing: Record<string, StepId> = {
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

/** Enough for staff to sell it (private) */
const neededToSell = ["brand", "category", "barcode", "cost", "price"];

/** What is missing to go live, from what is typed now */
const missingNow = (form: FormState) => {
  const missing: string[] = [];
  if (!form.brand) missing.push("brand");
  if (!form.category) missing.push("category");
  if (!form.photos.length) missing.push("photo");
  if (form.variations.some((row) => !row.barcode.trim())) missing.push("barcode");
  if (form.variations.some((row) => row.costPrice.trim() === "")) missing.push("cost");
  if (form.variations.some((row) => !(Number(row.price) > 0))) missing.push("price");
  if (!form.variations.some((row) => row.stock?.batches || Number(row.newBatch.quantity) > 0)) missing.push("stock");
  if (!form.shortDescription.trim()) missing.push("shortDescription");
  if (!form.description.trim()) missing.push("description");
  return missing;
};

function ReviewProfit({ price, cost }: { price: number | null; cost: number | null }) {
  if (!price || cost === null) return null;
  const { amount } = profitOf(price, cost);
  return (
    <span className={clsx("block", amount < 0 ? "text-red-700" : "text-emerald-700")}>
      {amount < 0 ? "Loss" : "Profit"} {formatPrice(Math.abs(amount))}
    </span>
  );
}

/** Hidden steps stay mounted, so nothing typed is lost */
function Section({
  title,
  isRequired,
  description,
  shown,
  children,
}: {
  title: string;
  isRequired?: boolean;
  description: string;
  shown: boolean;
  children: React.ReactNode;
}) {
  return (
    <section hidden={!shown} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          {title}
          {isRequired && <RequiredMark />}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

const noChange = () => () => {};

/** Create or edit a product, step by step. Saved as a draft at any step; only the name is required. */
export function ProductForm(props: { product?: Product; barcode?: string }) {
  // What is kept on this device is read in the browser only
  const isBrowser = useSyncExternalStore(noChange, () => true, () => false);
  const userId = useAppSelector((state) => state.auth.user?.id);
  if (!isBrowser) return <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white" aria-label="Loading" />;
  return <ProductFormSteps {...props} storageKey={draftKey(userId, props.product?.id)} />;
}

/** What was kept on this device for this product, if it can still be used */
const keptFor = (storageKey: string, product: Product | undefined, barcode: string) => {
  const record = readDraft<FormState>(storageKey);
  const fromAddress = new URLSearchParams(window.location.search).get("step");
  const step: StepId = isStep(fromAddress) ? fromAddress : isStep(record?.step) ? record.step : "basics";
  // A newer save of the product wins; a new scanned code starts a new product
  const isUsable = record?.form && (product ? record.baseUpdatedAt === product.updatedAt : !barcode || record.form.variations[0]?.barcode === barcode);
  const visited = (record?.visited ?? []).filter(isStep);
  return { step, visited, form: isUsable ? rekey(record.form!) : null, savedAt: isUsable ? record.savedAt : null };
};

function ProductFormSteps({ product, barcode = "", storageKey }: { product?: Product; barcode?: string; storageKey: string }) {
  const router = useRouter();
  const [kept] = useState(() => keptFor(storageKey, product, barcode));
  const [form, setForm] = useState<FormState>(() => {
    if (kept.form) return kept.form;
    const start = toForm(product);
    return product || !barcode ? start : { ...start, variations: [{ ...start.variations[0], barcode }] };
  });
  const [isDirty, setIsDirty] = useState(Boolean(kept.form));
  const [restoredAt, setRestoredAt] = useState(kept.savedAt);
  // The last save the changes are made on
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(product?.updatedAt);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [create, createState] = useCreateProductMutation();
  const [update, updateState] = useUpdateProductMutation();
  const [remove, removeState] = useDeleteProductMutation();
  const advisorOptions = useGetAdvisorOptionsQuery().data?.data;
  const [changeStatus, statusState] = useChangeProductStatusMutation();
  const isSaving = createState.isLoading || updateState.isLoading || statusState.isLoading;
  const error = createState.error || updateState.error || statusState.error;
  const [step, setStep] = useState<StepId>(kept.step);
  const [visited, setVisited] = useState<StepId[]>(() => [...new Set([...kept.visited, kept.step])]);
  const stepIndex = steps.findIndex((item) => item.id === step);
  const goTo = (id: StepId) => {
    setStep(id);
    setVisited((current) => (current.includes(id) ? current : [...current, id]));
    window.scrollTo({ top: 0 });
  };

  // The open step is in the address and kept on this device
  useEffect(() => showStepInAddress(step), [step]);

  // Kept on this device a moment after each change, and at once when leaving the page
  useEffect(() => {
    const keep = () =>
      writeDraft(storageKey, {
        step,
        visited,
        form: isDirty ? form : undefined,
        savedAt: Date.now(),
        baseUpdatedAt,
      });
    const timer = window.setTimeout(keep, 400);
    window.addEventListener("pagehide", keep);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", keep);
    };
  }, [form, isDirty, step, visited, storageKey, baseUpdatedAt]);

  const discardKept = () => {
    setForm(toForm(product));
    setIsDirty(false);
    setRestoredAt(null);
    setNotice("");
    setLocalError("");
  };

  const change = (values: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...values }));
    setIsDirty(true);
    setNotice("");
  };
  const field = (key: "name" | "countryOfOrigin" | "efdaNumber" | "shortDescription" | "description" | "howToUse" | "warnings") => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change({ [key]: event.target.value }),
  });

  // From the newest form, so two quick changes don't undo each other
  const changeAdvisor = (values: Partial<FormState["advisor"]>) => {
    setForm((current) => ({ ...current, advisor: { ...current.advisor, ...values } }));
    setIsDirty(true);
    setNotice("");
  };
  const expiryRequired = form.category?.expiryRequired ?? true;

  /** What is wrong before anything is sent, and the step to fix it */
  const findProblem = (): { step: StepId; message: string } | null => {
    if (form.name.trim().length < 2) return { step: "basics", message: "Enter the product name." };
    for (const row of form.variations) {
      if (row.sizeValue && !(Number(row.sizeValue) > 0)) return { step: "variations", message: `“${row.sizeValue}” is not a valid size.` };
      if (row.price && !(Number(row.price) > 0)) return { step: "variations", message: "A selling price must be more than 0." };
      if (row.costPrice && !Number.isFinite(Number(row.costPrice))) return { step: "variations", message: `“${row.costPrice}” is not a valid cost price.` };
      if (row.compareAtPrice && !(Number(row.compareAtPrice) > Number(row.price))) {
        return { step: "variations", message: "The old selling price must be higher than the selling price." };
      }
      const { quantity, payment, ...details } = row.newBatch;
      if (!Number(quantity) && (Object.values(details).some(Boolean) || payment.supplier || payment.paymentStatus)) {
        return { step: "variations", message: "Enter the quantity of the new stock." };
      }
      if (Number(quantity) > 0 && expiryRequired && !details.expiryDate) {
        return { step: "variations", message: "Enter the expiry date of the new stock." };
      }
      if (Number(quantity) > 0) {
        const cost = toNumber(row.costPrice);
        if (cost === null) return { step: "variations", message: "Enter the cost price: the supplier is paid quantity × cost price." };
        const paymentProblem = deliveryPaymentProblem(payment, deliveryTotal(quantity, cost));
        if (paymentProblem) return { step: "variations", message: paymentProblem };
      }
    }
    return null;
  };

  const save = async (then?: "live" | "private") => {
    setNotice("");
    createState.reset();
    updateState.reset();
    statusState.reset();
    const problem = findProblem();
    if (problem) {
      setLocalError(problem.message);
      return goTo(problem.step);
    }
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
      claims: form.claims,
      monthsAfterOpening: form.monthsAfterOpening ? Number(form.monthsAfterOpening) : null,
      ingredientsText: form.ingredientsText,
      advisor: {
        ...form.advisor,
        keyIngredients: form.advisor.keyIngredients.filter((item) => item.name.trim()),
        customerQuestions: form.advisor.customerQuestions.filter((item) => item.question.trim() || item.answer.trim()),
      },
      attributes: form.attributes,
      variationType: form.variationType,
      variations: form.variations.map((row) => ({
        id: row.id,
        name: row.name,
        sizeValue: row.sizeValue ? Number(row.sizeValue) : null,
        sizeUnit: row.sizeValue ? row.sizeUnit : null,
        shadeHex: row.shadeHex || null,
        barcode: row.barcode.trim() || null,
        sku: row.sku.trim() || null,
        costPrice: toNumber(row.costPrice),
        price: toNumber(row.price),
        compareAtPrice: toNumber(row.compareAtPrice),
        lowStockLevel: Number(row.lowStockLevel || 0),
        newBatch: Number(row.newBatch.quantity) > 0 ? toReceiveBatch(row.newBatch) : undefined,
      })),
      photoFileIds: form.photos.map((photo) => photo.fileId),
    };

    if (body.advisor.customerQuestions.some((item) => item.question.trim().length < 3 || item.answer.trim().length < 2)) {
      setLocalError("Every customer question needs a question and an answer.");
      return goTo("advisor");
    }

    const saved = product ? await update({ id: product.id, ...body }) : await create(body);
    // The result is shown at the top
    window.scrollTo({ top: 0 });
    if (!saved.data) return;
    const { id } = saved.data.data;
    // New variations now have ids, SKUs and stock: saving again must not add the stock twice
    setForm(toForm(saved.data.data));
    setIsDirty(false);
    setRestoredAt(null);
    setBaseUpdatedAt(saved.data.data.updatedAt);
    if (!product) {
      // The new product's page opens on the same step; the "new" copy is done
      removeDraft(storageKey);
      writeDraft(storageKey.replace(/:new$/, `:${id}`), { step, visited, savedAt: Date.now(), baseUpdatedAt: saved.data.data.updatedAt });
    }

    const changed = then ? await changeStatus({ id, status: then }) : undefined;
    if (!product) return router.replace(`/products/${id}?${changed?.data ? then : "created"}=1&step=${step}`);
    if (then && !changed?.data) return;
    setNotice(then === "live" ? "Saved. It's live on the website." : then === "private" ? "Saved. Staff can sell it." : "Saved.");
  };

  // Stock and barcodes. Already saved, so nothing becomes unsaved. A delivery also sets the prices; a decrease keeps what is typed.
  const applyStock = (id: string, { stock, variation }: VariationStockDetail) =>
    setForm((current) => ({
      ...current,
      variations: current.variations.map((row) => {
        if (row.id !== id) return row;
        // The main barcode follows, unless another one is being typed
        const savedMain = row.barcodes?.find((item) => item.isMain)?.barcode ?? "";
        const barcode = row.barcode.trim() === savedMain ? (variation.barcode ?? "") : row.barcode;
        const saved = { ...row, stock, barcode, barcodes: variation.barcodes };
        if (stock.batches === row.stock?.batches) return saved;
        return {
          ...saved,
          costPrice: String(variation.costPrice ?? ""),
          price: String(variation.price ?? ""),
          // An old price that isn't higher any more is removed, as on the server
          compareAtPrice: Number(row.compareAtPrice) > Number(variation.price) ? row.compareAtPrice : "",
        };
      }),
    }));

  // The brand fills in its country, unless staff typed another one
  const chooseBrand = (brand: Brand | null) => {
    const typed = form.countryOfOrigin.trim();
    const isFromBrand = !typed || typed === form.brand?.country;
    change({ brand, countryOfOrigin: isFromBrand ? (brand?.country ?? "") : form.countryOfOrigin });
  };

  // The category suggests the routine step, unless staff chose one
  const chooseCategory = (category: Category | null) =>
    change({
      category,
      attributes: {},
      advisor: { ...form.advisor, routineStep: form.advisor.routineStep ?? category?.defaultRoutineStep ?? null },
    });

  const missing = missingNow(form);
  const firstRow = form.variations[0];
  const stepHasMissing = (id: StepId) => missing.some((item) => stepOfMissing[item] === id);
  const canGoLive = product?.status !== "live";
  // Done = opened and nothing missing to go live
  const stateOf = (id: StepId): StepState => {
    if (id === step) return "current";
    if (stepHasMissing(id)) return "needs";
    return visited.includes(id) ? "done" : "todo";
  };

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        <StepProgress steps={steps.map((item) => ({ ...item, state: stateOf(item.id) }))} onSelect={(id) => isStep(id) && goTo(id)} />

        <p className="text-xs text-gray-500">
          <span className="text-red-600">*</span> Required before it can be sold or go live. A draft needs only its name.
        </p>
        {(localError || error) && <Alert>{localError || getErrorMessage(error)}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        {restoredAt && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            <span className="flex items-center gap-2">
              <History className="size-4 shrink-0" aria-hidden />
              Your unsaved changes from {timeAgo(restoredAt)} were brought back. Press {product ? "Save changes" : "Save draft"} to keep them.
            </span>
            <button type="button" onClick={discardKept} className="min-h-8 font-medium underline">
              Discard them
            </button>
          </div>
        )}

        <Section shown={step === "basics"} title="Basics" description="Scan the barcode first. Only the name is needed to save a draft.">
          {form.variationType === "none" && (
            <BarcodeField
              prominent
              isRequired
              value={firstRow.barcode}
              productId={product?.id}
              onChange={(barcode) => change({ variations: [{ ...firstRow, barcode }] })}
            />
          )}
          <Input label="Product name" isRequired placeholder="Low pH Good Morning Gel Cleanser" maxLength={200} {...field("name")} />
          <div className="grid gap-4 md:grid-cols-2">
            <BrandSelect label="Brand" isRequired value={form.brand} onChange={chooseBrand} />
            <CategorySelect label="Category" isRequired value={form.category} onChange={chooseCategory} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Country of origin (from the brand)" placeholder="South Korea" maxLength={100} {...field("countryOfOrigin")} />
            <Input label="EFDA number (optional)" maxLength={100} {...field("efdaNumber")} />
          </div>
          {form.category && (
            <ExtraFields categoryId={form.category.id} values={form.attributes} onChange={(attributes) => change({ attributes })} />
          )}
        </Section>

        <Section shown={step === "photos"} title="Photos" isRequired description="Front, back and texture. The first photo is the main one.">
          <PhotoManager
            photos={form.photos}
            onChange={(updatePhotos) => {
              setForm((current) => ({ ...current, photos: updatePhotos(current.photos) }));
              setIsDirty(true);
              setNotice("");
            }}
            onUploading={setIsUploading}
            productId={product?.id}
            onSaved={(updatePhotos) => setForm((current) => ({ ...current, photos: updatePhotos(current.photos) }))}
          />
        </Section>

        <Section shown={step === "variations"} title="Price and stock" description="Each version the customer can buy has its own barcode, price and stock.">
          <VariationEditor
            type={form.variationType}
            rows={form.variations}
            productId={product?.id}
            expiryRequired={expiryRequired}
            onChange={(variationType, variations) => change({ variationType, variations })}
            onStockChange={applyStock}
          />
        </Section>

        <Section shown={step === "description"} title="Description" description="What the customer reads.">
          <Textarea label="Short description" isRequired rows={2} placeholder="One or two lines for the product card" maxLength={300} {...field("shortDescription")} />
          <Textarea label="Full description" isRequired rows={6} maxLength={10000} {...field("description")} />
          <PhraseList
            label="Key benefits (optional)"
            hint="One short sentence each, then Enter. Also for the AI"
            placeholder="Cleans without drying the skin"
            value={form.advisor.keyBenefits}
            onChange={(keyBenefits) => changeAdvisor({ keyBenefits })}
            max={6}
            maxLength={150}
          />
          <Textarea label="How to use (optional)" rows={3} maxLength={3000} {...field("howToUse")} />
          <Textarea label="Warnings (optional)" rows={2} placeholder="For external use only" maxLength={2000} {...field("warnings")} />
        </Section>

        {advisorOptions && (
          <>
            <Section shown={step === "ingredients"} title="Ingredients" description="Warnings and don't-combine rules are worked out from the list.">
              <IngredientsSection
                options={advisorOptions}
                text={form.ingredientsText}
                claims={form.claims}
                monthsAfterOpening={form.monthsAfterOpening}
                worksWith={form.advisor.worksWith}
                avoidWith={form.advisor.avoidWith}
                onAdvisorChange={changeAdvisor}
                onChange={change}
              />
            </Section>

            <Section shown={step === "advisor"} title="Advisor details" description="Helps the AI advisor recommend this product to the right customers.">
              <AdvisorSection
                key={product?.updatedAt}
                options={advisorOptions}
                value={form.advisor}
                hasIngredients={Boolean(form.ingredientsText.trim())}
                onChange={changeAdvisor}
              />
            </Section>
          </>
        )}

        <Section shown={step === "review"} title="Review" description="Check the product before customers see it.">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Name", form.name],
              ["Brand", form.brand?.name],
              ["Category", form.category?.path.join(" › ")],
              ["Photos", form.photos.length ? `${form.photos.length}` : ""],
              ["Advisor details", `${product?.advisorCompleteness.percent ?? 0}% when last saved`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="break-words font-medium text-gray-900">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
            {form.variations.map((row) => (
              <li key={row.key} className="flex flex-wrap justify-between gap-x-4 gap-y-1 p-3">
                <span className="font-medium text-gray-900">
                  {row.name || (row.sizeValue ? `${row.sizeValue} ${row.sizeUnit}` : "One version")}
                  <span className="block font-normal text-gray-500">{row.barcode || "No barcode"}</span>
                </span>
                <span className="text-right text-gray-900">
                  {formatPrice(toNumber(row.price))}
                  <ReviewProfit price={toNumber(row.price)} cost={toNumber(row.costPrice)} />
                  <span className="block text-gray-500">{(row.stock?.onHand ?? 0) + Number(row.newBatch.quantity || 0)} in stock</span>
                </span>
              </li>
            ))}
          </ul>
          {missing.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-medium">
                <CircleAlert className="size-4 shrink-0" aria-hidden /> Still needed to go live
              </p>
              <ul className="mt-2 space-y-1">
                {missing.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => goTo(stepOfMissing[item])} className="min-h-8 text-left font-medium underline first-letter:uppercase">
                      {missingLabels[item] ?? item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <Check className="size-4 shrink-0" aria-hidden />
              {canGoLive ? "Everything is there. It can go live." : "It's live on the website."}
            </p>
          )}
          {canGoLive && product?.status !== "inactive" && (
            <Button type="button" onClick={() => save("live")} disabled={missing.length > 0 || isUploading} isLoading={isSaving} className="w-full sm:w-auto">
              Save and go live
            </Button>
          )}
          {(!product || product.status === "draft") && missing.length > 0 && !missing.some((item) => neededToSell.includes(item)) && (
            <Button type="button" variant="secondary" onClick={() => save("private")} disabled={isUploading} isLoading={isSaving} className="w-full sm:w-auto">
              Save as private (staff can sell it)
            </Button>
          )}
        </Section>

        {isDirty && (
          <p className="flex items-center justify-end gap-1.5 text-xs text-gray-500">
            <CloudCheck className="size-3.5" aria-hidden /> Changes kept on this device. Press {product ? "Save changes" : "Save draft"} to save them for everyone.
          </p>
        )}
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="secondary" disabled={stepIndex === 0} onClick={() => goTo(steps[stepIndex - 1].id)}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
            <Button type="button" variant="secondary" disabled={stepIndex === steps.length - 1} onClick={() => goTo(steps[stepIndex + 1].id)}>
              Next <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {product?.status === "draft" && (
              <Button type="button" variant="ghost" onClick={() => setIsDeleting(true)} className="text-red-700 hover:bg-red-50">
                <Trash2 className="size-4" aria-hidden /> Delete draft
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => router.push("/products")}>
              Back to products
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
      description="The draft, its photos, variations and stock are removed. This can't be undone."
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
