import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type User = { id: string; email: string; name: string; role: "user" | "admin" };

type AuthState = { accessToken: string | null; user: User | null };

const initialState: AuthState = { accessToken: null, user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setCredentials, setAccessToken, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
