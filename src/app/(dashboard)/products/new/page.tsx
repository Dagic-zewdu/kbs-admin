import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: PageProps<"/products/new">) {
  // From scanning a code no product has
  const { barcode } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Add product" description="It's saved as a draft. Customers don't see it." backHref="/products" />
      <ProductForm barcode={typeof barcode === "string" ? barcode.slice(0, 40) : ""} />
    </div>
  );
}
