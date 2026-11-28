"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ReceiptView } from "@/components/sales/receipt-view";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  // Reads ?print= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <ReceiptView key={id} id={id} />
    </Suspense>
  );
}
