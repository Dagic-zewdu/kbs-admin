import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Add product" description="It's saved as a draft. Customers don't see it." backHref="/products" />
      <ProductForm />
    </div>
  );
}
