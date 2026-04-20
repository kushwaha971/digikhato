import { api } from "@/store/api";
import { PaginatedResponse } from "@/types/api";

export interface Borrower {
  id: number;
  uuid: string;
  name: string;
  mobile_number: string;
  address: string;
  status: "active" | "inactive";
  has_alert?: boolean;
  temporary_password?: string | null;
}

export const borrowerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBorrowers: builder.query<PaginatedResponse<Borrower>, { search?: string; status?: string; ordering?: string; page?: number }>({
      query: (params) => ({ url: "borrowers/", params }),
      providesTags: ["Borrower"],
    }),
    addBorrower: builder.mutation<Borrower, Partial<Borrower>>({
      query: (data) => ({ url: "borrowers/", method: "POST", data }),
      invalidatesTags: ["Borrower"],
    }),
    updateBorrower: builder.mutation<Borrower, { id: string; data: Partial<Borrower> }>({
      query: ({ id, data }) => ({ url: `borrowers/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Borrower"],
    }),
    getBorrower: builder.query<Borrower, string>({
      query: (id) => ({ url: `borrowers/${id}/` }),
      providesTags: ["Borrower"],
    }),
    deleteBorrower: builder.mutation<void, string>({
      query: (id) => ({ url: `borrowers/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Borrower"],
    }),
    toggleBorrowerStatus: builder.mutation<Borrower, string>({
      query: (id) => ({ url: `borrowers/${id}/`, method: "PATCH", data: {} }),
      invalidatesTags: ["Borrower"],
    }),
  }),
});

export const {
  useListBorrowersQuery,
  useAddBorrowerMutation,
  useUpdateBorrowerMutation,
  useGetBorrowerQuery,
  useDeleteBorrowerMutation,
} = borrowerApi;
