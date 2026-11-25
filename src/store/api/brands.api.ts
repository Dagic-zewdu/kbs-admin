import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { BrandSearchResult, CompanyBrand } from "@/types/brand";
import type { Affected, Usage } from "@/types/shared-item";
import type { UploadedFile } from "@/types/file";
import { baseApi } from "./base-api";

export interface ListBrandsRequest {
  page: number;
  limit: number;
  search?: string;
  sort?: "name" | "newest";
  /** us = added by my company */
  addedBy?: "all" | "us";
  /** Also our own inactive brands */
  includeInactive?: boolean;
}

export interface CreateBrandRequest {
  name: string;
  logoFileId?: string;
  country?: string;
  website?: string;
  description?: string;
}

export interface UpdateBrandRequest {
  id: string;
  name: string;
  /** Left out = unchanged, null = removed */
  logoFileId?: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
}

/** Brands are shared by every company: select an existing one or create a new one. */
export const brandsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBrands: build.query<ApiResponse<PaginatedResult<CompanyBrand>>, ListBrandsRequest>({
      query: (params) => ({ url: "/admin/brands", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Brands"],
    }),
    getBrand: build.query<ApiResponse<CompanyBrand>, string>({
      query: (id) => `/admin/brands/${id}`,
      providesTags: ["Brands"],
    }),
    /** For the warning before deleting; always fetched again */
    getBrandUsage: build.query<ApiResponse<Usage>, string>({
      query: (id) => `/admin/brands/${id}/usage`,
      keepUnusedDataFor: 0,
    }),
    updateBrand: build.mutation<ApiResponse<CompanyBrand>, UpdateBrandRequest>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Brands", "Products", "Product"],
    }),
    changeBrandStatus: build.mutation<ApiResponse<CompanyBrand>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/brands/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Brands"],
    }),
    deleteBrand: build.mutation<ApiResponse<Affected>, string>({
      query: (id) => ({ url: `/admin/brands/${id}`, method: "DELETE" }),
      invalidatesTags: ["Brands", "Products", "Product"],
    }),
    searchBrands: build.query<ApiResponse<BrandSearchResult>, string>({
      query: (q) => ({ url: "/admin/brands/search", params: { q } }),
      providesTags: ["Brands"],
    }),
    /** Private upload (POST /v1/admin/files) */
    uploadBrandLogo: build.mutation<ApiResponse<UploadedFile>, File>({
      query: (file) => {
        const body = new FormData();
        body.append("purpose", "brand_logo");
        body.append("file", file);
        return { url: "/admin/files", method: "POST", body };
      },
    }),
    createBrand: build.mutation<ApiResponse<CompanyBrand>, CreateBrandRequest>({
      query: (body) => ({ url: "/admin/brands", method: "POST", body }),
      invalidatesTags: ["Brands"],
    }),
  }),
});

export const { useListBrandsQuery, useSearchBrandsQuery, useCreateBrandMutation, useUploadBrandLogoMutation, useGetBrandQuery, useGetBrandUsageQuery, useUpdateBrandMutation, useChangeBrandStatusMutation, useDeleteBrandMutation } = brandsApi;
