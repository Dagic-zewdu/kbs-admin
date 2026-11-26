import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { AdvisorOptions, IngredientAnalysis, ProductIngredient } from "@/types/advisor";
import type { UploadedFile } from "@/types/file";
import type { CategoryField, Product, ProductStatus, ProductSummary, SaveProductRequest } from "@/types/product";
import { baseApi } from "./base-api";

export interface ListProductsRequest {
  page: number;
  limit: number;
  search?: string;
  status: "all" | ProductStatus;
  categoryId?: string;
  sort: "newest" | "name";
}

/** The signed-in admin's company's products */
export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProducts: build.query<ApiResponse<PaginatedResult<ProductSummary>>, ListProductsRequest>({
      query: (params) => ({
        url: "/admin/products",
        params: { ...params, search: params.search || undefined, categoryId: params.categoryId || undefined },
      }),
      providesTags: ["Products"],
    }),
    getProduct: build.query<ApiResponse<Product>, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
    createProduct: build.mutation<ApiResponse<Product>, SaveProductRequest>({
      query: (body) => ({ url: "/admin/products", method: "POST", body }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    updateProduct: build.mutation<ApiResponse<Product>, SaveProductRequest & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/products/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Products", "Inventory", { type: "Product", id }],
    }),
    /** Draft, private, live or inactive */
    changeProductStatus: build.mutation<ApiResponse<Product>, { id: string; status: ProductStatus }>({
      query: ({ id, status }) => ({ url: `/admin/products/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_result, _error, { id }) => ["Products", "Inventory", { type: "Product", id }],
    }),
    getProductByBarcode: build.query<ApiResponse<{ variationId: string; product: Product }>, string>({
      query: (barcode) => `/admin/products/barcode/${encodeURIComponent(barcode)}`,
      keepUnusedDataFor: 0,
    }),
    /** For an item without a barcode on its package */
    createInternalBarcode: build.mutation<ApiResponse<{ barcode: string }>, void>({
      query: () => ({ url: "/admin/products/internal-barcode", method: "POST" }),
    }),
    deleteProduct: build.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    /** A white-background copy; the original is kept. With productId the product uses it right away. */
    optimizePhoto: build.mutation<
      ApiResponse<{ photo: { fileId: string; url: string; size: number }; original: { fileId: string; url: string; size: number } }>,
      { fileId: string; productId?: string }
    >({
      query: ({ fileId, productId }) => ({ url: `/admin/files/${fileId}/optimize`, method: "POST", body: { productId } }),
      invalidatesTags: (_result, _error, { productId }) => (productId ? ["Products", "Inventory", { type: "Product", id: productId }] : []),
    }),
    getAdvisorOptions: build.query<ApiResponse<AdvisorOptions>, void>({
      query: () => "/admin/products/advisor-options",
      keepUnusedDataFor: 3600,
    }),
    /** Reads an ingredient list without saving */
    previewIngredients: build.query<
      ApiResponse<{ ingredients: ProductIngredient[]; analysis: IngredientAnalysis }>,
      { text: string; claims: string[] }
    >({
      query: (body) => ({ url: "/admin/products/ingredients/preview", method: "POST", body }),
    }),
    listCategoryFields: build.query<ApiResponse<CategoryField[]>, string>({
      query: (categoryId) => `/admin/categories/${categoryId}/fields`,
    }),
    /** Private upload (POST /v1/admin/files) */
    uploadProductPhoto: build.mutation<ApiResponse<UploadedFile>, File>({
      query: (file) => {
        const body = new FormData();
        body.append("purpose", "product_photo");
        body.append("file", file);
        return { url: "/admin/files", method: "POST", body };
      },
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useChangeProductStatusMutation,
  useGetProductByBarcodeQuery,
  useCreateInternalBarcodeMutation,
  useListCategoryFieldsQuery,
  useGetAdvisorOptionsQuery,
  usePreviewIngredientsQuery,
  useUploadProductPhotoMutation,
  useOptimizePhotoMutation,
} = productsApi;
