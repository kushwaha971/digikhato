import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { api } from "./api";
import authReducer from "./auth-slice";
import snackbarReducer from "./snackbar-slice";
import jewelleryFiltersReducer from "./jewellery-filters-slice";
import moduleReducer from "./module-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    snackbar: snackbarReducer,
    jewelleryFilters: jewelleryFiltersReducer,
    module: moduleReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
