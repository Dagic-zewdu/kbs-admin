"use client";

import { useParams } from "next/navigation";
import { ReceiptView } from "@/components/sales/receipt-view";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  return <ReceiptView key={id} id={id} />;
}
