import { api } from "@/store/api";
import { PaginatedResponse } from "@/types/api";
import type { LocationFormValues } from "@/validation/location.validation";

export interface Location {
  id: number;
  uuid: string;
  name: string;
  description: string;
  borrower_count: number;
  created_at: string;
  updated_at: string;
}

export const locationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listLocations: builder.query<PaginatedResponse<Location>, { search?: string; ordering?: string; page?: number }>({
      query: (params) => ({ url: "locations/", params }),
      providesTags: ["Location"],
    }),
    getLocation: builder.query<Location, string | number>({
      query: (id) => ({ url: `locations/${id}/` }),
      providesTags: ["Location"],
    }),
    addLocation: builder.mutation<Location, LocationFormValues>({
      query: (data) => ({ url: "locations/", method: "POST", data }),
      invalidatesTags: ["Location"],
    }),
    updateLocation: builder.mutation<Location, { id: string | number; data: LocationFormValues }>({
      query: ({ id, data }) => ({ url: `locations/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Location"],
    }),
    deleteLocation: builder.mutation<void, string | number>({
      query: (id) => ({ url: `locations/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Location"],
    }),
  }),
});

export const {
  useListLocationsQuery,
  useGetLocationQuery,
  useAddLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationApi;
