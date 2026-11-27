"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { SupplierView } from "@/components/suppliers/supplier-view";

export default function SupplierPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <SupplierView key={id} id={id} />
    </Suspense>
  );
}
