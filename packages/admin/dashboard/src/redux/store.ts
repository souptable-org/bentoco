import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authReducer } from './slices/authSlice';
import { agencyReducer } from './slices/agencySlice';
import { storesReducer } from './slices/storesSlice';
import { teamReducer } from './slices/teamSlice';
import { billingReducer } from './slices/billingSlice';
import { settingsReducer } from './slices/settingsSlice';
import { notificationsReducer } from './slices/notificationsSlice';
import { uiReducer } from './slices/uiSlice';
import { api } from './api';

const rootReducer = combineReducers({
  auth: authReducer,
  agency: agencyReducer,
  stores: storesReducer,
  team: teamReducer,
  billing: billingReducer,
  settings: settingsReducer,
  notifications: notificationsReducer,
  ui: uiReducer,
  [api.reducerPath]: api.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
