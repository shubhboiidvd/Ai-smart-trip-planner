import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
const slice = createSlice({
  name: "offline",
  initialState: { cachedTrips: [], lastSyncedAt: null, isOffline: false },
  reducers: {
    setOffline: (state, action) => {
      state.isOffline = action.payload;
    },
    cacheTrips: (state, action) => {
      state.cachedTrips = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      AsyncStorage.setItem("cachedTrips", JSON.stringify(action.payload));
    },
    hydrateCache: (state, action) => {
      state.cachedTrips = action.payload || [];
    },
  },
});
export const hydrateOffline = () => async (dispatch) => {
  const value = await AsyncStorage.getItem("cachedTrips");
  dispatch(slice.actions.hydrateCache(value ? JSON.parse(value) : []));
};
export const { setOffline, cacheTrips } = slice.actions;
export default slice.reducer;
