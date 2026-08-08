import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  overview: null,
  isLoading: false,
  error: null,
};

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {},
});

export const agencyReducer = agencySlice.reducer;
