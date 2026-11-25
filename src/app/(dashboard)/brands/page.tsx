import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandsView } from "@/components/brands/brands-view";

export const metadata: Metadata = { title: "Brands" };

export default function BrandsPage() {
  // BrandsView reads ?created= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <BrandsView />
    </Suspense>
  );
}
