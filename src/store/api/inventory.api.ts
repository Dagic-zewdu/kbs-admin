import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { AdjustBatch, BatchDetails, InventoryFilter, InventoryItem, ReceiveBatch, VariationStockDetail } from "@/types/inventory";
import { baseApi } from "./base-api";

type InventoryPage = PaginatedResult<InventoryItem> & { counts: Record<InventoryFilter, number> };

/** Stock of the signed-in admin's company */
export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInventory: build.query<ApiResponse<InventoryPage>, { page: number; limit: number; search?: string; filter: InventoryFilter }>({
      query: (params) => ({ url: "/admin/inventory", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Inventory"],
    }),
    getVariationStock: build.query<ApiResponse<VariationStockDetail>, string>({
      query: (id) => `/admin/inventory/variations/${id}`,
      providesTags: ["Inventory"],
    }),
    receiveBatch: build.mutation<ApiResponse<VariationStockDetail>, ReceiveBatch & { variationId: string }>({
      query: ({ variationId, ...body }) => ({ url: `/admin/inventory/variations/${variationId}/batches`, method: "POST", body }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    updateBatch: build.mutation<ApiResponse<VariationStockDetail>, BatchDetails & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/inventory/batches/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    adjustBatch: build.mutation<ApiResponse<VariationStockDetail>, AdjustBatch & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/inventory/batches/${id}/adjust`, method: "POST", body }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
  }),
});

export const { useListInventoryQuery, useGetVariationStockQuery, useReceiveBatchMutation, useUpdateBatchMutation, useAdjustBatchMutation } = inventoryApi;
