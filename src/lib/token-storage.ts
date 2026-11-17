// The admin token is kept in localStorage so the session survives page reloads.
const TOKEN_KEY = "kbs_admin_token";

export const tokenStorage = {
  get: (): string | null => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
