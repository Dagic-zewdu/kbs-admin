import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/labels";
import type { CompanyBrand } from "@/types/brand";
import { BrandLogo } from "./brand-logo";

const websiteName = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function Website({ url }: { url: string | null }) {
  if (!url) return <>—</>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-brand-700 hover:underline">
      <span className="truncate">{websiteName(url)}</span>
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}

function AddedByUs() {
  return <span className="whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Added by you</span>;
}

/** Phones: one card per brand. Tablets and up: a table. */
export function BrandsTable({ brands }: { brands: CompanyBrand[] }) {
  return (
    <>
      <ul className="divide-y divide-gray-100 md:hidden">
        {brands.map((brand) => (
          <li key={brand.id} className="flex gap-3 px-4 py-4">
            <BrandLogo brand={brand} className="size-12" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words font-medium text-gray-900">{brand.name}</p>
                {brand.addedByUs && <AddedByUs />}
              </div>
              {brand.description && <p className="line-clamp-2 break-words text-xs text-gray-500">{brand.description}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {brand.country && <span>{brand.country}</span>}
                {brand.website && <Website url={brand.website} />}
                <span>Added {formatDate(brand.createdAt)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-16 px-4 py-3 font-medium">Logo</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3">
                  <BrandLogo brand={brand} className="size-11" />
                </td>
                <td className="max-w-72 px-4 py-3">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-medium text-gray-900">{brand.name}</span>
                    {brand.addedByUs && <AddedByUs />}
                  </p>
                  {brand.description && (
                    <p className="truncate text-xs text-gray-500" title={brand.description}>
                      {brand.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{brand.country ?? "—"}</td>
                <td className="max-w-48 px-4 py-3 text-gray-600">
                  <Website url={brand.website} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(brand.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
