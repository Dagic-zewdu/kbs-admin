"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { SupplierEditor } from "@/components/suppliers/supplier-editor";
import { getErrorMessage } from "@/lib/api-error";
import { useGetSupplierQuery } from "@/store/api/suppliers.api";

export default function EditSupplierPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetSupplierQuery(id, { refetchOnMountOrArgChange: true });
  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Supplier not found"}</p>;
  return <SupplierEditor key={data.data.id} supplier={data.data} />;
}
