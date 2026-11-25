import type { ApiResponse } from "@/types/auth";
import type { CompanySettings } from "@/types/settings";
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
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
