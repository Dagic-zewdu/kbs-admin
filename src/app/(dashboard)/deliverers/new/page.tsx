import type { Metadata } from "next";
import { DelivererEditor } from "@/components/deliverers/deliverer-editor";

export const metadata: Metadata = { title: "Add deliverer" };

export default function NewDelivererPage() {
  return <DelivererEditor />;
}
