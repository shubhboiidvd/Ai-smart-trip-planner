import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import tripReducer from "../features/trips/tripSlice";
import offlineReducer from "../features/offline/offlineSlice";
import { tripsApi } from "../features/trips/tripsApiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trip: tripReducer,
    offline: offlineReducer,
    [tripsApi.reducerPath]: tripsApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(tripsApi.middleware),
});