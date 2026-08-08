import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  overview: null,
  invoices: [],
  isLoading: false,
  error: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {},
});

export const billingReducer = billingSlice.reducer;
