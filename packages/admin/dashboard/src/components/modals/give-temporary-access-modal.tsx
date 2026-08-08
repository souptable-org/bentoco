import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { FocusModal } from "@bentoco/ui"
import { useGetAgencyStoresQuery } from "@/redux/api"

interface GiveTemporaryAccessModalProps {
  memberEmail: string
  memberName: string
  trigger?: React.ReactNode
}

export function GiveTemporaryAccessModal({
  memberEmail,
  memberName,
  trigger,
}: GiveTemporaryAccessModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState("")
  const [expiryHours, setExpiryHours] = useState("2")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: storesData } = useGetAgencyStoresQuery()
  const stores = storesData?.stores || [
    { id: "AGENCY-849201", name: "Urban Threads" },
    { id: "AGENCY-102943", name: "Apex Gear" },
    { id: "AGENCY-304928", name: "LuxeLiving" },
  ]

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSelectedStoreId("")
      setExpiryHours("2")
    }
  }

  const handleGrantAccess = async () => {
    if (!selectedStoreId) {
      alert("Please select a client store.")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/agency/grant-temporary-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberEmail,
          storeId: selectedStoreId,
          expiryHours: parseInt(expiryHours, 10),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to grant temporary access.")
      }

      alert(
        `Temporary access code generated successfully! Sent to ${memberEmail}.`
      )
      handleOpenChange(false)
    } catch (err: any) {
      alert(err.message || "An error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FocusModal open={isOpen} onOpenChange={handleOpenChange}>
      <FocusModal.Trigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Give Temporary Access
          </Button>
        )}
      </FocusModal.Trigger>
      <FocusModal.Content
        portalProps={{ container: typeof document !== "undefined" ? document.body : undefined }}
        overlayProps={{ className: "z-[100]" }}
        className="z-[100]"
      >
        <FocusModal.Header />
        <FocusModal.Body className="agency-scroll overflow-y-auto px-6 py-8 sm:px-10">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <FocusModal.Title className="txt-compact-xlarge-plus text-ui-fg-base">
                Give Temporary Access
              </FocusModal.Title>
              <FocusModal.Description className="text-ui-fg-subtle text-sm">
                Generate and email a single-use login code for{" "}
                <strong className="text-ui-fg-base">{memberName}</strong> (
                {memberEmail}).
              </FocusModal.Description>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="store-select"
                  className="text-ui-fg-muted block text-xs font-semibold uppercase tracking-wider"
                >
                  Select Client Store
                </label>
                <div className="relative">
                  <select
                    id="store-select"
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-ui-border-interactive w-full appearance-none rounded-md border px-4 py-3 text-sm transition-all focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Choose Store --
                    </option>
                    {stores.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-ui-fg-muted pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="expiry-select"
                  className="text-ui-fg-muted block text-xs font-semibold uppercase tracking-wider"
                >
                  Access Expiration Duration
                </label>
                <div className="relative">
                  <select
                    id="expiry-select"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-ui-border-interactive w-full appearance-none rounded-md border px-4 py-3 text-sm transition-all focus:outline-none"
                  >
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                  <div className="text-ui-fg-muted pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <FocusModal.Close asChild>
            <Button variant="outline" size="sm" disabled={isSubmitting}>
              Cancel
            </Button>
          </FocusModal.Close>
          <Button
            onClick={() => void handleGrantAccess()}
            disabled={!selectedStoreId || isSubmitting}
            className="bg-primary font-semibold text-white"
          >
            {isSubmitting ? "Sending Email..." : "Send Access Code"}
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
