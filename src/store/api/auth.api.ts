import type { AdminProfile, ApiResponse, CompanyBranding, LoginPayload, SignupPayload } from "@/types/auth";
import { baseApi } from "./base-api";

export interface LoginRequest { email: string; password: string }
export interface SignupRequest { companySlug: string; firstName: string; lastName?: string; email: string; password: string }
export interface CompanyRequestBody {
  companyName: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  city?: string;
  address?: string;
  description?: string;
  contactFirstName: string;
  contactLastName?: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
}
export interface CompanyRequestReceipt { id: string; companyName: string; status: "pending"; createdAt: string }
export interface ResetPasswordRequest { token: string; password: string }

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
    /** Public: active companies for the sign-up dropdown */
    listCompanies: build.query<ApiResponse<CompanyBranding[]>, void>({
      query: () => "/admin/companies",
    }),
    /** Public: a company's colour and logo for its login page */
    getCompanyBranding: build.query<ApiResponse<CompanyBranding>, string>({
      query: (slug) => `/admin/companies/${encodeURIComponent(slug)}/branding`,
    }),
    /** Public: "Register your company" - the platform reviews it */
    requestCompany: build.mutation<ApiResponse<CompanyRequestReceipt>, CompanyRequestBody>({
      query: (body) => ({ url: "/admin/company-requests", method: "POST", body }),
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
  useListCompaniesQuery,
  useRequestCompanyMutation,
} = authApi;
