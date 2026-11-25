import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { BrandSearchResult, CompanyBrand } from "@/types/brand";
import type { UploadedFile } from "@/types/file";
import { baseApi } from "./base-api";

export interface ListBrandsRequest {
  page: number;
  limit: number;
  search?: string;
  sort?: "name" | "newest";
  /** us = added by my company */
  addedBy?: "all" | "us";
}

export interface CreateBrandRequest {
  name: string;
  logoFileId?: string;
  country?: string;
  website?: string;
  description?: string;
}

/** Brands are shared by every company: select an existing one or create a new one. */
export const brandsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBrands: build.query<ApiResponse<PaginatedResult<CompanyBrand>>, ListBrandsRequest>({
      query: (params) => ({ url: "/admin/brands", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Brands"],
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

export const { useListBrandsQuery, useSearchBrandsQuery, useCreateBrandMutation, useUploadBrandLogoMutation } = brandsApi;
