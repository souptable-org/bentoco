import { useMemo, useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Text,
  toast,
  usePrompt,
} from "@bentoco/ui"
import { useMe } from "../../../../hooks/api/users"
import { getActiveTenantId } from "../../../../lib/agency-store-url"

type Partner = {
  accessId?: string | null
  agencyId: string
  agencyUid: string
  agencyName: string
  status: string
  ownerEmail?: string
  confirmedAt?: string
  invitedAt?: string
}

type PartnersResponse = {
  partners: Partner[]
  tenantId: string
  ownershipStatus?: string
}

async function agencyFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`)
  }
  return data as T
}

/** OTP-style 6 digit boxes for agency code (AGENCY-XXXXXX). */
function AgencyCodeOtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (digits: string) => void
  disabled?: boolean
}) {
  const digits = value.padEnd(6, " ").slice(0, 6).split("")
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setDigit = (index: number, char: string) => {
    const next = value.padEnd(6, " ").split("")
    next[index] = char
    const joined = next.join("").replace(/\s/g, "").replace(/\D/g, "").slice(0, 6)
    onChange(joined)
  }

  const handleChange = (index: number, raw: string) => {
    const only = raw.replace(/\D/g, "")
    if (!only) {
      setDigit(index, "")
      return
    }
    if (only.length > 1) {
      // paste into one box
      const joined = (value.slice(0, index) + only).replace(/\D/g, "").slice(0, 6)
      onChange(joined)
      const focusAt = Math.min(joined.length, 5)
      refs.current[focusAt]?.focus()
      return
    }
    setDigit(index, only)
    if (index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]?.trim()) {
        setDigit(index, "")
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        setDigit(index - 1, "")
      }
      e.preventDefault()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-11 text-center font-mono text-lg"
          aria-label={`Agency code digit ${i + 1}`}
        />
      ))}
    </div>
  )
}

/**
 * Settings → Users → Agency & Partners
 * Uses TanStack Query (merchant admin Provider) — NOT react-redux RTK,
 * which is only wired for the agency shell AppProvider.
 */
export const AgencyPartnersTable = () => {
  const { user } = useMe()
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const tenantId =
    (typeof window !== "undefined" && getActiveTenantId()) || undefined

  const email = user?.email

  const partnersQuery = useQuery({
    queryKey: ["agency-partners", tenantId, email],
    enabled: !!(email || tenantId),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tenantId) params.set("tenantId", tenantId)
      if (email) params.set("email", email)
      return agencyFetch<PartnersResponse>(
        `/api/agency/partners?${params.toString()}`
      )
    },
  })

  const data = partnersQuery.data
  const isLoading = partnersQuery.isLoading
  const isError = partnersQuery.isError
  const error = partnersQuery.error as Error | null

  const [addOpen, setAddOpen] = useState(false)
  const [otpDigits, setOtpDigits] = useState("")
  /** Which partner row is mid-revoke (avoids all rows spinning). */
  const [revokingKey, setRevokingKey] = useState<string | null>(null)

  const partners: Partner[] = useMemo(
    () => (Array.isArray(data?.partners) ? data.partners : []),
    [data]
  )

  const resolvedTenantId = data?.tenantId || tenantId

  /** Merchant requests access — PENDING until agency accepts. */
  const requestLinkMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!resolvedTenantId && !email) {
        throw new Error("Could not resolve your store. Sign in again.")
      }
      return agencyFetch<{
        message?: string
        status?: string
        agencyName?: string
        agencyUid?: string
      }>("/api/agency/request-link", {
        method: "POST",
        body: JSON.stringify({
          agencyCode: code,
          tenantId: resolvedTenantId,
          email,
          merchantEmail: email,
        }),
      })
    },
    onSuccess: (result) => {
      toast.success(
        result.message ||
          "Access requested. Agency must Accept from their dashboard."
      )
      setAddOpen(false)
      setOtpDigits("")
      void queryClient.invalidateQueries({ queryKey: ["agency-partners"] })
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not request agency access.")
    },
  })

  /** Merchant only requests — status becomes REVOKE_REQUESTED until agency accepts. */
  const requestRevokeMutation = useMutation({
    mutationFn: async (partner: Partner) => {
      if (!resolvedTenantId || !email) {
        throw new Error("Missing tenant or user email.")
      }
      return agencyFetch<{ message?: string; status?: string }>(
        "/api/agency/request-revoke",
        {
          method: "POST",
          body: JSON.stringify({
            agencyId: partner.agencyUid || partner.agencyId,
            tenantId: resolvedTenantId,
            requestedByEmail: email,
          }),
        }
      )
    },
    onSuccess: (result) => {
      toast.success(
        result.message ||
          "Revoke requested. Agency will see Revoke requested until they accept."
      )
      setRevokingKey(null)
      void queryClient.invalidateQueries({ queryKey: ["agency-partners"] })
    },
    onError: (e: Error) => {
      setRevokingKey(null)
      toast.error(e.message || "Could not request revoke.")
    },
  })

  const handleRequestLink = () => {
    const digits = otpDigits.replace(/\D/g, "")
    if (digits.length !== 6) {
      toast.error("Enter all 6 digits of the agency code.")
      return
    }
    requestLinkMutation.mutate(digits)
  }

  /**
   * Fat-finger safe request (not instant revoke):
   * - Button: "Request revoke"
   * - Modal: type agency UID
   * - Result: REVOKE_REQUESTED — agency must Accept revoke in their Stores ⋮ menu
   */
  const handleRequestRevoke = async (partner: Partner) => {
    const uidToType = (partner.agencyUid || partner.agencyId || "").trim()
    if (!uidToType) {
      toast.error("Missing agency UID for this partner.")
      return
    }

    const verified = await prompt({
      title: "Request revoke of agency access",
      description: `This sends a revoke request for ${partner.agencyName || "this agency"}. Status becomes "Revoke requested". Access ends only after the agency accepts in their dashboard (⋮ → Accept revoke).`,
      variant: "danger",
      verificationText: uidToType,
      verificationInstruction:
        "To confirm the request, type the agency UID exactly: {val}",
      confirmText: "Yes, request revoke",
      cancelText: "Keep access",
    })

    if (!verified) {
      return
    }

    const key = partner.accessId || partner.agencyId || partner.agencyUid
    setRevokingKey(key)
    requestRevokeMutation.mutate(partner)
  }

  const statusColor = (status: string) => {
    const s = (status || "").toUpperCase()
    if (s === "ACTIVE") return "green" as const
    if (s === "PENDING") return "orange" as const
    if (s === "REVOKE_REQUESTED") return "orange" as const
    return "grey" as const
  }

  const statusLabel = (status: string) => {
    const s = (status || "").toUpperCase()
    if (s === "REVOKE_REQUESTED") return "Revoke requested"
    if (s === "PENDING") return "Access requested"
    return status
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-1 px-6 py-4">
        <Heading level="h2">Agency &amp; Partners</Heading>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Text size="small" weight="plus">
            Add agency
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            Ask your agency for their 6-digit code (from AGENCY-XXXXXX).
          </Text>
        </div>

        <FocusModal
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) setOtpDigits("")
          }}
        >
          <FocusModal.Trigger asChild>
            <Button variant="secondary" size="small">
              Request agency access
            </Button>
          </FocusModal.Trigger>
          <FocusModal.Content
            portalProps={{
              container:
                typeof document !== "undefined" ? document.body : undefined,
            }}
            overlayProps={{ className: "z-[100]" }}
            className="z-[100]"
          >
            <FocusModal.Header />
            <FocusModal.Body className="flex flex-col items-center justify-center gap-6 px-6 py-10">
              <div className="max-w-md space-y-2 text-center">
                <FocusModal.Title className="txt-compact-xlarge-plus">
                  Request agency access
                </FocusModal.Title>
                <FocusModal.Description className="text-ui-fg-subtle text-sm">
                  Enter the 6-digit agency code. This only sends a request —
                  the agency must Accept on their Stores dashboard before they
                  can open your store.
                </FocusModal.Description>
              </div>
              <div className="space-y-2 text-center">
                <Text size="small" weight="plus">
                  Agency code
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  AGENCY-
                  <span className="text-ui-fg-base font-mono">
                    {otpDigits.padEnd(6, "·")}
                  </span>
                </Text>
              </div>
              <AgencyCodeOtpInput
                value={otpDigits}
                onChange={setOtpDigits}
                disabled={requestLinkMutation.isPending}
              />
              <Text
                size="xsmall"
                className="text-ui-fg-muted max-w-sm text-center"
              >
                Tip: paste all 6 digits at once, or type one box at a time
                (like OTP).
              </Text>
            </FocusModal.Body>
            <FocusModal.Footer>
              <FocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button
                variant="primary"
                size="small"
                isLoading={requestLinkMutation.isPending}
                disabled={otpDigits.replace(/\D/g, "").length !== 6}
                onClick={handleRequestLink}
              >
                Send request
              </Button>
            </FocusModal.Footer>
          </FocusModal.Content>
        </FocusModal>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ui-fg-subtle border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Agency</th>
              <th className="px-6 py-3 font-medium">UID</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Since</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="text-ui-fg-muted px-6 py-8 text-center"
                >
                  Loading partners…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td
                  colSpan={5}
                  className="text-ui-fg-error px-6 py-8 text-center"
                >
                  {error?.message ||
                    "Could not load partners. Is the API running?"}
                </td>
              </tr>
            )}
            {!isLoading && !isError && partners.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-ui-fg-muted px-6 py-8 text-center"
                >
                  No agencies yet. Use Request agency access and enter their
                  6-digit code.
                </td>
              </tr>
            )}
            {partners.map((p) => (
              <tr
                key={p.accessId || p.agencyId}
                className="border-b last:border-0"
              >
                <td className="px-6 py-3">
                  <div className="font-medium">{p.agencyName}</div>
                  {p.ownerEmail && (
                    <div className="text-ui-fg-muted text-xs">
                      {p.ownerEmail}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 font-mono text-xs">{p.agencyUid}</td>
                <td className="px-6 py-3">
                  <Badge size="2xsmall" color={statusColor(p.status)}>
                    {statusLabel(p.status)}
                  </Badge>
                </td>
                <td className="text-ui-fg-subtle px-6 py-3 text-xs">
                  {p.confirmedAt
                    ? new Date(p.confirmedAt).toLocaleDateString()
                    : p.invitedAt
                      ? new Date(p.invitedAt).toLocaleDateString()
                      : "—"}
                </td>
                <td className="px-6 py-3 text-right">
                  {p.status === "ACTIVE" && (
                    <Button
                      variant="secondary"
                      size="small"
                      isLoading={
                        revokingKey ===
                        (p.accessId || p.agencyId || p.agencyUid)
                      }
                      onClick={() => void handleRequestRevoke(p)}
                    >
                      Request revoke
                    </Button>
                  )}
                  {p.status === "PENDING" && (
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Waiting for agency to accept
                    </Text>
                  )}
                  {p.status === "REVOKE_REQUESTED" && (
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Waiting for agency to accept revoke
                    </Text>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}
