import type { ApiResponse } from "@/types/auth";
import type { CompanySettings } from "@/types/settings";
import type { ChannelKind, MethodType, PaymentMethodOption, SalesChannel } from "@/types/company-lists";
import { baseApi } from "./base-api";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<ApiResponse<CompanySettings>, void>({
      query: () => "/admin/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: build.mutation<ApiResponse<CompanySettings>, Partial<CompanySettings>>({
      query: (body) => ({ url: "/admin/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),
    /** all: also hidden / switched-off ones (Settings) */
    listChannels: build.query<ApiResponse<SalesChannel[]>, { all?: boolean } | void>({
      query: (args) => ({ url: "/admin/settings/channels", params: { all: args?.all ? "true" : "false" } }),
      providesTags: ["CompanyLists"],
    }),
    createChannel: build.mutation<ApiResponse<SalesChannel>, { name: string; kind: ChannelKind; link: string | null }>({
      query: (body) => ({ url: "/admin/settings/channels", method: "POST", body }),
      invalidatesTags: ["CompanyLists"],
    }),
    updateChannel: build.mutation<ApiResponse<SalesChannel>, { id: string; name?: string; kind?: ChannelKind; link?: string | null; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/settings/channels/${id}`, method: "PATCH", body }),
      invalidatesTags: ["CompanyLists"],
    }),
    deleteChannel: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/settings/channels/${id}`, method: "DELETE" }),
      invalidatesTags: ["CompanyLists"],
    }),
    reorderChannels: build.mutation<ApiResponse<SalesChannel[]>, string[]>({
      query: (ids) => ({ url: "/admin/settings/channels/order", method: "PUT", body: { ids } }),
      invalidatesTags: ["CompanyLists"],
    }),
    listPaymentMethods: build.query<ApiResponse<PaymentMethodOption[]>, { all?: boolean } | void>({
      query: (args) => ({ url: "/admin/settings/payment-methods", params: { all: args?.all ? "true" : "false" } }),
      providesTags: ["CompanyLists"],
    }),
    createPaymentMethod: build.mutation<ApiResponse<PaymentMethodOption>, { name: string; type: MethodType; accountNumber: string | null; accountHolder: string | null }>({
      query: (body) => ({ url: "/admin/settings/payment-methods", method: "POST", body }),
      invalidatesTags: ["CompanyLists"],
    }),
    updatePaymentMethod: build.mutation<
      ApiResponse<PaymentMethodOption>,
      { id: string; name?: string; type?: MethodType; accountNumber?: string | null; accountHolder?: string | null; isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/settings/payment-methods/${id}`, method: "PATCH", body }),
      invalidatesTags: ["CompanyLists"],
    }),
    deletePaymentMethod: build.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/settings/payment-methods/${id}`, method: "DELETE" }),
      invalidatesTags: ["CompanyLists"],
    }),
    reorderPaymentMethods: build.mutation<ApiResponse<PaymentMethodOption[]>, string[]>({
      query: (ids) => ({ url: "/admin/settings/payment-methods/order", method: "PUT", body: { ids } }),
      invalidatesTags: ["CompanyLists"],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useListChannelsQuery,
  useCreateChannelMutation,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
  useReorderChannelsMutation,
  useListPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useReorderPaymentMethodsMutation,
} = settingsApi;
