import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  user: {
    id: null,
    name: null,
    email: null,
    role: null,
  },
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      console.log("🔍 setCredentials payload:", action.payload);

      const { token, user } = action.payload;

      state.token = token;
      state.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || null,
      };
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.token = null;
      state.user = {
        id: null,
        name: null,
        email: null,
        role: null,
      };
      state.isAuthenticated = false;
    },

    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user.role;
