import { api } from "@/store/api";

export interface LedgerCustomer {
  id: number;
  name: string;
  mobile: string;
  notes: string;
  credit_total: string;
  payment_total: string;
  balance: string;
  updated_at: string;
}

export interface LedgerTransaction {
  id: number;
  tx_type: "credit" | "payment";
  amount: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface LedgerTransactionListResponse {
  count: number;
  results: LedgerTransaction[];
}

export const customerLedgerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listLedgerCustomers: builder.query<LedgerCustomer[], { search?: string }>({
      query: (params) => ({ url: "ledger/customers/", params }),
      providesTags: ["CustomerLedger"],
      transformResponse: (res: { results: LedgerCustomer[] }) => res.results,
    }),
    getLedgerCustomer: builder.query<LedgerCustomer, number>({
      query: (id) => ({ url: `ledger/customers/${id}/` }),
      providesTags: ["CustomerLedger"],
    }),
    createLedgerCustomer: builder.mutation<LedgerCustomer, { name: string; mobile?: string; notes?: string }>({
      query: (data) => ({ url: "ledger/customers/", method: "POST", data, successMessage: "Customer added." }),
      invalidatesTags: ["CustomerLedger"],
    }),
    updateLedgerCustomer: builder.mutation<LedgerCustomer, { id: number; name?: string; mobile?: string; notes?: string }>({
      query: ({ id, ...data }) => ({ url: `ledger/customers/${id}/`, method: "PATCH", data, successMessage: "Customer updated." }),
      invalidatesTags: ["CustomerLedger"],
    }),
    deleteLedgerCustomer: builder.mutation<void, number>({
      query: (id) => ({ url: `ledger/customers/${id}/`, method: "DELETE", successMessage: "Customer removed." }),
      invalidatesTags: ["CustomerLedger"],
    }),
    listLedgerTransactions: builder.query<LedgerTransactionListResponse, number>({
      query: (customerId) => ({ url: `ledger/customers/${customerId}/transactions/` }),
      providesTags: ["CustomerLedger"],
    }),
    addLedgerCredit: builder.mutation<LedgerCustomer, { customerId: number; amount: string; date: string; notes?: string }>({
      query: ({ customerId, ...data }) => ({
        url: `ledger/customers/${customerId}/credit/`,
        method: "POST",
        data,
        successMessage: "Credit recorded.",
      }),
      invalidatesTags: ["CustomerLedger"],
    }),
    addLedgerPayment: builder.mutation<LedgerCustomer, { customerId: number; amount: string; date: string; notes?: string }>({
      query: ({ customerId, ...data }) => ({
        url: `ledger/customers/${customerId}/payment/`,
        method: "POST",
        data,
        successMessage: "Payment recorded.",
      }),
      invalidatesTags: ["CustomerLedger"],
    }),
  }),
});

export const {
  useListLedgerCustomersQuery,
  useGetLedgerCustomerQuery,
  useCreateLedgerCustomerMutation,
  useUpdateLedgerCustomerMutation,
  useDeleteLedgerCustomerMutation,
  useListLedgerTransactionsQuery,
  useAddLedgerCreditMutation,
  useAddLedgerPaymentMutation,
} = customerLedgerApi;
