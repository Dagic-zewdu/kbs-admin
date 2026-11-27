import type { Metadata } from "next";
import { SupplierEditor } from "@/components/suppliers/supplier-editor";

export const metadata: Metadata = { title: "Add supplier" };

export default function NewSupplierPage() {
  return <SupplierEditor />;
}
