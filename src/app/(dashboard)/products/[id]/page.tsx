"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductForm } from "@/components/products/product-form";
import { ProductActions } from "@/components/products/product-actions";
import { ProductStatusBadge } from "@/components/products/product-labels";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useGetProductQuery } from "@/store/api/products.api";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const created = params.get("created");
  const live = params.get("live");
  const { data, isFetching, isUninitialized, error } = useGetProductQuery(id, { refetchOnMountOrArgChange: true });
  const product = data?.data.id === id ? data.data : undefined;

  if (!product && (isFetching || isUninitialized)) {
    return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  }
  if (!product) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Product not found"}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title={product.name} backHref="/products" actions={
          <span className="flex flex-wrap items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <ProductActions
              product={product}
              withEdit={false}
              onDone={setNotice}
              onDeleted={(name) => router.replace(`/products?deleted=${encodeURIComponent(name)}`)}
            />
          </span>
        } />
      {notice && <Alert type="success">{notice}</Alert>}
      {!notice && live && <Alert type="success">Saved. It&apos;s live on the website.</Alert>}
      {!notice && params.get("private") && <Alert type="success">Saved. Staff can sell it.</Alert>}
      {!notice && created && <Alert type="success">Draft saved. You can keep adding details.</Alert>}
      <ProductForm key={product.id} product={product} />
    </div>
  );
}
