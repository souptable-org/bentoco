import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  members: [],
  roles: [],
  isLoading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {},
});

export const teamReducer = teamSlice.reducer;
