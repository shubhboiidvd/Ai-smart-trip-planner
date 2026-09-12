import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request } from "../../lib/api";
const session = async (path, payload) => {
  const result = await request(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await AsyncStorage.multiSet([
    ["token", result.token],
    ["user", JSON.stringify(result.user)],
  ]);
  return result;
};
export const login = createAsyncThunk("auth/login", (payload) =>
  session("/auth/login", payload),
);
export const register = createAsyncThunk("auth/register", (payload) =>
  session("/auth/register", payload),
);
export const loadUserFromStorage = createAsyncThunk("auth/load", async () => {
  const [[, token], [, user]] = await AsyncStorage.multiGet(["token", "user"]);
  return token && user ? { token, user: JSON.parse(user) } : null;
});
const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    status: "idle",
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.multiRemove(["token", "user"]);
    },
  },
  extraReducers: (builder) => {
    [login, register].forEach((action) =>
      builder
        .addCase(action.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(action.fulfilled, (state, { payload }) => {
          state.status = "succeeded";
          state.user = payload.user;
          state.token = payload.token;
          state.isAuthenticated = true;
        })
        .addCase(action.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.error.message;
        }),
    );
    builder.addCase(loadUserFromStorage.fulfilled, (state, { payload }) => {
      if (payload) {
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
      }
    });
  },
});
export const { logout } = slice.actions;
export default slice.reducer;
