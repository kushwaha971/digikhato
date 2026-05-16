import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { type AppModuleCode } from "@/lib/routes";

const STORAGE_KEY = "selectedModule";

function readFromStorage(): AppModuleCode | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(STORAGE_KEY) as AppModuleCode | null) ?? null;
  } catch {
    return null;
  }
}

function writeToStorage(module: AppModuleCode | null): void {
  if (typeof window === "undefined") return;
  try {
    if (module) {
      localStorage.setItem(STORAGE_KEY, module);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface ModuleState {
  selectedModule: AppModuleCode | null;
}

const initialState: ModuleState = {
  selectedModule: readFromStorage(),
};

const moduleSlice = createSlice({
  name: "module",
  initialState,
  reducers: {
    setSelectedModule: (state, action: PayloadAction<AppModuleCode | null>) => {
      state.selectedModule = action.payload;
      writeToStorage(action.payload);
    },
  },
});

export const { setSelectedModule } = moduleSlice.actions;
export default moduleSlice.reducer;
