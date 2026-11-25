import type { Metadata } from "next";
import { BrandForm } from "@/components/brands/brand-form";

export const metadata: Metadata = { title: "Create brand" };

export default function CreateBrandPage() {
  return <BrandForm />;
}
