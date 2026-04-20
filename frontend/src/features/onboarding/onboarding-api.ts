import { api } from "@/store/api";

export interface BusinessProfile {
  id: number;
  business_name: string;
  area_name: string;
  currency: string;
  is_onboarded: boolean;
}

export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessProfile: builder.query<BusinessProfile, void>({
      query: () => ({ url: "onboarding/profile/" }),
      providesTags: ["Onboarding"],
    }),
    updateBusinessProfile: builder.mutation<BusinessProfile, Partial<BusinessProfile>>({
      query: (data) => ({ url: "onboarding/profile/", method: "PATCH", data }),
      invalidatesTags: ["Onboarding"],
    }),
  }),
});

export const { useGetBusinessProfileQuery, useUpdateBusinessProfileMutation } = onboardingApi;
