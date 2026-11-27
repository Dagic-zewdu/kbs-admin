"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { DelivererEditor } from "@/components/deliverers/deliverer-editor";
import { getErrorMessage } from "@/lib/api-error";
import { useGetDelivererQuery } from "@/store/api/deliverers.api";

export default function EditDelivererPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetDelivererQuery(id, { refetchOnMountOrArgChange: true });
  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error) || "Deliverer not found"}</p>;
  return <DelivererEditor key={data.data.id} deliverer={data.data} />;
}
