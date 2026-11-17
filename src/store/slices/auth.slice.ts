import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { tokenStorage } from "@/lib/token-storage";
import type { User } from "@/types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  /** false until we have read the saved token from localStorage */
  isHydrated: boolean;
}

const initialState: AuthState = { token: null, user: null, isHydrated: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state) {
      state.token = tokenStorage.get();
      state.isHydrated = true;
    },
    loggedIn(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      tokenStorage.set(action.payload.token);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
      tokenStorage.clear();
    },
  },
});

export const { hydrateAuth, loggedIn, setUser, loggedOut } = authSlice.actions;
export default authSlice.reducer;
