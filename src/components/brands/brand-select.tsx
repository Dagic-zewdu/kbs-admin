"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateSelect, type CreatePanelProps } from "@/components/ui/create-select";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateBrandMutation, useListBrandsQuery, useSearchBrandsQuery } from "@/store/api/brands.api";
import type { Brand } from "@/types/brand";
import { BrandLogo } from "./brand-logo";
import { BrandLogoUpload } from "./brand-logo-upload";

interface BrandSelectProps {
  label: string;
  isRequired?: boolean;
  value: Brand | null;
  onChange: (brand: Brand | null, isNew?: boolean) => void;
  error?: string;
}

const useBrandOptions = (query: string, isOpen: boolean) => {
  const all = useListBrandsQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const search = useSearchBrandsQuery(query, { skip: !isOpen || !query });
  return {
    all: all.data?.data.items,
    found: search.data?.data,
    isFetching: search.isFetching,
    loadError: getErrorMessage(query ? search.error : all.error) || undefined,
  };
};

/** Select a shared brand or create it for everyone */
export function BrandSelect(props: BrandSelectProps) {
  return (
    <CreateSelect
      {...props}
      placeholder="Type to find or create a brand"
      clearLabel="Clear brand"
      useOptions={useBrandOptions}
      getText={(brand) => brand.name}
      renderItem={(brand) => (
        <span className="flex items-center gap-2.5">
          <BrandLogo brand={brand} className="size-7" />
          <span className="min-w-0">
            <span className="font-medium text-gray-900">{brand.name}</span>
            {brand.country && <span className="text-gray-400"> · {brand.country}</span>}
          </span>
        </span>
      )}
      CreatePanel={CreateBrandPanel}
    />
  );
}

function CreateBrandPanel({ name, onBack, onSelect }: CreatePanelProps<Brand>) {
  const [logoFileId, setLogoFileId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [country, setCountry] = useState("");
  const [createBrand, { isLoading, error }] = useCreateBrandMutation();
  const errorBody = error && "data" in error ? (error.data as { code?: string; error?: Brand }) : undefined;
  const existing = errorBody?.code === "BRAND_EXISTS" ? errorBody.error : undefined;

  const create = async () => {
    const result = await createBrand({ name, logoFileId: logoFileId || undefined, country: country.trim() || undefined });
    if (result.data) onSelect(result.data.data, true);
  };

  return (
    <div className="space-y-3 p-3">
      <p className="break-words text-sm font-semibold text-gray-900">Create “{name}”</p>
      <Input
        label="Country (optional)"
        value={country}
        onChange={(event) => setCountry(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault(); // never submits the form around it
            if (!isLoading && !isUploading) create();
          }
        }}
        maxLength={100}
        placeholder="South Korea"
        autoFocus
      />
      <BrandLogoUpload onChange={setLogoFileId} onUploading={setIsUploading} />
      <p className="text-xs text-gray-500">Check the spelling: every company can use this brand.</p>
      {error && (
        <Alert>
          {getErrorMessage(error)}
          {existing && (
            <button type="button" onClick={() => onSelect(existing)} className="ml-1 font-semibold underline">
              Select it
            </button>
          )}
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="button" onClick={create} isLoading={isLoading} disabled={isUploading}>
          Create brand
        </Button>
      </div>
    </div>
  );
}
