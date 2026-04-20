import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "super_admin" | "admin" | "collector" | "borrower";

export interface AuthUser {
  id: number;
  mobile_number: string;
  full_name: string;
  role: UserRole;
  must_reset_password?: boolean;
  branch_name?: string;
  theme_preference: "light" | "dark" | "system";
  onboarding_completed: boolean;
  is_active?: boolean;
  permissions?: string[];
  capabilities?: {
    can_approve_tenants?: boolean;
    can_manage_tenants?: boolean;
    can_manage_team?: boolean;
  };
}

interface AuthState {
  // Only the short-lived access token lives in JS memory + localStorage.
  // The refresh token is stored exclusively in a Django-issued httpOnly cookie
  // and is never accessible from JavaScript.
  accessToken: string | null;
  currentUser: AuthUser | null;
}

const initialState: AuthState = {
  accessToken: null,
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ access: string; user: AuthUser }>) => {
      state.accessToken = action.payload.access;
      state.currentUser = action.payload.user;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.currentUser = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.currentUser = null;
    },
  },
});

export const { setAuth, setAccessToken, setCurrentUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
