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

export interface LoginPayload {
  user: User;
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
