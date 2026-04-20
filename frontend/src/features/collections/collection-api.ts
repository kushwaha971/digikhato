import { api } from "@/store/api";
import { Loan } from "@/features/loans/loan-api";
import { PaginatedResponse } from "@/types/api";

export interface Collection {
  id: number;
  uuid: string;
  collection_code?: string | null;
  loan: number;
  borrower: number;
  collected_by?: number;
  date: string;
  amount_paid: string | number;
  status: "paid" | "partial" | "missed";
  payment_mode?: "cash" | "gpay" | "phonepe" | "paytm" | "other_upi" | null;
  reference_id?: string | null;
  notes?: string;
}

export const collectionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTodayDue: builder.query<PaginatedResponse<Loan>, void>({
      query: () => ({ url: "collections/today-due/" }),
      providesTags: ["Collection", "Loan"],
    }),
    listCollections: builder.query<
      PaginatedResponse<Collection>,
      {
        loan?: number;
        borrower?: number;
        status?: string;
        payment_mode?: string;
        collected_by?: number;
        date?: string;
        date__gte?: string;
        date__lte?: string;
        amount_paid__gte?: number;
        amount_paid__lte?: number;
        ordering?: string;
        page?: number;
      }
    >({
      query: (params) => ({ url: "collections/", params }),
      providesTags: ["Collection"],
    }),
    getCollection: builder.query<Collection, string>({
      query: (id) => ({ url: `collections/${id}/` }),
      providesTags: ["Collection"],
    }),
    createCollection: builder.mutation<Collection, Partial<Collection>>({
      query: (data) => ({ url: "collections/", method: "POST", data }),
      invalidatesTags: ["Collection", "Loan", "Dashboard", "Report"],
    }),
    updateCollection: builder.mutation<Collection, { id: string; data: Partial<Collection> }>({
      query: ({ id, data }) => ({ url: `collections/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Collection", "Loan", "Dashboard", "Report"],
    }),
  }),
});

export const {
  useListTodayDueQuery,
  useListCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
} = collectionApi;
