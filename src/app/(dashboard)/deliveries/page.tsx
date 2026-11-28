import type { Metadata } from "next";
import { DeliveriesView } from "@/components/sales/deliveries-view";

export const metadata: Metadata = { title: "Deliveries" };

export default function DeliveriesPage() {
  return <DeliveriesView />;
}
