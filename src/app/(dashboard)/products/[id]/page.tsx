"use client";

import { Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ProductActions } from "@/components/products/product-actions";
import { ProductDetail } from "@/components/products/product-detail";
import { ProductStatusBadge } from "@/components/products/product-labels";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useGetProductQuery } from "@/store/api/products.api";

/** A product, read only: every label and value */
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const { data, isFetching, isUninitialized, error } = useGetProductQuery(id, { refetchOnMountOrArgChange: true });
  const product = data?.data.id === id ? data.data : undefined;

  if (!product && (isFetching || isUninitialized)) {
    return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  }
  if (!product) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Product not found"}</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={product.name}
        backHref="/products"
        actions={
          <span className="flex flex-wrap items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <ProductActions
              product={product}
              withEdit={false}
              onDone={setNotice}
              onDeleted={(name) => router.replace(`/products?deleted=${encodeURIComponent(name)}`)}
            />
            <Link
              href={`/products/${product.id}/edit`}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Pencil className="size-4" aria-hidden /> Edit
            </Link>
          </span>
        }
      />
      {notice && <Alert type="success">{notice}</Alert>}
      <ProductDetail product={product} />
    </div>
  );
}
