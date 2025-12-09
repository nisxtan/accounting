import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  user: {
    id: null,
    name: null,
    email: null,
    role: null,
  },
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;

      state.token = token;
      state.user = {
        id: user.id,
        name: user.fullName || user.username,
        // username: user.username,
        email: user.email,
      };
    },

    logout: (state) => {
      state.token = null;
      state.user = {
        id: null,
        name: null,
        email: null,
        role: null,
      };

      localStorage.removeItem("persist:auth");
      localStorage.clear();
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },

    setHydrated: (state) => {
      state.hydrated = true;
    },
  },
});

export const { setCredentials, logout, updateUser, setHydrated } =
  authSlice.actions;

export default authSlice.reducer;

// selectors
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectUserRole = (state) => state.auth.user.role;
export const selectHydrated = (state) => state.auth.hydrated;
