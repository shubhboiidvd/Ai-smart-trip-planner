import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { request } from "../../lib/api";
import { cacheTrips } from "../offline/offlineSlice";
export const tripsApi = createApi({
  reducerPath: "tripsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Trips"],
  endpoints: (builder) => ({
    getTrips: builder.query({
      queryFn: async (_, { dispatch }) => {
        try {
          const data = await request("/trips");
          dispatch(cacheTrips(data));
          return { data };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: ["Trips"],
    }),
    getTripById: builder.query({
      queryFn: async (id) => {
        try {
          return { data: await request(`/trips/${id}`) };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: "Trips", id }],
    }),
    deleteTrip: builder.mutation({
      queryFn: async (id) => {
        try {
          return { data: await request(`/trips/${id}`, { method: "DELETE" }) };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Trips"],
    }),
  }),
});
export const { useGetTripsQuery, useGetTripByIdQuery, useDeleteTripMutation } =
  tripsApi;
