import type { Metadata } from "next";
import { CreateBrandForm } from "@/components/brands/create-brand-form";

export const metadata: Metadata = { title: "Create brand" };

export default function CreateBrandPage() {
  return <CreateBrandForm />;
}
