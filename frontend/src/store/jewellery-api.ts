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
  hallmark_status: "NOT_HALLMARKED" | "HALLMARKED" | "HUID_ASSIGNED";
  design: string;
  design_name: string;
  category_name: string;
  hsn_code: string;
  metal: string;
  metal_code: string;
  purity: string;
  purity_code: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  charge_wt: string;
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
  purity_code?: string;
  metal_code?: string;
  hallmark_status?: string;
  design?: string;
  design_name?: string;
  search?: string;
  page?: number;
  page_size?: number;
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

export interface JwlTransferCreateParams {
  from_branch?: string;
  to_branch: string;
  notes?: string;
  lines: Array<{ item: string; qty: number; weight?: string }>;
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
  huid: string;
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
  customer_gstin: string;
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
  e_invoice_irn: string;
  e_invoice_qr: string;
  e_invoice_is_simulated: boolean;
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

export interface JwlInvoiceSharePayload {
  status: "ready";
  channel: "WA" | "SMS" | "EMAIL";
  to: string;
  message: string;
  share_url: string;
}

export interface JwlInvoiceLineInput {
  item?: string;
  description?: string;
  huid?: string;
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
  ordering?: "-voucher_date" | "voucher_date" | "-created_at" | "created_at";
  page?: number;
}

// ─── Master Data ──────────────────────────────────────────────────────────────

export interface JwlMetal {
  id: string;
  code: string;
  name: string;
  default_unit: string;
}

export interface JwlPurity {
  id: string;
  metal: string;
  metal_code: string;
  code: string;
  pct: string;
}

export interface JwlCategoryNode {
  id: string;
  parent: string | null;
  name: string;
  hsn_code: string;
  default_making_charge_formula: string;
  default_wastage_pct: string;
  children: JwlCategoryNode[];
}

export interface JwlDesign {
  id: string;
  category: string | null;
  code: string;
  name: string;
  image_urls: string[];
  default_weight: string;
  default_stones: string;
  default_labour: string;
  bom: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface JwlTaxSlab {
  id: string;
  name: string;
  rate_pct: string;
  applies_to: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwlNumberSeries {
  id: string;
  voucher_type: string;
  prefix: string;
  next_number: number;
  padding: number;
  created_at: string;
  updated_at: string;
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

// ─── Admin Controls ───────────────────────────────────────────────────────────

export interface JwlAdminFlags {
  [key: string]: boolean;
}

export interface JwlAdminControls {
  branch_name: string;
  feature_flags: JwlAdminFlags;
  einvoice_applicable: boolean;
  updated_at?: string | null;
}

export interface JwlTrashItem {
  entity: string;
  id: string;
  label: string;
  deleted_at: string;
}

export interface JwlLockPeriodParams {
  entity: "global" | "branch";
  branch_name?: string;
  lock_period_end: string;
}

// ─── Karigar & Orders ─────────────────────────────────────────────────────────

export interface JwlKarigar {
  id: string;
  code: string;
  name: string;
  mobile: string;
  kyc_pan: string;
  kyc_aadhaar_masked?: string;
  default_labour_rate: string | null;
  default_wastage_pct: string;
  specialization: string;
  is_active: boolean;
  total_pure_issued?: string;
  total_pure_received?: string;
  avg_wastage_pct?: string;
  open_issues?: number;
  branch_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface JwlOutstandingParty {
  id: string;
  customer_id: string;
  customer_name: string;
  mobile: string;
  amount_balance: string;
  metal_balance_grams: string;
  last_txn_date: string | null;
  overdue_90_plus: boolean;
  age_days: number;
  ageing_bucket: "0_30" | "31_60" | "61_90" | "90_plus";
}

export interface JwlOutstandingMovement {
  id: string;
  balance: string;
  movement_type: string;
  amount_delta: string;
  metal_delta_grams: string;
  reference_type: string;
  reference_id: string;
  notes: string;
  txn_date: string;
  created_at: string;
}

export interface JwlOutstandingDetail {
  id: string;
  customer: string;
  customer_name: string;
  customer_mobile: string;
  amount_balance: string;
  metal_balance_grams: string;
  last_txn_date: string | null;
  movements: JwlOutstandingMovement[];
}

export interface JwlPuritySummaryRow {
  metal_code: string;
  purity_code: string;
  item_count: number;
  gross_wt_total: string;
  net_wt_total: string;
  charge_wt_total: string;
}

export type OrderStatus =
  | "BOOKED" | "METAL_ISSUED" | "WIP" | "KARIGAR_RECEIVED"
  | "QC" | "HALLMARKED" | "READY" | "DELIVERED" | "CLOSED" | "CANCELLED";

export interface JwlCustomerOrder {
  id: string;
  order_no: string;
  order_date: string;
  customer: string;
  customer_name: string;
  design: string | null;
  expected_delivery: string | null;
  advance_amount: string;
  status: OrderStatus;
  notes: string;
  created_at: string;
}

export interface JwlKarigarIssue {
  id: string;
  voucher_no: string;
  date: string;
  karigar: string;
  karigar_name: string;
  order: string | null;
  metal: string;
  gross_wt_issued: string;
  tunch_pct: string;
  pure_gold_wt_issued: string;
  notes: string;
  created_at: string;
}

export interface JwlKarigarReceipt {
  id: string;
  voucher_no: string;
  date: string;
  karigar: string;
  karigar_name: string;
  issue: string;
  gross_wt_received: string;
  net_wt: string;
  stone_wt: string;
  final_purity_pct: string;
  pure_gold_wt_received: string;
  wastage_actual_pct: string;
  labour_amount: string;
  pure_diff: string;
  status: string;
  created_at: string;
}

// ─── Gold Pledge Loans ────────────────────────────────────────────────────────

export interface JwlLoanScheme {
  id: string;
  name: string;
  ltv_pct: string;
  interest_method: "SIMPLE" | "COMPOUND" | "FLAT" | "DAILY";
  interest_rate_pct: string;
  min_tenure: number;
  max_tenure: number;
  late_fee_pct: string;
  is_active: boolean;
}

export interface JwlPledgeItem {
  id: number;
  line_no: number;
  description: string;
  metal: string;
  purity: string;
  gross_wt: string;
  net_wt: string;
  stone_wt: string;
  valuation_rate: string;
  valuation_amount: string;
  is_released: boolean;
}

export interface JwlPledgeLoan {
  id: string;
  loan_no: string;
  loan_date: string;
  customer: string;
  customer_name: string;
  scheme: string;
  scheme_name: string;
  principal: string;
  interest_rate_pct: string;
  interest_method: string;
  tenure_months: number;
  ltv_pct: string;
  status: "ACTIVE" | "RENEWED" | "CLOSED" | "AUCTIONED" | "LOSS";
  maturity_date: string | null;
  pledge_items: JwlPledgeItem[];
  created_at: string;
}

export interface JwlLoanRepayment {
  id: string;
  loan: string;
  date: string;
  principal_paid: string;
  interest_paid: string;
  mode: string;
  reference: string;
  items_released: string[];
  balance_after: string;
  created_at: string;
}

export interface JwlInterestPreview {
  interest: string;
  total_due: string;
  method: string;
  days?: number;
  months?: number;
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
    scanItem: builder.query<JwlItemDetail, { code: string; status?: string }>({
      query: ({ code, status }) => ({ url: `jwl/v1/items/scan/${code}/`, params: { status } }),
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
    createTransfer: builder.mutation<JwlTransfer, JwlTransferCreateParams>({
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
    sendInvoice: builder.mutation<JwlInvoiceSharePayload, { id: string; channel: "WA" | "SMS" | "EMAIL"; to: string }>({
      query: ({ id, channel, to }) => ({
        url: `jwl/v1/sales/invoices/${id}/send/`,
        method: "POST",
        data: { channel, to },
      }),
    }),
    generateEInvoice: builder.mutation<JwlInvoice, string>({
      query: (id) => ({ url: `jwl/v1/sales/invoices/${id}/e-invoice/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),

    convertToInvoice: builder.mutation<JwlInvoice, string>({
      query: (id) => ({ url: `jwl/v1/sales/invoices/${id}/convert-to-invoice/`, method: "POST" }),
      invalidatesTags: ["Jewellery"],
    }),

    // Master — Metals
    listMetals: builder.query<JwlMetal[], void>({
      query: () => ({ url: "jwl/v1/metals/" }),
      providesTags: ["Jewellery"],
    }),

    // Master — Purities
    listPurities: builder.query<JwlPurity[], { metal?: string }>({
      query: (params) => ({ url: "jwl/v1/purities/", params }),
      providesTags: ["Jewellery"],
    }),

    // Master — Categories (tree)
    listCategories: builder.query<JwlCategoryNode[], void>({
      query: () => ({ url: "jwl/v1/categories/" }),
      providesTags: ["Jewellery"],
    }),
    createCategory: builder.mutation<JwlCategoryNode, Partial<JwlCategoryNode>>({
      query: (data) => ({ url: "jwl/v1/categories/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateCategory: builder.mutation<JwlCategoryNode, { id: string } & Partial<JwlCategoryNode>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/categories/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `jwl/v1/categories/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Jewellery"],
    }),

    // Master — Designs
    listDesigns: builder.query<PaginatedResponse<JwlDesign>, { category?: string; search?: string; page?: number }>({
      query: (params) => ({ url: "jwl/v1/designs/", params }),
      providesTags: ["Jewellery"],
    }),
    getDesign: builder.query<JwlDesign, string>({
      query: (id) => ({ url: `jwl/v1/designs/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createDesign: builder.mutation<JwlDesign, Partial<JwlDesign>>({
      query: (data) => ({ url: "jwl/v1/designs/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateDesign: builder.mutation<JwlDesign, { id: string } & Partial<JwlDesign>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/designs/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),
    deleteDesign: builder.mutation<void, string>({
      query: (id) => ({ url: `jwl/v1/designs/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Jewellery"],
    }),

    // Master — Tax Slabs
    listTaxSlabs: builder.query<PaginatedResponse<JwlTaxSlab>, void>({
      query: () => ({ url: "jwl/v1/tax-slabs/" }),
      providesTags: ["Jewellery"],
    }),
    createTaxSlab: builder.mutation<JwlTaxSlab, Partial<JwlTaxSlab>>({
      query: (data) => ({ url: "jwl/v1/tax-slabs/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateTaxSlab: builder.mutation<JwlTaxSlab, { id: string } & Partial<JwlTaxSlab>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/tax-slabs/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),

    // Master — Number Series
    listNumberSeries: builder.query<PaginatedResponse<JwlNumberSeries>, void>({
      query: () => ({ url: "jwl/v1/number-series/" }),
      providesTags: ["Jewellery"],
    }),
    updateNumberSeries: builder.mutation<JwlNumberSeries, { id: string } & Partial<JwlNumberSeries>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/number-series/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
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

    // Admin Controls
    getAdminFeatureFlags: builder.query<JwlAdminControls, void>({
      query: () => ({ url: "jwl/v1/admin/feature-flags/" }),
      providesTags: ["Jewellery"],
    }),
    updateAdminFeatureFlags: builder.mutation<JwlAdminControls, { feature_flags?: JwlAdminFlags; einvoice_applicable?: boolean }>({
      query: (data) => ({ url: "jwl/v1/admin/feature-flags/", method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),
    listAdminTrash: builder.query<JwlTrashItem[], void>({
      query: () => ({ url: "jwl/v1/admin/trash/" }),
      providesTags: ["Jewellery"],
    }),
    restoreFromTrash: builder.mutation<{ restored: boolean }, { entity: string; id: string }>({
      query: ({ entity, id }) => ({
        url: `jwl/v1/admin/trash/${entity}/${id}/restore/`,
        method: "POST",
      }),
      invalidatesTags: ["Jewellery"],
    }),
    setLockPeriod: builder.mutation<{ lock_period_end: string }, JwlLockPeriodParams>({
      query: (data) => ({ url: "jwl/v1/admin/lock-period/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),

    // Karigar
    listKarigars: builder.query<PaginatedResponse<JwlKarigar>, { search?: string; active_only?: boolean }>({
      query: (params) => ({ url: "jwl/v1/karigar/", params }),
      providesTags: ["Jewellery"],
    }),
    getKarigar: builder.query<JwlKarigar, string>({
      query: (id) => ({ url: `jwl/v1/karigar/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createKarigar: builder.mutation<JwlKarigar, Partial<JwlKarigar>>({
      query: (data) => ({ url: "jwl/v1/karigar/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    updateKarigar: builder.mutation<JwlKarigar, { id: string } & Partial<JwlKarigar>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/karigar/${id}/`, method: "PATCH", data }),
      invalidatesTags: ["Jewellery"],
    }),
    listOrders: builder.query<PaginatedResponse<JwlCustomerOrder>, { status?: string; customer?: string; karigar?: string; karigar_id?: string }>({
      query: (params) => {
        const { karigar, karigar_id, ...rest } = params;
        return { url: "jwl/v1/orders/", params: { ...rest, karigar_id: karigar_id ?? karigar } };
      },
      providesTags: ["Jewellery"],
    }),
    createOrder: builder.mutation<JwlCustomerOrder, Partial<JwlCustomerOrder>>({
      query: (data) => ({ url: "jwl/v1/orders/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    advanceOrderStatus: builder.mutation<JwlCustomerOrder, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `jwl/v1/orders/${id}/advance/`, method: "POST", data: { status } }),
      invalidatesTags: ["Jewellery"],
    }),
    listKarigarIssues: builder.query<PaginatedResponse<JwlKarigarIssue>, { karigar?: string; karigar_id?: string; order?: string; order_id?: string }>({
      query: (params) => {
        const { karigar, karigar_id, order, order_id, ...rest } = params;
        return {
          url: "jwl/v1/karigar-issues/",
          params: {
            ...rest,
            karigar_id: karigar_id ?? karigar,
            order_id: order_id ?? order,
          },
        };
      },
      providesTags: ["Jewellery"],
    }),
    createKarigarIssue: builder.mutation<JwlKarigarIssue, Record<string, unknown>>({
      query: (data) => ({ url: "jwl/v1/karigar-issues/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    listKarigarReceipts: builder.query<PaginatedResponse<JwlKarigarReceipt>, { karigar?: string; karigar_id?: string; issue?: string; issue_id?: string }>({
      query: (params) => {
        const { karigar, karigar_id, issue, issue_id, ...rest } = params;
        return {
          url: "jwl/v1/karigar-receipts/",
          params: {
            ...rest,
            karigar_id: karigar_id ?? karigar,
            issue_id: issue_id ?? issue,
          },
        };
      },
      providesTags: ["Jewellery"],
    }),
    createKarigarReceipt: builder.mutation<JwlKarigarReceipt, Record<string, unknown>>({
      query: (data) => ({ url: "jwl/v1/karigar-receipts/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),

    // Outstanding
    listOutstanding: builder.query<
      JwlOutstandingParty[],
      { ageing?: "30" | "60" | "90" | "90+"; customer?: string; branch_name?: string; include_zero?: boolean }
    >({
      query: (params) => ({ url: "jwl/v1/outstanding/", params }),
      providesTags: ["Jewellery"],
    }),
    exportOutstandingCsv: builder.query<
      Blob,
      { ageing?: "30" | "60" | "90" | "90+"; customer?: string; branch_name?: string; include_zero?: boolean }
    >({
      query: (params) => ({ url: "jwl/v1/outstanding/export/", params, responseType: "blob" as const }),
    }),
    getOutstandingParty: builder.query<JwlOutstandingDetail, string>({
      query: (id) => ({ url: `jwl/v1/outstanding/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    postOutstandingAdjustment: builder.mutation<
      {
        movement_id: string;
        movement_type: string;
        amount_delta: string;
        metal_delta_grams: string;
        amount_balance: string;
        metal_balance_grams: string;
        last_txn_date: string | null;
      },
      {
        id: string;
        movement_type?: "MANUAL_ADJUSTMENT";
        amount_delta: string;
        metal_delta_grams: string;
        reference_type?: string;
        reference_id?: string;
        notes: string;
        txn_date?: string;
      }
    >({
      query: ({ id, ...data }) => ({ url: `jwl/v1/outstanding/${id}/adjust/`, method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),

    // Inventory purity summary
    listItemPuritySummary: builder.query<JwlPuritySummaryRow[], { metal_code?: string }>({
      query: (params) => ({ url: "jwl/v1/items/purity-summary/", params }),
      providesTags: ["Jewellery"],
    }),

    // Gold Pledge Loans
    listLoanSchemes: builder.query<PaginatedResponse<JwlLoanScheme>, void>({
      query: () => ({ url: "jwl/v1/loan-schemes/" }),
      providesTags: ["Jewellery"],
    }),
    createLoanScheme: builder.mutation<JwlLoanScheme, Partial<JwlLoanScheme>>({
      query: (data) => ({ url: "jwl/v1/loan-schemes/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    listPledgeLoans: builder.query<PaginatedResponse<JwlPledgeLoan>, { status?: string; customer?: string }>({
      query: (params) => ({ url: "jwl/v1/pledge-loans/", params }),
      providesTags: ["Jewellery"],
    }),
    getPledgeLoan: builder.query<JwlPledgeLoan, string>({
      query: (id) => ({ url: `jwl/v1/pledge-loans/${id}/` }),
      providesTags: ["Jewellery"],
    }),
    createPledgeLoan: builder.mutation<JwlPledgeLoan, Record<string, unknown>>({
      query: (data) => ({ url: "jwl/v1/pledge-loans/", method: "POST", data }),
      invalidatesTags: ["Jewellery"],
    }),
    getPledgeLoanInterest: builder.query<JwlInterestPreview, { id: string; days?: number }>({
      query: ({ id, days }) => ({ url: `jwl/v1/pledge-loans/${id}/interest/`, params: { days } }),
    }),
    repayPledgeLoan: builder.mutation<JwlLoanRepayment, { id: string } & Record<string, unknown>>({
      query: ({ id, ...data }) => ({ url: `jwl/v1/pledge-loans/${id}/repay/`, method: "POST", data }),
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
  useSendInvoiceMutation,
  useGenerateEInvoiceMutation,
  useConvertToInvoiceMutation,
  useListMetalsQuery,
  useListPuritiesQuery,
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListDesignsQuery,
  useGetDesignQuery,
  useCreateDesignMutation,
  useUpdateDesignMutation,
  useDeleteDesignMutation,
  useListTaxSlabsQuery,
  useCreateTaxSlabMutation,
  useUpdateTaxSlabMutation,
  useListNumberSeriesQuery,
  useUpdateNumberSeriesMutation,
  useGetAdminFeatureFlagsQuery,
  useUpdateAdminFeatureFlagsMutation,
  useListAdminTrashQuery,
  useRestoreFromTrashMutation,
  useSetLockPeriodMutation,
  useListKarigarsQuery,
  useGetKarigarQuery,
  useCreateKarigarMutation,
  useUpdateKarigarMutation,
  useListOrdersQuery,
  useCreateOrderMutation,
  useAdvanceOrderStatusMutation,
  useListKarigarIssuesQuery,
  useCreateKarigarIssueMutation,
  useListKarigarReceiptsQuery,
  useCreateKarigarReceiptMutation,
  useListOutstandingQuery,
  useLazyExportOutstandingCsvQuery,
  useGetOutstandingPartyQuery,
  usePostOutstandingAdjustmentMutation,
  useListItemPuritySummaryQuery,
  useListLoanSchemesQuery,
  useCreateLoanSchemeMutation,
  useListPledgeLoansQuery,
  useGetPledgeLoanQuery,
  useCreatePledgeLoanMutation,
  useGetPledgeLoanInterestQuery,
  useRepayPledgeLoanMutation,
} = jewelleryApi;
