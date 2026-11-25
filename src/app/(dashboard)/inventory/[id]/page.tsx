import type { Metadata } from "next";
import { VariationStockView } from "@/components/inventory/variation-stock-view";

export const metadata: Metadata = { title: "Stock" };

export default async function VariationStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VariationStockView id={id} />;
}
