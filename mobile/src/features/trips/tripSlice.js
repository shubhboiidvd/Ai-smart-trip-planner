import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { request } from "../../lib/api";
export const createTrip = createAsyncThunk("trip/create", (payload) =>
  request("/trips", { method: "POST", body: JSON.stringify(payload) }),
);
export const toggleChecklistItem = createAsyncThunk(
  "trip/toggle",
  ({ tripId, itemId, isChecked }) =>
    request(`/trips/${tripId}/packing/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ isChecked }),
    }),
);
export const addCustomItem = createAsyncThunk(
  "trip/addCustom",
  ({ tripId, name, category }) =>
    request(`/trips/${tripId}/packing`, {
      method: "POST",
      body: JSON.stringify({ name, category }),
    }),
);
export const regenerateItinerary = createAsyncThunk(
  "trip/regenerate",
  ({ tripId, dayNumber, provider }) =>
    request(`/trips/${tripId}/itinerary/regenerate-day`, {
      method: "POST",
      body: JSON.stringify({ dayNumber, provider }),
    }),
);
const slice = createSlice({
  name: "trip",
  initialState: {
    currentTrip: null,
    packingList: [],
    itinerary: [],
    status: "idle",
    error: null,
  },
  reducers: {
    setCurrentTrip: (state, { payload }) => {
      state.currentTrip = payload;
      state.packingList = payload?.packingList || [];
      state.itinerary = payload?.itinerary || [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrip.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.currentTrip = payload;
        state.packingList = payload.packingList;
        state.itinerary = payload.itinerary;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(toggleChecklistItem.fulfilled, (state, { payload }) => {
        const item = state.packingList.find(
          (entry) => entry._id === payload._id,
        );
        if (item) item.isChecked = payload.isChecked;
      })
      .addCase(addCustomItem.fulfilled, (state, { payload }) => {
        state.packingList.push(payload);
      })
      .addCase(regenerateItinerary.fulfilled, (state, { payload }) => {
        const day = state.itinerary.find((entry) => entry._id === payload._id);
        if (day) day.activities = payload.activities;
      });
  },
});
export const { setCurrentTrip } = slice.actions;
export default slice.reducer;
