import { api } from "@/store/api";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

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

// ─── Inventory — Items ────────────────────────────────────────────────────────

export interface JwlItem {
  id: string;
  sku: string;
  barcode: string;
  huid: string;
  design: string;
  design_name: string;
  category_name: string;
  metal: string;
  metal_code: string;
  purity: string;
  purity_code: string;
  gross_wt: string;
  net_wt: string;
  status: "IN_STOCK" | "SOLD" | "ISSUED" | "TRANSIT" | "WRITTEN_OFF";
  location_bin: string;
  branch_name: string;
  created_at: string;
}

export interface JwlItemDetail extends JwlItem {
  stone_wt: string;
  less_wt: string;
  charge_wt: string;
  image_urls: string[];
  cost_price: string | null;
  mrp: string | null;
  updated_at: string;
  diamonds: JwlDiamond[];
  stones: JwlStone[];
}

export interface JwlDiamond {
  id: string;
  cut: string;
  color: string;
  clarity: string;
  carat: string;
  certificate_no: string;
  certificate_lab: string;
}

export interface JwlStone {
  id: string;
  stone_type: string;
  count: number;
  weight_carat: string | null;
  description: string;
}

export interface JwlItemListParams {
  branch?: string;
  status?: string;
  purity?: string;
  design?: string;
  search?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export interface JwlStockMovement {
  id: string;
  item: string;
  item_sku: string;
  movement_type: string;
  reference_type: string;
  reference_id: string | null;
  qty: number;
  weight: string;
  rate: string | null;
  value: string | null;
  ts: string;
  notes: string;
  created_at: string;
}

// ─── Stock Takes ─────────────────────────────────────────────────────────────

export interface JwlStockTake {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  conducted_by: string | null;
  notes: string;
  branch_name: string;
  created_at: string;
  updated_at: string;
  lines: JwlStockTakeLine[];
}

export interface JwlStockTakeLine {
  id: number;
  item: string;
  item_sku: string;
  system_qty: number;
  system_wt: string;
  counted_qty: number | null;
  counted_wt: string | null;
  variance: string | null;
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export interface JwlTransfer {
  id: string;
  from_branch: string;
  to_branch: string;
  status: "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED";
  dispatched_at: string | null;
  received_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  lines: JwlTransferLine[];
}

export interface JwlTransferLine {
  id: number;
  item: string;
  item_sku: string;
  item_status: string;
  qty: number;
  weight: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface JwlCustomer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  state_code: string;
  address: string;
  city: string;
  dob: string | null;
  anniversary: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export type InvoiceType = "TAX_INVOICE" | "ESTIMATE" | "CASH_MEMO" | "NON_GST" | "CREDIT_NOTE";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";
export type MakingMode = "PER_GRAM" | "PCT_METAL" | "PER_PIECE";
export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK" | "ADVANCE" | "CHEQUE" | "OTHER";

export interface JwlInvoiceLine {
  id: number;
  line_no: number;
  item: string | null;
  description: string;
  hsn_code: string;
  metal_code: string;
  purity_code: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  rate_per_gram: string;
  metal_value: string;
  making_mode: MakingMode;
  making_rate: string;
  making_charge: string;
  wastage_pct: string;
  wastage_amount: string;
  hallmarking_fee: string;
  stone_value: string;
  gst_rate_pct: string;
  line_metal_part: string;
  gst_amount: string;
  hallmark_gst_amount: string;
  discount_allocated: string;
  line_subtotal: string;
  line_total: string;
}

export interface JwlInvoicePayment {
  id: number;
  mode: PaymentMode;
  amount: string;
  reference: string;
  paid_at: string;
}

export interface JwlOldGoldPurchase {
  id: number;
  metal_code: string;
  description: string;
  gross_wt: string;
  tested_purity: string;
  pure_grams: string;
  buy_rate_per_gram: string;
  deduction_value: string;
}

export interface JwlInvoice {
  id: string;
  voucher_no: string;
  voucher_date: string | null;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  customer: string | null;
  customer_name: string;
  reference_invoice: string | null;
  reference_invoice_no: string;
  place_of_supply_state_code: string;
  seller_state_code: string;
  is_inter_state: boolean;
  gross_amount: string;
  discount_amount: string;
  taxable_amount: string;
  stone_value: string;
  cgst: string;
  sgst: string;
  igst: string;
  hallmark_gst: string;
  round_off: string;
  total_amount: string;
  advance_used: string;
  paid_amount: string;
  balance_amount: string;
  notes: string;
  issued_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
  branch_name: string;
  created_at: string;
  updated_at: string;
  lines: JwlInvoiceLine[];
  payments: JwlInvoicePayment[];
  old_gold_purchases: JwlOldGoldPurchase[];
}

export interface JwlInvoiceLineInput {
  item?: string;
  description?: string;
  hsn_code?: string;
  metal_code?: string;
  purity_code?: string;
  gross_wt?: string;
  net_wt: string;
  stone_wt?: string;
  rate_per_gram: string;
  making_mode?: MakingMode;
  making_rate?: string;
  wastage_pct?: string;
  hallmarking_fee?: string;
  stone_value?: string;
  gst_rate_pct?: string;
}

export interface JwlCreateInvoiceParams {
  customer?: string;
  reference_invoice?: string;
  invoice_type?: InvoiceType;
  voucher_date?: string;
  place_of_supply_state_code?: string;
  seller_state_code?: string;
  discount_amount?: string;
  notes?: string;
  lines: JwlInvoiceLineInput[];
  old_gold?: Array<{
    metal_code?: string;
    description?: string;
    gross_wt: string;
    tested_purity: string;
    buy_rate_per_gram: string;
  }>;
  payments?: Array<{ mode: PaymentMode; amount: string; reference?: string }>;
}

export interface JwlCalculateResult {
  computed_lines: JwlInvoiceLine[];
  gross_amount: string;
  discount_amount: string;
  taxable_amount: string;
  stone_value: string;
  cgst: string;
  sgst: string;
  igst: string;
  hallmark_gst: string;
  round_off: string;
  total_amount: string;
}

export interface JwlInvoiceListParams {
  type?: InvoiceType;
  status?: InvoiceStatus;
  customer?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}

// ─── Rates ────────────────────────────────────────────────────────────────────

export interface JwlLiveRate {
  metal: string;
  metal_name: string;
  purity: string;
  purity_name: string;
  buy_rate: string;
  sell_rate: string;
  source: "OVERRIDE" | "MCX" | "MANUAL";
  is_stale: boolean;
  updated_at: string;
}

export interface JwlRateHistory {
  id: number;
  metal: string;
  purity: string;
  source: string;
  rate_per_gram: string;
  ts: string;
}

export interface JwlRateOverrideParams {
  metal: string;
  purity: string;
  buy_rate: string;
  sell_rate: string;
  reason?: string;
}

export interface JwlRateHistoryParams {
  metal?: string;
  purity?: string;
  from?: string;
  to?: string;
}

// ─── RTK Slice ────────────────────────────────────────────────────────────────

export const jewelleryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // System
    getJewelleryBootstrap: builder.query<JewelleryBootstrapResponse, void>({
      query: () => ({ url: "jwl/v1/system/bootstrap/" }),
      providesTags: ["Jewellery"],
    }),

