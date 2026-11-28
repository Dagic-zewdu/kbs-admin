import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { DeliveryStatus, ReturnReason, Sale, SaleInput, SaleListItem, SaleLookup, SalesQuery, SaleSummary } from "@/types/sale";
import { baseApi } from "./base-api";

export type SalesPage = PaginatedResult<SaleListItem> & { summary: { sales: number; total: number; profit: number; paid: number; left: number; toRefund: number } };
export type DeliveriesPage = PaginatedResult<SaleSummary> & { counts: Record<DeliveryStatus, number> };
type Refund = { amount: number; methodId: string; note: string | null };

const clean = <T extends object>(params: T) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

/** Sales: make one, read them, payments, delivery, cancel and returns. Changes reach stock and deliverers too. */
export const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    lookupForSale: build.query<ApiResponse<SaleLookup>, string>({
      query: (code) => `/admin/sales/lookup/${encodeURIComponent(code)}`,
      keepUnusedDataFor: 0,
    }),
    listSales: build.query<ApiResponse<SalesPage>, SalesQuery>({
      query: (params) => ({ url: "/admin/sales", params: clean(params) }),
      providesTags: ["Sales"],
    }),
    getSale: build.query<ApiResponse<Sale>, string>({
      query: (id) => `/admin/sales/${id}`,
      providesTags: ["Sales"],
    }),
    listDeliveries: build.query<ApiResponse<DeliveriesPage>, { page: number; limit: number; status: "open" | "all" | DeliveryStatus; delivererId?: string }>({
      query: (params) => ({ url: "/admin/sales/deliveries", params: clean(params) }),
      providesTags: ["Sales"],
    }),
    createSale: build.mutation<ApiResponse<Sale>, SaleInput>({
      query: (body) => ({ url: "/admin/sales", method: "POST", body }),
      invalidatesTags: ["Sales", "Inventory", "Deliverers", "Products"],
    }),
    addSalePayment: build.mutation<ApiResponse<Sale>, { id: string; amount: number; methodId: string; paidOn: string | null; note: string | null; viaDeliverer?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["Sales", "Deliverers"],
    }),
    removeSalePayment: build.mutation<ApiResponse<Sale>, string>({
      query: (id) => ({ url: `/admin/sales/payments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sales", "Deliverers"],
    }),
    updateDelivery: build.mutation<
      ApiResponse<Sale>,
      { id: string; delivererId?: string; address?: string; totalFee?: number; companyShare?: number; cashOnDelivery?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/delivery`, method: "PATCH", body }),
      invalidatesTags: ["Sales", "Deliverers"],
    }),
    changeDeliveryStatus: build.mutation<
      ApiResponse<Sale>,
      { id: string; status: Exclude<DeliveryStatus, "cancelled">; note?: string | null; collected?: { amount?: number; methodId?: string } }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/delivery/status`, method: "POST", body }),
      invalidatesTags: ["Sales", "Deliverers", "Inventory", "Products"],
    }),
    cancelSale: build.mutation<ApiResponse<Sale>, { id: string; reason: string; refund: Refund | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/cancel`, method: "POST", body }),
      invalidatesTags: ["Sales", "Deliverers", "Inventory", "Products"],
    }),
    returnSaleItems: build.mutation<
      ApiResponse<Sale>,
      { id: string; items: { saleItemId: string; quantity: number; damaged: boolean }[]; reason: ReturnReason; note: string | null; refund: Refund | null }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/returns`, method: "POST", body }),
      invalidatesTags: ["Sales", "Inventory", "Products"],
    }),
    refundSale: build.mutation<ApiResponse<Sale>, Refund & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/sales/${id}/refunds`, method: "POST", body }),
      invalidatesTags: ["Sales"],
    }),
  }),
});

export const {
  useLazyLookupForSaleQuery,
  useListSalesQuery,
  useGetSaleQuery,
  useListDeliveriesQuery,
  useCreateSaleMutation,
  useAddSalePaymentMutation,
  useRemoveSalePaymentMutation,
  useUpdateDeliveryMutation,
  useChangeDeliveryStatusMutation,
  useCancelSaleMutation,
  useReturnSaleItemsMutation,
  useRefundSaleMutation,
} = salesApi;
