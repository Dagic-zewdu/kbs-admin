import type { ApiResponse, PaginatedResult, User } from "@/types/auth";
import { baseApi } from "./base-api";

/**
 * The Users menu tabs. Each maps to /v1/admin/<group> on the API.
 * Add a new tab (e.g. "vendors") by adding it here and on the backend's ACCOUNT_GROUPS.
 */
export type AccountGroup = "admins" | "users";

export type AccountStatusFilter = "all" | "active" | "inactive";

export interface ListAccountsRequest {
  group: AccountGroup;
  page: number;
  limit: number;
  search?: string;
  status: AccountStatusFilter;
}

export interface ChangeAccountStatusRequest {
  group: AccountGroup;
  id: string;
  isActive: boolean;
}

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAccounts: build.query<ApiResponse<PaginatedResult<User>>, ListAccountsRequest>({
      query: ({ group, ...params }) => ({
        url: `/admin/${group}`,
        // Don't send an empty search
        params: { ...params, search: params.search || undefined },
      }),
      providesTags: (_result, _error, { group }) => [{ type: "Accounts", id: group }],
    }),
    changeAccountStatus: build.mutation<ApiResponse<User>, ChangeAccountStatusRequest>({
      query: ({ group, id, isActive }) => ({ url: `/admin/${group}/${id}/status`, method: "PATCH", body: { isActive } }),
      // Refresh that tab's list after a change
      invalidatesTags: (_result, _error, { group }) => [{ type: "Accounts", id: group }],
    }),
  }),
});

export const { useListAccountsQuery, useChangeAccountStatusMutation } = accountsApi;
