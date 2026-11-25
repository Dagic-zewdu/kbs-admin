import clsx from "clsx";
import type { ProductStatus } from "@/types/product";

/** Names for the API's missingToGoLive list */
export const missingLabels: Record<string, string> = {
  brand: "brand",
  category: "category",
  photo: "a photo",
  barcode: "a barcode for every variation",
  cost: "a cost price for every variation",
  price: "a selling price for every variation",
  stock: "stock",
  shortDescription: "short description",
  description: "full description",
};

export const statusLabels: Record<ProductStatus, string> = { draft: "Draft", private: "Private", live: "Live", inactive: "Inactive" };

export const statusHints: Record<ProductStatus, string> = {
  draft: "Not finished. Can't be sold and isn't on the website.",
  private: "Staff can sell it. It isn't on the website.",
  live: "On the website. Staff and customers can sell and buy it.",
  inactive: "Can't be sold and isn't on the website. Its stock and history are kept.",
};

const statusClasses: Record<ProductStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  private: "bg-amber-50 text-amber-800",
  live: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-700",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <span className={clsx("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", statusClasses[status])}>{statusLabels[status]}</span>;
}
