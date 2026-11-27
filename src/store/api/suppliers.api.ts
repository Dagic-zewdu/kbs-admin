import type { ApiResponse, PaginatedResult } from "@/types/auth";
import type { PaymentInput, Supplier, SupplierDelivery, SupplierFilter, SupplierInput, SupplierPayment, SupplierWithMoney } from "@/types/supplier";
import { baseApi } from "./base-api";

export type SuppliersPage = PaginatedResult<SupplierWithMoney> & { summary: { owed: number; overdue: number; suppliersOwed: number } };
type Page = { page: number; limit: number };

/** Suppliers, their deliveries and our payments. Money is private to our company. */
export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSuppliers: build.query<ApiResponse<SuppliersPage>, Page & { search?: string; filter: SupplierFilter }>({
      query: (params) => ({ url: "/admin/suppliers", params: { ...params, search: params.search || undefined } }),
      providesTags: ["Suppliers"],
    }),
    searchSuppliers: build.query<ApiResponse<Supplier[]>, string>({
      query: (q) => ({ url: "/admin/suppliers/search", params: { q } }),
      providesTags: ["Suppliers"],
    }),
    getSupplier: build.query<ApiResponse<SupplierWithMoney>, string>({
      query: (id) => `/admin/suppliers/${id}`,
      providesTags: ["Suppliers"],
    }),
    listSupplierDeliveries: build.query<ApiResponse<PaginatedResult<SupplierDelivery>>, Page & { id: string }>({
      query: ({ id, ...params }) => ({ url: `/admin/suppliers/${id}/deliveries`, params }),
      providesTags: ["Suppliers"],
    }),
    listSupplierPayments: build.query<ApiResponse<PaginatedResult<SupplierPayment>>, Page & { id: string }>({
      query: ({ id, ...params }) => ({ url: `/admin/suppliers/${id}/payments`, params }),
      providesTags: ["Suppliers"],
    }),
    createSupplier: build.mutation<ApiResponse<SupplierWithMoney>, SupplierInput>({
      query: (body) => ({ url: "/admin/suppliers", method: "POST", body }),
      invalidatesTags: ["Suppliers"],
    }),
    updateSupplier: build.mutation<ApiResponse<SupplierWithMoney>, Partial<SupplierInput> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/suppliers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Suppliers", "Inventory"],
    }),
    changeSupplierStatus: build.mutation<ApiResponse<SupplierWithMoney>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/suppliers/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: ["Suppliers"],
    }),
    deleteSupplier: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Suppliers"],
    }),
    /** One amount: the oldest deliveries are paid first */
    paySupplier: build.mutation<ApiResponse<SupplierWithMoney & { deliveriesPaid: number }>, PaymentInput & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/suppliers/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["Suppliers", "Inventory"],
    }),
    payDelivery: build.mutation<ApiResponse<SupplierWithMoney>, PaymentInput & { batchId: string }>({
      query: ({ batchId, ...body }) => ({ url: `/admin/suppliers/deliveries/${batchId}/payments`, method: "POST", body }),
      invalidatesTags: ["Suppliers", "Inventory"],
    }),
    removePayment: build.mutation<ApiResponse<SupplierWithMoney>, string>({
      query: (id) => ({ url: `/admin/suppliers/payments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Suppliers", "Inventory"],
    }),
  }),
});

export const {
  useListSuppliersQuery,
  useSearchSuppliersQuery,
  useGetSupplierQuery,
  useListSupplierDeliveriesQuery,
  useListSupplierPaymentsQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useChangeSupplierStatusMutation,
  useDeleteSupplierMutation,
  usePaySupplierMutation,
  usePayDeliveryMutation,
  useRemovePaymentMutation,
} = suppliersApi;
