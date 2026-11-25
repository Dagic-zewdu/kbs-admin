import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsView } from "@/components/products/products-view";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  // ProductsView reads ?deleted= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
