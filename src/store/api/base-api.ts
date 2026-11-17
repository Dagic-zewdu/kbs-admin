import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { API_V1_URL } from "@/config/env";
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

// If the token is rejected, log the user out so the guard sends them to /login
const baseQueryWithLogout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401 && (api.getState() as RootState).auth.token) {
    api.dispatch(loggedOut());
  }
  return result;
};

/** Single API slice. Feature endpoints are added with baseApi.injectEndpoints(). */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithLogout,
  tagTypes: ["Me"],
  endpoints: () => ({}),
});
