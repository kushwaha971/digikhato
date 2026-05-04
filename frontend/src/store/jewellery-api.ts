import { api } from "@/store/api";

export interface JewelleryBootstrapResponse {
  module: "jewellery";
  api_namespace: string;
  feature_enabled: boolean;
  kpis: {
    today_sales: string;
    active_items: number;
    open_transfers: number;
    pending_orders: number;
  };
}

export const jewelleryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJewelleryBootstrap: builder.query<JewelleryBootstrapResponse, void>({
      query: () => ({ url: "jwl/v1/system/bootstrap/" }),
      providesTags: ["Jewellery"],
    }),
  }),
});

export const { useGetJewelleryBootstrapQuery } = jewelleryApi;
