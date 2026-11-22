import type { AdminProfile, ApiResponse, CompanyBranding, LoginPayload, SignupPayload } from "@/types/auth";
import { baseApi } from "./base-api";

export interface LoginRequest { email: string; password: string }
export interface SignupRequest { companySlug: string; firstName: string; lastName?: string; email: string; password: string }
export interface ResetPasswordRequest { email: string; code: string; password: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<LoginPayload>, LoginRequest>({
      query: (body) => ({ url: "/admin/auth/login", method: "POST", body }),
    }),
    signup: build.mutation<ApiResponse<SignupPayload>, SignupRequest>({
      query: (body) => ({ url: "/admin/auth/register", method: "POST", body }),
    }),
    forgotPassword: build.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({ url: "/admin/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: build.mutation<ApiResponse<null>, ResetPasswordRequest>({
      query: (body) => ({ url: "/admin/auth/reset-password", method: "POST", body }),
    }),
    /** Public: a company's colour and logo for its login page */
    getCompanyBranding: build.query<ApiResponse<CompanyBranding>, string>({
      query: (slug) => `/admin/companies/${encodeURIComponent(slug)}/branding`,
    }),
    getMe: build.query<ApiResponse<AdminProfile>, void>({
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
  useGetCompanyBrandingQuery,
} = authApi;
