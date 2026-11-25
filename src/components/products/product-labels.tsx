import clsx from "clsx";
import type { ProductStatus } from "@/types/product";

/** Names for the API's missingToGoLive list */
export const missingLabels: Record<string, string> = {
  brand: "brand",
  category: "category",
  photo: "a photo",
  shortDescription: "short description",
  description: "full description",
};

export const statusLabels: Record<ProductStatus, string> = { draft: "Draft", private: "Private", live: "Live", archived: "Archived" };

const statusClasses: Record<ProductStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  private: "bg-amber-50 text-amber-800",
  live: "bg-emerald-50 text-emerald-700",
  archived: "bg-gray-100 text-gray-500",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <span className={clsx("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", statusClasses[status])}>{statusLabels[status]}</span>;
}