    // Items
    listItems: builder.query<PaginatedResponse<JwlItem>, JwlItemListParams>({
      query: (params) => ({ url: "jwl/v1/items/", params }),
      providesTags: ["Jewellery"],
    }),
    getItem: builder.query<JwlItemDetail, string>({
      query: (id) => ({ url: `jwl/v1/items/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createItem: builder.mutation<JwlItemDetail, Partial<JwlItemDetail>>({
      query: (data) => ({ url: "jwl/v1/items/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateItem: builder.mutation<JwlItemDetail, { id: string } & Partial<JwlItemDetail>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/items/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),
    scanItem: builder.query<JwlItemDetail, string>({
      query: (code) => ({ url: `jwl/v1/items/scan/${code}/` }),
    }),
    writeOffItem: builder.mutation<JwlStockMovement, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `jwl/v1/items/${id}/write-off/`, method: "POST", data: { reason } }),
      invalidatesTags: ["Jewellery"],
    }),

    // Stock Movements
    listStockMovements: builder.query<PaginatedResponse<JwlStockMovement>, { item?: string; type?: string }>({
      query: (params) => ({ url: "jwl/v1/stock-movements/", params }),
      providesTags: ["Jewellery"],
    }),

    // Stock Takes
    listStockTakes: builder.query<PaginatedResponse<JwlStockTake>, { branch?: string }>({
      query: (params) => ({ url: "jwl/v1/stock-takes/", params }),
      providesTags: ["Jewellery"],
    }),
    createStockTake: builder.mutation<JwlStockTake, { notes?: string }>({
      query: (data) => ({ url: "jwl/v1/stock-takes/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    completeStockTake: builder.mutation<JwlStockTake, string>({
      query: (id) => ({ url: `jwl/v1/stock-takes/${id}/complete/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),

    // Transfers
    listTransfers: builder.query<PaginatedResponse<JwlTransfer>, { status?: string; from_branch?: string }>({
      query: (params) => ({ url: "jwl/v1/transfers/", params }),
      providesTags: ["Jewellery"],
    }),
    createTransfer: builder.mutation<JwlTransfer, Partial<JwlTransfer>>({
      query: (data) => ({ url: "jwl/v1/transfers/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    approveTransfer: builder.mutation<JwlTransfer, string>({
      query: (id) => ({ url: `jwl/v1/transfers/${id}/approve/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),
    dispatchTransfer: builder.mutation<JwlTransfer, string>({
      query: (id) => ({ url: `jwl/v1/transfers/${id}/dispatch/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),
    receiveTransfer: builder.mutation<JwlTransfer, string>({
      query: (id) => ({ url: `jwl/v1/transfers/${id}/receive/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),

    // Billing — Customers
    listCustomers: builder.query<PaginatedResponse<JwlCustomer>, { search?: string }>({
      query: (params) => ({ url: "jwl/v1/sales/customers/", params }),
      providesTags: ["Jewellery"],
    }),
    getCustomer: builder.query<JwlCustomer, string>({
      query: (id) => ({ url: `jwl/v1/sales/customers/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createCustomer: builder.mutation<JwlCustomer, Partial<JwlCustomer>>({
      query: (data) => ({ url: "jwl/v1/sales/customers/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateCustomer: builder.mutation<JwlCustomer, { id: string } & Partial<JwlCustomer>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/sales/customers/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),

    // Billing — Invoices
    listInvoices: builder.query<PaginatedResponse<JwlInvoice>, JwlInvoiceListParams>({
      query: (params) => ({ url: "jwl/v1/sales/invoices/", params }),
      providesTags: ["Jewellery"],
    }),
    getInvoice: builder.query<JwlInvoice, string>({
      query: (id) => ({ url: `jwl/v1/sales/invoices/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createInvoice: builder.mutation<JwlInvoice, JwlCreateInvoiceParams>({
      query: (data) => ({ url: "jwl/v1/sales/invoices/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    issueInvoice: builder.mutation<JwlInvoice, string>({
      query: (id) => ({ url: `jwl/v1/sales/invoices/${id}/issue/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),
    cancelInvoice: builder.mutation<JwlInvoice, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `jwl/v1/sales/invoices/${id}/cancel/`, method: "POST", data: { reason } }),
      invalidatesTags: ["Jewellery"],
    }),
    getInvoicePdf: builder.query<Blob, string>({
      query: (id) => ({ url: `jwl/v1/sales/invoices/${id}/pdf/`, responseType: "blob" as const }),
    }),
    calculateInvoice: builder.mutation<JwlCalculateResult, Omit<JwlCreateInvoiceParams, "customer" | "old_gold" | "payments">>({
      query: (data) => ({ url: "jwl/v1/sales/calculate/", method: "POST", data, silent: true }),
    }),

    // Rates
    getLiveRates: builder.query<JwlLiveRate[], void>({
      query: () => ({ url: "jwl/v1/rates/live/" }),
      providesTags: ["Jewellery"],
    }),
    getRateHistory: builder.query<PaginatedResponse<JwlRateHistory>, JwlRateHistoryParams>({
      query: (params) => ({ url: "jwl/v1/rates/history/", params }),
      providesTags: ["Jewellery"],
    }),
    overrideRate: builder.mutation<unknown, JwlRateOverrideParams>({
      query: (data) => ({ url: "jwl/v1/rates/override/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
  }),
});

export const {
  useGetJewelleryBootstrapQuery,
  useListItemsQuery,
  useGetItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useScanItemQuery,
  useLazyScanItemQuery,
  useWriteOffItemMutation,
  useListStockMovementsQuery,
  useListStockTakesQuery,
  useCreateStockTakeMutation,
  useCompleteStockTakeMutation,
  useListTransfersQuery,
  useCreateTransferMutation,
  useApproveTransferMutation,
  useDispatchTransferMutation,
  useReceiveTransferMutation,
  useGetLiveRatesQuery,
  useGetRateHistoryQuery,
  useOverrideRateMutation,
  useListCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useIssueInvoiceMutation,
  useCancelInvoiceMutation,
  useGetInvoicePdfQuery,
  useLazyGetInvoicePdfQuery,
  useCalculateInvoiceMutation,
} = jewelleryApi;
