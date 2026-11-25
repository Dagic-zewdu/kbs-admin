import clsx from "clsx";
import type { Brand } from "@/types/brand";

/** The brand's logo, or its first letter */
export function BrandLogo({ brand, className }: { brand: Pick<Brand, "name" | "logoUrl">; className?: string }) {
  return (
    <span className={clsx("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-brand-50", className)}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
        <img src={brand.logoUrl} alt="" className="size-full bg-white object-contain" />
      ) : (
        <span className="text-sm font-semibold uppercase text-brand-700" aria-hidden>
          {Array.from(brand.name)[0]}
        </span>
      )}
    </span>
  );
}
