import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { AdjustBatch, BatchDetails, InventoryFilter, InventoryItem, ReceiveStock, ReduceStock, ScannedItem, VariationStockDetail } from "@/types/inventory";
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
    receiveBatch: build.mutation<ApiResponse<VariationStockDetail>, ReceiveStock & { variationId: string }>({
      query: ({ variationId, ...body }) => ({ url: `/admin/inventory/variations/${variationId}/batches`, method: "POST", body }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    /** Takes the units that expire first */
    reduceStock: build.mutation<ApiResponse<VariationStockDetail>, ReduceStock & { variationId: string }>({
      query: ({ variationId, ...body }) => ({ url: `/admin/inventory/variations/${variationId}/reduce`, method: "POST", body }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    addBarcode: build.mutation<ApiResponse<VariationStockDetail>, { variationId: string; barcode: string }>({
      query: ({ variationId, barcode }) => ({ url: `/admin/inventory/variations/${variationId}/barcodes`, method: "POST", body: { barcode } }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    setMainBarcode: build.mutation<ApiResponse<VariationStockDetail>, { variationId: string; barcode: string }>({
      query: ({ variationId, barcode }) => ({
        url: `/admin/inventory/variations/${variationId}/barcodes/${encodeURIComponent(barcode)}/main`,
        method: "PUT",
      }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    removeBarcode: build.mutation<ApiResponse<VariationStockDetail>, { variationId: string; barcode: string }>({
      query: ({ variationId, barcode }) => ({ url: `/admin/inventory/variations/${variationId}/barcodes/${encodeURIComponent(barcode)}`, method: "DELETE" }),
      invalidatesTags: ["Inventory", "Products", "Product"],
    }),
    /** Any barcode, or a SKU */
    scanCode: build.query<ApiResponse<ScannedItem>, string>({
      query: (code) => `/admin/inventory/scan/${encodeURIComponent(code)}`,
      keepUnusedDataFor: 0,
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

export const { useListInventoryQuery, useGetVariationStockQuery, useReceiveBatchMutation, useReduceStockMutation, useAddBarcodeMutation, useSetMainBarcodeMutation, useRemoveBarcodeMutation, useScanCodeQuery, useLazyScanCodeQuery, useUpdateBatchMutation, useAdjustBatchMutation } = inventoryApi;
