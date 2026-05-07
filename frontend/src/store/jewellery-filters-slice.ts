import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BillingFilters {
  search: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  customerId: string;
  ordering: string;
  page: number;
}

interface InventoryFilters {
  search: string;
  status: string;
  page: number;
}

interface PledgeFilters {
  status: string;
  customerId: string;
  page: number;
}

interface JewelleryFiltersState {
  billing: BillingFilters;
  inventory: InventoryFilters;
  pledge: PledgeFilters;
}

const initialState: JewelleryFiltersState = {
  billing: { search: "", status: "", type: "", dateFrom: "", dateTo: "", customerId: "", ordering: "-voucher_date", page: 1 },
  inventory: { search: "", status: "", page: 1 },
  pledge: { status: "", customerId: "", page: 1 },
};

const jewelleryFiltersSlice = createSlice({
  name: "jewelleryFilters",
  initialState,
  reducers: {
    setBillingFilters(state, action: PayloadAction<Partial<BillingFilters>>) {
      state.billing = { ...state.billing, ...action.payload };
    },
    resetBillingFilters(state) {
      state.billing = initialState.billing;
    },
    setInventoryFilters(state, action: PayloadAction<Partial<InventoryFilters>>) {
      state.inventory = { ...state.inventory, ...action.payload };
    },
    resetInventoryFilters(state) {
      state.inventory = initialState.inventory;
    },
    setPledgeFilters(state, action: PayloadAction<Partial<PledgeFilters>>) {
      state.pledge = { ...state.pledge, ...action.payload };
    },
    resetPledgeFilters(state) {
      state.pledge = initialState.pledge;
    },
  },
});

export const {
  setBillingFilters, resetBillingFilters,
  setInventoryFilters, resetInventoryFilters,
  setPledgeFilters, resetPledgeFilters,
} = jewelleryFiltersSlice.actions;

export default jewelleryFiltersSlice.reducer;
