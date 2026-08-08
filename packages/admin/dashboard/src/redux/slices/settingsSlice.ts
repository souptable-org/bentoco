import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  whiteLabel: null,
  apiKeys: [],
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
});

export const settingsReducer = settingsSlice.reducer;
