import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SnackbarVariant = "success" | "error" | "info";

interface SnackbarState {
  open: boolean;
  message: string;
  variant: SnackbarVariant;
}

const initialState: SnackbarState = {
  open: false,
  message: "",
  variant: "info",
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<{ message: string; variant?: SnackbarVariant }>) => {
      state.open = true;
      state.message = action.payload.message;
      state.variant = action.payload.variant ?? "info";
    },
    hideSnackbar: (state) => {
      state.open = false;
      state.message = "";
      state.variant = "info";
    },
  },
});

export const { showSnackbar, hideSnackbar } = snackbarSlice.actions;
export default snackbarSlice.reducer;
