"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { BrandForm } from "@/components/brands/brand-form";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useGetBrandQuery } from "@/store/api/brands.api";

export default function EditBrandPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetBrandQuery(id);
  const brand = data?.data;

  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!brand) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Brand not found"}</p>;
  // The API refuses it anyway; this explains it before anything is typed
  if (brand.createdBy !== "us") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader title={brand.name} backHref="/brands" />
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This brand was not created by you, so you cannot edit it.
        </p>
      </div>
    );
  }
  return <BrandForm key={brand.id} brand={brand} />;
}
