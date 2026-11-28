"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { SaleView } from "@/components/sales/sale-view";

export default function SalePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <SaleView key={id} id={id} />
    </Suspense>
  );
}
