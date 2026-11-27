import type { Metadata } from "next";
import { Suspense } from "react";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export const metadata: Metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  // Reads ?deleted= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <SuppliersView />
    </Suspense>
  );
}
