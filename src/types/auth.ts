export type UserRole = "super_admin" | "admin" | "customer";

export interface User {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

/** Every backend response has this shape */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
}

export interface AuthPayload {
  user: User;
  token: string | null;
}
