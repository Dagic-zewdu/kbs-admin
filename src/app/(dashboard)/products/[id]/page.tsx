"use client";

import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { ProductStatusBadge } from "@/components/products/product-labels";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useGetProductQuery } from "@/store/api/products.api";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get("created");
  const { data, isFetching, isUninitialized, error } = useGetProductQuery(id, { refetchOnMountOrArgChange: true });
  const product = data?.data.id === id ? data.data : undefined;

  if (!product && (isFetching || isUninitialized)) {
    return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  }
  if (!product) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Product not found"}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title={product.name} backHref="/products" actions={<ProductStatusBadge status={product.status} />} />
      {created && <Alert type="success">Draft saved. You can keep adding details.</Alert>}
      <ProductForm key={product.id} product={product} />
    </div>
  );
}
