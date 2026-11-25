import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { Brand, BrandSearchResult } from "@/types/brand";
import { baseApi } from "./base-api";

/** Brands are shared by every company: select an existing one or create a new one. */
export const brandsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBrands: build.query<ApiResponse<PaginatedResult<Brand>>, { page: number; limit: number; search?: string }>({
      query: (params) => ({ url: "/admin/brands", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Brands"],
    }),
    searchBrands: build.query<ApiResponse<BrandSearchResult>, string>({
      query: (q) => ({ url: "/admin/brands/search", params: { q } }),
      providesTags: ["Brands"],
    }),
    createBrand: build.mutation<ApiResponse<Brand>, { name: string; country?: string }>({
      query: (body) => ({ url: "/admin/brands", method: "POST", body }),
      invalidatesTags: ["Brands"],
    }),
  }),
});

export const { useListBrandsQuery, useSearchBrandsQuery, useCreateBrandMutation } = brandsApi;
