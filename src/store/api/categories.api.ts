import type { ApiResponse } from "@/types/auth";
import type { Category, CategorySearchResult, CompanyCategory } from "@/types/category";
import type { Affected, Usage } from "@/types/shared-item";
import { baseApi } from "./base-api";

/** Categories are shared by every company: select an existing one or create a new one. */
export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<ApiResponse<Category[]>, void>({
      query: () => "/admin/categories",
      providesTags: ["Categories"],
    }),
    /** With who created each, and our own inactive ones */
    listManagedCategories: build.query<ApiResponse<CompanyCategory[]>, void>({
      query: () => ({ url: "/admin/categories", params: { manage: true } }),
      providesTags: ["Categories"],
    }),
    /** For the warning before deleting; always fetched again */
    getCategoryUsage: build.query<ApiResponse<Usage>, string>({
      query: (id) => `/admin/categories/${id}/usage`,
      keepUnusedDataFor: 0,
    }),
    updateCategory: build.mutation<ApiResponse<CompanyCategory>, { id: string; name: string; description: string | null; parentId: string | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Categories", "Products", "Product"],
    }),
    changeCategoryStatus: build.mutation<ApiResponse<CompanyCategory>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/categories/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: build.mutation<ApiResponse<Affected>, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Categories", "Products", "Product"],
    }),
    searchCategories: build.query<ApiResponse<CategorySearchResult>, string>({
      query: (q) => ({ url: "/admin/categories/search", params: { q } }),
      providesTags: ["Categories"],
    }),
    createCategory: build.mutation<ApiResponse<Category>, { name: string; parentId: string | null }>({
      query: (body) => ({ url: "/admin/categories", method: "POST", body }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const { useListCategoriesQuery, useSearchCategoriesQuery, useCreateCategoryMutation, useListManagedCategoriesQuery, useGetCategoryUsageQuery, useUpdateCategoryMutation, useChangeCategoryStatusMutation, useDeleteCategoryMutation } = categoriesApi;
