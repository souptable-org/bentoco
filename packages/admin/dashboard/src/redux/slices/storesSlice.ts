import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stores: [],
  selectedStore: null,
  isLoading: false,
  error: null,
};

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
});

export const storesReducer = storesSlice.reducer;
