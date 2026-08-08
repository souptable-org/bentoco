import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  commandPaletteOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setCommandPaletteOpen } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
