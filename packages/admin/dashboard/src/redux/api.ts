import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

// Same-origin by default (Vite proxies /api → Medusa). Override via __BACKEND_URL__.
const apiBaseUrl = (() => {
  try {
    // eslint-disable-next-line no-undef
    const configured =
      typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : ""
    if (configured && configured !== "/") {
      return configured.replace(/\/$/, "")
    }
  } catch {
    // ignore
  }
  return ""
})()

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl || undefined,
    prepareHeaders: (headers, { getState }) => {
      // Prefer SDK JWT storage key used by Medusa admin
      const sdkToken =
        typeof window !== "undefined"
          ? localStorage.getItem("bentoco_jwt")
          : null
      const token =
        sdkToken || (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      // Agency store switcher / merchant tab context
      if (typeof window !== "undefined") {
        const tenantId = localStorage.getItem("bentoco_active_tenant_id")
        if (tenantId) {
          headers.set("x-tenant-id", tenantId)
        }
        const storeSession = localStorage.getItem(
          "bentoco_agency_store_session"
        )
        if (storeSession) {
          headers.set("x-agency-store-session", storeSession)
        }
        try {
          const metaRaw = localStorage.getItem(
            "bentoco_agency_store_session_meta"
          )
          if (metaRaw) {
            const meta = JSON.parse(metaRaw)
            if (meta?.memberEmail) {
              headers.set("x-actor-email", meta.memberEmail)
            }
          }
        } catch {
          // ignore
        }
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
    confirmStoreTransfer: builder.mutation<
      any,
      {
        storeId: string
        targetMasterUid: string
        confirmationCode: string
      }
    >({
      query: (body) => ({
        url: '/api/agency/confirm-transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stores', 'Agency'],
    }),
    inviteStore: builder.mutation<
      any,
      {
        agencyId: string
        merchantEmail: string
        storeDisplayName: string
        inviteType?: "new_merchant" | "existing_merchant"
      }
    >({
      query: (body) => ({
        url: "/api/agency/invite-store",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stores"],
    }),
    completeAgencyInvite: builder.mutation<
      any,
      {
        inviteToken: string
        agencyCode: string
        merchantEmail: string
        storeDisplayName?: string
      }
    >({
      query: (body) => ({
        url: "/api/agency/complete-invite",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stores", "Agency"],
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
    getAgencyPartners: builder.query<
      any,
      { tenantId?: string; email?: string }
    >({
      query: ({ tenantId, email }) => {
        const params = new URLSearchParams()
        if (tenantId) params.set("tenantId", tenantId)
        if (email) params.set("email", email)
        return `/api/agency/partners?${params.toString()}`
      },
      providesTags: ["Stores", "Agency"],
    }),
    /** Merchant: request agency link (PENDING). Agency must accept. */
    requestAgencyLink: builder.mutation<
      any,
      {
        agencyCode: string
        tenantId?: string
        email?: string
        merchantEmail?: string
      }
    >({
      query: (body) => ({
        url: "/api/agency/request-link",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stores", "Agency"],
    }),
    /** Agency: accept merchant access request (PENDING → ACTIVE) */
    acceptAgencyLink: builder.mutation<
      any,
      { agencyId: string; tenantId: string; acceptedByEmail: string }
    >({
      query: (body) => ({
        url: "/api/agency/accept-link",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stores", "Agency"],
    }),
    /** Merchant: request revoke (status → REVOKE_REQUESTED). Agency must accept. */
    requestRevokeAgencyAccess: builder.mutation<
      any,
      { agencyId: string; tenantId: string; requestedByEmail: string }
    >({
      query: (body) => ({
        url: "/api/agency/request-revoke",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Stores", "Agency"],
    }),
    /** Agency: accept revoke (or force complete) → REVOKED */
    revokeAgencyAccess: builder.mutation<
      any,
      { agencyId: string; tenantId: string; revokedByEmail: string }
    >({
      query: (body) => ({
        url: "/api/agency/revoke-access",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Stores", "Agency"],
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
  useCompleteAgencyInviteMutation,
  useGetAccessLogQuery,
  useGetAgencyMeQuery,
  useGetAgencyPartnersQuery,
  useRequestAgencyLinkMutation,
  useAcceptAgencyLinkMutation,
  useRequestRevokeAgencyAccessMutation,
  useRevokeAgencyAccessMutation,
} = api;
