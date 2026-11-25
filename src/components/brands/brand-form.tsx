"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateBrandMutation, useSearchBrandsQuery, useUpdateBrandMutation } from "@/store/api/brands.api";
import type { Brand, CompanyBrand } from "@/types/brand";
import { BrandLogo } from "./brand-logo";
import { BrandLogoUpload } from "./brand-logo-upload";

/** /brands/new and /brands/[id]/edit */
export function BrandForm({ brand }: { brand?: CompanyBrand }) {
  const router = useRouter();
  const [name, setName] = useState(brand?.name ?? "");
  // undefined = unchanged, "" = removed
  const [logoFileId, setLogoFileId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [country, setCountry] = useState(brand?.country ?? "");
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [createBrand, createState] = useCreateBrandMutation();
  const [updateBrand, updateState] = useUpdateBrandMutation();
  const isLoading = createState.isLoading || updateState.isLoading;
  const isSuccess = createState.isSuccess || updateState.isSuccess;
  const error = createState.error || updateState.error;

  // Warn while typing, so nobody fills the form for a brand that exists
  const typed = name.trim().replace(/\s+/g, " ");
  const query = useDebouncedValue(typed, 300);
  const search = useSearchBrandsQuery(query, { skip: query.length < 2 || isSuccess });
  const found = query === typed && typed.length >= 2 && !search.isFetching ? search.data?.data : undefined;
  const others = (list: Brand[] = []) => list.filter((item) => item.id !== brand?.id);
  const existing = others(found?.exact)[0];
  const similar = existing || brand ? [] : others(found?.similar);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (brand) {
      const result = await updateBrand({
        id: brand.id,
        name: typed,
        logoFileId: logoFileId === undefined ? undefined : logoFileId || null,
        country: country.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
      });
      if (result.data) router.push(`/brands?saved=${encodeURIComponent(result.data.data.name)}`);
      return;
    }
    const result = await createBrand({
      name: typed,
      logoFileId: logoFileId || undefined,
      country: country.trim() || undefined,
      website: website.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (result.data) router.push(`/brands?created=${encodeURIComponent(result.data.data.name)}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <PageHeader title={brand ? `Edit ${brand.name}` : "Create brand"} description="Every company can use it." backHref="/brands" />

      <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <div className="space-y-2">
          <Input
            label="Brand name"
            isRequired
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="COSRX"
            required
            minLength={2}
            maxLength={80}
            autoFocus
            error={existing ? "This brand already exists." : undefined}
          />
          {existing && (
            <p className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-2.5 text-sm text-gray-800">
              <BrandLogo brand={existing} className="size-9" /> {existing.name}
            </p>
          )}
          {similar.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Did you mean one of these? They already exist.</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {similar.map((brand) => (
                  <li key={brand.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-gray-800">
                    <BrandLogo brand={brand} className="size-7" /> {brand.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <BrandLogoUpload initialUrl={brand?.logoUrl} onChange={setLogoFileId} onUploading={setIsUploading} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Country (optional)"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="South Korea"
            maxLength={100}
          />
          <Input
            label="Website (optional)"
            type="url"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://www.cosrx.com"
            maxLength={255}
          />
        </div>
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What the brand is known for"
          maxLength={1000}
        />

        {error && <Alert>{getErrorMessage(error)}</Alert>}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Link
            href="/brands"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:h-10"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={isLoading} disabled={Boolean(existing) || isUploading || isSuccess}>
            {brand ? "Save changes" : "Create brand"}
          </Button>
        </div>
      </form>
    </div>
  );
}
