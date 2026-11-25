import type { ApiResponse } from "@/types/auth";
import type { Category, CategorySearchResult } from "@/types/category";
import { baseApi } from "./base-api";

/** Categories are shared by every company: select an existing one or create a new one. */
export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<ApiResponse<Category[]>, void>({
      query: () => "/admin/categories",
      providesTags: ["Categories"],
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

export const { useListCategoriesQuery, useSearchCategoriesQuery, useCreateCategoryMutation } = categoriesApi;
