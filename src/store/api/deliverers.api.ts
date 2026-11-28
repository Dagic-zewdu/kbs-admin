import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { Deliverer, DelivererInput, DelivererMoneyEntry, DelivererType, DelivererWithMoney } from "@/types/deliverer";
import type { SalePaymentMethod } from "@/types/sale";
import { baseApi } from "./base-api";

export type DeliverersPage = PaginatedResult<DelivererWithMoney> & { summary: { feesOwed: number; cashHeld: number; openDeliveries: number } };
export type DelivererStatusFilter = "active" | "inactive" | "all";

/** Our deliverers: people or delivery companies. Private to our company. */
export const deliverersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listDeliverers: build.query<ApiResponse<DeliverersPage>, { page: number; limit: number; search?: string; status: DelivererStatusFilter; type: "all" | DelivererType }>({
      query: (params) => ({ url: "/admin/deliverers", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Deliverers"],
    }),
    searchDeliverers: build.query<ApiResponse<Deliverer[]>, string>({
      query: (q) => ({ url: "/admin/deliverers/search", params: { q } }),
      providesTags: ["Deliverers"],
    }),
    getDeliverer: build.query<ApiResponse<DelivererWithMoney>, string>({
      query: (id) => `/admin/deliverers/${id}`,
      providesTags: ["Deliverers"],
    }),
    createDeliverer: build.mutation<ApiResponse<DelivererWithMoney>, DelivererInput>({
      query: (body) => ({ url: "/admin/deliverers", method: "POST", body }),
      invalidatesTags: ["Deliverers"],
    }),
    updateDeliverer: build.mutation<ApiResponse<DelivererWithMoney>, Partial<DelivererInput> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/deliverers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Deliverers"],
    }),
    changeDelivererStatus: build.mutation<ApiResponse<DelivererWithMoney>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/deliverers/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Deliverers"],
    }),
    listDelivererMoney: build.query<ApiResponse<PaginatedResult<DelivererMoneyEntry>>, { id: string; page: number; limit: number }>({
      query: ({ id, ...params }) => ({ url: `/admin/deliverers/${id}/money`, params }),
      providesTags: ["Deliverers"],
    }),
    payDelivererFee: build.mutation<ApiResponse<DelivererWithMoney>, { id: string; amount: number; method: SalePaymentMethod; paidOn: string | null; note: string | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/deliverers/${id}/fee-payments`, method: "POST", body }),
      invalidatesTags: ["Deliverers"],
    }),
    recordHandin: build.mutation<
      ApiResponse<DelivererWithMoney>,
      { id: string; amount: number; keepFee: number; method: SalePaymentMethod; receivedOn: string | null; note: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/deliverers/${id}/handins`, method: "POST", body }),
      invalidatesTags: ["Deliverers"],
    }),
    removeDelivererMoney: build.mutation<ApiResponse<DelivererWithMoney>, { kind: "fee" | "handin"; id: string }>({
      query: ({ kind, id }) => ({ url: `/admin/deliverers/${kind === "fee" ? "fee-payments" : "handins"}/${id}`, method: "DELETE" }),
      invalidatesTags: ["Deliverers"],
    }),
    deleteDeliverer: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/deliverers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Deliverers"],
    }),
  }),
});

export const {
  useListDeliverersQuery,
  useSearchDeliverersQuery,
  useGetDelivererQuery,
  useCreateDelivererMutation,
  useUpdateDelivererMutation,
  useChangeDelivererStatusMutation,
  useDeleteDelivererMutation,
  useListDelivererMoneyQuery,
  usePayDelivererFeeMutation,
  useRecordHandinMutation,
  useRemoveDelivererMoneyMutation,
} = deliverersApi;
