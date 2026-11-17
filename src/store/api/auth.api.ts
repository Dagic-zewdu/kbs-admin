import type { ApiResponse, AuthPayload, User } from "@/types/auth";
import { baseApi } from "./base-api";

export interface LoginRequest { email: string; password: string }
export interface SignupRequest { firstName: string; lastName?: string; email: string; password: string }
export interface ResetPasswordRequest { email: string; code: string; password: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthPayload>, LoginRequest>({
      query: (body) => ({ url: "/admin/auth/login", method: "POST", body }),
    }),
    signup: build.mutation<ApiResponse<AuthPayload>, SignupRequest>({
      query: (body) => ({ url: "/admin/auth/register", method: "POST", body }),
    }),
    forgotPassword: build.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({ url: "/admin/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: build.mutation<ApiResponse<null>, ResetPasswordRequest>({
      query: (body) => ({ url: "/admin/auth/reset-password", method: "POST", body }),
    }),
    getMe: build.query<ApiResponse<User>, void>({
      query: () => "/admin/auth/me",
      providesTags: ["Me"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
} = authApi;
