import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:9000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Stores', 'Team', 'Billing', 'Settings', 'Notifications', 'Agency'],
  endpoints: (builder) => ({
    getAgencyOverview: builder.query<any, void>({
      query: () => '/api/agency/overview',
      providesTags: ['Agency'],
    }),
    getAgencyStores: builder.query<any, string | void>({
      query: (agencyId) =>
        agencyId
          ? `/api/agency/stores?agencyId=${encodeURIComponent(agencyId)}`
          : '/api/agency/stores',
      providesTags: ['Stores'],
    }),
    getAgencyTeam: builder.query<any, string | void>({
      query: (agencyId) =>
        agencyId
          ? `/api/agency/team?agencyId=${encodeURIComponent(agencyId)}`
          : '/api/agency/team',
      providesTags: ['Team'],
    }),
    getAgencyBilling: builder.query<any, void>({
      query: () => '/api/agency/billing',
      providesTags: ['Billing'],
    }),
    initiateStoreTransfer: builder.mutation<any, { storeId: string; targetMasterUid: string; targetRole?: string }>({
      query: (body) => ({
        url: '/api/agency/transfer-store',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stores', 'Agency'],
    }),
    confirmStoreTransfer: builder.mutation<any, { storeId: string; confirmationCode: string }>({
      query: (body) => ({
        url: '/api/agency/confirm-transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stores', 'Agency'],
    }),
    inviteStore: builder.mutation<any, { agencyId: string; merchantEmail: string; storeDisplayName: string }>({
      query: (body) => ({
        url: '/api/agency/invite-store',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stores'],
    }),
    getAccessLog: builder.query<
      any,
      { agencyId: string; tenantId?: string }
    >({
      query: ({ agencyId, tenantId }) => {
        const params = new URLSearchParams({ agencyId })
        if (tenantId) {
          params.set("tenantId", tenantId)
        }
        return `/api/agency/access-log?${params.toString()}`
      },
    }),
    getAgencyMe: builder.query<any, string>({
      query: (email) =>
        `/api/agency/me?email=${encodeURIComponent(email)}`,
      providesTags: ["Agency"],
    }),
  }),
});

export const {
  useGetAgencyOverviewQuery,
  useGetAgencyStoresQuery,
  useGetAgencyTeamQuery,
  useGetAgencyBillingQuery,
  useInitiateStoreTransferMutation,
  useConfirmStoreTransferMutation,
  useInviteStoreMutation,
  useGetAccessLogQuery,
  useGetAgencyMeQuery,
} = api;
