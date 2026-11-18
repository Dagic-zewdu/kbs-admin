import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_V1_URL } from "@/config/env";
import type { ApiResponse } from "@/types/auth";
import { loggedOut } from "../slices/auth.slice";
import type { RootState } from "../index";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_V1_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/** True when the server says the session is no longer valid (bad token, or account deactivated) */
const isSessionEnded = (error: FetchBaseQueryError) => {
  if (error.status === 401) return true;
  const code = (error.data as ApiResponse<null> | undefined)?.code;
  return error.status === 403 && code === "ACCOUNT_INACTIVE";
};

// When the session ends, log out so the guard sends the user to /login
const baseQueryWithLogout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  const isLoggedIn = Boolean((api.getState() as RootState).auth.token);
  if (result.error && isLoggedIn && isSessionEnded(result.error)) {
    api.dispatch(loggedOut());
  }
  return result;
};

/** Single API slice. Feature endpoints are added with baseApi.injectEndpoints(). */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Me", "Accounts"],
  endpoints: () => ({}),
});
