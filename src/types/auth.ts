/**
 * - super_admin: activates / deactivates accounts, can never be deactivated
 * - admin:       uses the admin panel once activated
 * - user:        storefront / app shopper (signs in with Firebase)
 */
export type UserRole = "super_admin" | "admin" | "user";

export type AuthProvider = "password" | "firebase";

export interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  authProvider: AuthProvider;
  /** The company an admin account belongs to */
  companyId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  statusChangedAt: string | null;
  createdAt: string;
}

/** Every backend response has this shape */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  /** Machine-readable reason on errors, e.g. "ACCOUNT_INACTIVE" */
  code?: string | null;
  errors?: { field: string; message: string }[];
}

/** How the admin site looks for a company: its name, colour and logo */
export interface CompanyBranding {
  id: string;
  name: string;
  slug: string;
  /** #RRGGBB */
  brandColor: string;
  /** Signed URL, expires after about an hour */
  logoUrl: string | null;
}

/** The signed-in admin and the company they work for */
export interface AdminProfile extends User {
  company: (CompanyBranding & { status: "active" | "suspended" }) | null;
}

export interface LoginPayload {
  user: AdminProfile;
  token: string;
}

export interface SignupPayload {
  user: User;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
