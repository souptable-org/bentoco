import React, { useEffect, useRef, useState } from "react"
import {
  FocusModal,
  Heading,
  Input,
  Text,
  Button as UiButton,
} from "@bentoco/ui"
import {
  agencyUidToDigits,
  type AgencyInvitePayload,
} from "../../lib/agency-invite-cookie"
import { AgencyAccessSuccess } from "./agency-access-success"

export type AgencyInviteConfirmResult = {
  tenantId: string
  status: "ACTIVE" | "NEW" | string
  needsOnboarding: boolean
  agencyUid?: string
  agencyName?: string
  storeName?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invite: AgencyInvitePayload
  merchantEmail: string
  /** Called after handshake (and success screen if no further onboarding). */
  onConfirmed: (result: AgencyInviteConfirmResult) => void
}

/**
 * Medusa FocusModal: agency code → complete-invite.
 * Existing store: success + app download, then done.
 * New store: hands off to parent for setup wizard (success shown after that).
 */
export function AgencyInviteConfirmModal({
  open,
  onOpenChange,
  invite,
  merchantEmail,
  onConfirmed,
}: Props) {
  const [storeName, setStoreName] = useState(invite.storeDisplayName || "")
  const [digits, setDigits] = useState(agencyUidToDigits(invite.agencyUid))
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phase, setPhase] = useState<"form" | "success">("form")
  const [result, setResult] = useState<AgencyInviteConfirmResult | null>(null)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (open) {
      setStoreName(invite.storeDisplayName || "")
      setDigits(agencyUidToDigits(invite.agencyUid))
      setError("")
      setPhase("form")
      setResult(null)
    }
  }, [open, invite])

  const digitList = digits.padEnd(6, " ").slice(0, 6).split("")

  const setDigitAt = (index: number, char: string) => {
    const next = digits.padEnd(6, " ").split("")
    next[index] = char
    const joined = next
      .join("")
      .replace(/\s/g, "")
      .replace(/\D/g, "")
      .slice(0, 6)
    setDigits(joined)
  }

  const handleSubmit = async () => {
    const code = digits.replace(/\D/g, "")
    if (code.length !== 6) {
      setError("Enter all 6 digits of the agency code.")
      return
    }
    if (invite.inviteType !== "existing_merchant" && !storeName.trim()) {
      setError("Enter a store name.")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      await fetch("/api/auth/register-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: merchantEmail,
          role: "MERCHANT",
        }),
      })

      const res = await fetch("/api/agency/complete-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: invite.inviteToken,
          agencyCode: code,
          merchantEmail,
          storeDisplayName:
            storeName.trim() || invite.storeDisplayName || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Could not confirm agency invite.")
      }

      localStorage.setItem("bentoco_admin_mode", "merchant")
      if (data.tenantId) {
        localStorage.setItem("bentoco_active_tenant_id", data.tenantId)
      }

      const next: AgencyInviteConfirmResult = {
        tenantId: data.tenantId,
        status: data.status || "ACTIVE",
        needsOnboarding: !!(data.needsOnboarding || data.status === "NEW"),
        agencyUid: data.agencyUid || invite.agencyUid,
        agencyName: data.agencyName,
        storeName: storeName.trim() || invite.storeDisplayName,
      }
      setResult(next)

      // New store still needs onboarding — parent opens setup; success after that
      if (next.needsOnboarding) {
        onConfirmed(next)
        onOpenChange(false)
        return
      }

      // Existing / ready: end here with success + app download
      setPhase("success")
    } catch (e: any) {
      setError(e?.message || "Confirmation failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content
        portalProps={{
          container:
            typeof document !== "undefined" ? document.body : undefined,
        }}
        overlayProps={{ className: "z-[100]" }}
        className="z-[100]"
      >
        <FocusModal.Header />
        <FocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-10">
          {phase === "success" && result ? (
            <AgencyAccessSuccess
              agencyName={
                result.agencyName || result.agencyUid || "your agency"
              }
              agencyUid={result.agencyUid}
              storeName={result.storeName}
              continueLabel="Go to my store"
              onContinue={() => {
                onConfirmed(result)
                onOpenChange(false)
              }}
            />
          ) : (
            <div className="w-full max-w-md space-y-8">
              <div className="space-y-2 text-center">
                <Heading level="h1" className="txt-compact-xlarge-plus">
                  Confirm agency access
                </Heading>
                <Text className="text-ui-fg-subtle text-sm">
                  Enter the 6-digit agency code to finish the invite. You stay
                  the store owner.
                </Text>
              </div>

              {invite.inviteType !== "existing_merchant" && (
                <div className="space-y-1">
                  <Text size="small" weight="plus">
                    Store name
                  </Text>
                  <Input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Acme Fashion"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="text-center">
                  <Text size="small" weight="plus">
                    Agency code
                  </Text>
                  <Text
                    size="xsmall"
                    className="text-ui-fg-muted mt-1 font-mono"
                  >
                    {invite.agencyUid}
                  </Text>
                </div>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digitList[i]?.trim() || ""}
                      className="h-12 w-11 text-center font-mono text-lg"
                      aria-label={`Digit ${i + 1}`}
                      onChange={(e) => {
                        const only = e.target.value
                          .replace(/\D/g, "")
                          .slice(-1)
                        setDigitAt(i, only)
                        if (only && i < 5) {
                          inputsRef.current[i + 1]?.focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          if (digitList[i]?.trim()) {
                            setDigitAt(i, "")
                          } else if (i > 0) {
                            inputsRef.current[i - 1]?.focus()
                            setDigitAt(i - 1, "")
                          }
                          e.preventDefault()
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <Text className="text-ui-fg-error text-center text-sm">
                  {error}
                </Text>
              )}
            </div>
          )}
        </FocusModal.Body>
        {phase === "form" && (
          <FocusModal.Footer>
            <FocusModal.Close asChild>
              <UiButton variant="secondary" size="small">
                Cancel
              </UiButton>
            </FocusModal.Close>
            <UiButton
              variant="primary"
              size="small"
              isLoading={isSubmitting}
              disabled={digits.replace(/\D/g, "").length !== 6}
              onClick={() => void handleSubmit()}
            >
              Confirm access
            </UiButton>
          </FocusModal.Footer>
        )}
      </FocusModal.Content>
    </FocusModal>
  )
}
