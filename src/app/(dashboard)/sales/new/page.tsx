import type { Metadata } from "next";
import { NewSaleView } from "@/components/sales/new-sale-view";

export const metadata: Metadata = { title: "New sale" };

export default function NewSalePage() {
  return <NewSaleView />;
}
