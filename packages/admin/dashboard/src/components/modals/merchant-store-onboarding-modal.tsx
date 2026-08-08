import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  FocusModal,
  Heading,
  Input,
  ProgressStatus,
  ProgressTabs,
  Text,
} from "@bentoco/ui"
import { AgencyAccessSuccess } from "./agency-access-success"

enum Tab {
  STORE = "store",
  SHIPPING = "shipping",
  PAYMENT = "payment",
  CATALOG = "catalog",
}

type TabState = Record<Tab, ProgressStatus>

const initialTabState: TabState = {
  [Tab.STORE]: "in-progress",
  [Tab.SHIPPING]: "not-started",
  [Tab.PAYMENT]: "not-started",
  [Tab.CATALOG]: "not-started",
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
]

const GATEWAYS = [
  { name: "Razorpay", domain: "razorpay.com" },
  { name: "PhonePe PG", domain: "phonepe.com" },
  { name: "Cashfree Payments", domain: "cashfree.com" },
]

const IMPORT_SOURCES = [
  {
    id: "shopify",
    label: "Shopify Catalog Importer",
    desc: "Upload Shopify export CSV — titles, options, variants.",
  },
  {
    id: "woo",
    label: "WooCommerce XML Feed",
    desc: "Sync from your WordPress product endpoint.",
  },
  {
    id: "manual",
    label: "Build from scratch",
    desc: "Skip import. Start empty in catalog tools.",
  },
]

export type MerchantStoreOnboardingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  agencyId?: string
  /** Display name for success copy (e.g. PixelCraft) */
  agencyName?: string
  configuredByEmail?: string
  initialStoreName?: string
  /** Agency configures client store vs merchant self-serve after signup */
  mode?: "agency" | "merchant"
  onComplete?: () => void
  /** Optional controlled trigger when used as dropdown child */
  trigger?: React.ReactNode
}

/**
 * Shared store setup wizard (same steps as login onboarding):
 * Store → Shipping → Payment → Catalog → mark NEW → ACTIVE.
 */
export function MerchantStoreOnboardingModal({
  open,
  onOpenChange,
  tenantId,
  agencyId,
  agencyName,
  configuredByEmail,
  initialStoreName = "",
  mode = "merchant",
  onComplete,
  trigger,
}: MerchantStoreOnboardingModalProps) {
  const [tab, setTab] = useState<Tab>(Tab.STORE)
  const [tabState, setTabState] = useState<TabState>(initialTabState)
  const [storeName, setStoreName] = useState(initialStoreName)
  const [storeDomain, setStoreDomain] = useState("")
  const [targetStates, setTargetStates] = useState<string[]>([])
  const [stateQuery, setStateQuery] = useState("")
  const [selectedGateway, setSelectedGateway] = useState("")
  const [importSource, setImportSource] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showAgencySuccess, setShowAgencySuccess] = useState(false)

  const reset = () => {
    setTab(Tab.STORE)
    setTabState(initialTabState)
    setStoreName(initialStoreName)
    setStoreDomain("")
    setTargetStates([])
    setStateQuery("")
    setSelectedGateway("")
    setImportSource("")
    setError("")
    setShowAgencySuccess(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    else if (initialStoreName) setStoreName(initialStoreName)
    onOpenChange(next)
  }

  const goNext = (from: Tab, to: Tab) => {
    setTabState((prev) => ({
      ...prev,
      [from]: "completed",
      [to]: "in-progress",
    }))
    setTab(to)
  }

  const handleContinue = () => {
    setError("")
    if (tab === Tab.STORE) {
      if (!storeName.trim()) {
        setError("Enter a store name.")
        return
      }
      goNext(Tab.STORE, Tab.SHIPPING)
      return
    }
    if (tab === Tab.SHIPPING) {
      if (targetStates.length === 0) {
        setError("Pick at least one shipping state.")
        return
      }
      goNext(Tab.SHIPPING, Tab.PAYMENT)
      return
    }
    if (tab === Tab.PAYMENT) {
      if (!selectedGateway) {
        setError("Choose a payment gateway.")
        return
      }
      goNext(Tab.PAYMENT, Tab.CATALOG)
    }
  }

  const handleFinish = async () => {
    if (!importSource) {
      setError("Choose how to seed the catalog.")
      return
    }
    if (!tenantId) {
      setError("Missing store id.")
      return
    }
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/agency/mark-store-configured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          agencyId,
          configuredByEmail:
            configuredByEmail ||
            (typeof window !== "undefined"
              ? localStorage.getItem("bentoco_agency_email")
              : null) ||
            "unknown",
          storeName: storeName.trim(),
          subdomain: storeDomain.trim() || undefined,
          states: targetStates,
          gateway: selectedGateway,
          importSource,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Could not finish setup.")
      }
      setTabState((prev) => ({ ...prev, [Tab.CATALOG]: "completed" }))
      // Merchant + agency path: end with access granted + app download
      if (mode === "merchant" && (agencyId || agencyName)) {
        setShowAgencySuccess(true)
      } else {
        onComplete?.()
        handleOpenChange(false)
      }
    } catch (e: any) {
      setError(e?.message || "Setup failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredStates = INDIAN_STATES.filter(
    (s) =>
      s.toLowerCase().includes(stateQuery.toLowerCase()) &&
      !targetStates.includes(s)
  ).slice(0, 8)

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <FocusModal.Trigger asChild>{trigger}</FocusModal.Trigger>
      ) : null}
      <FocusModal.Content
        portalProps={{
          container:
            typeof document !== "undefined" ? document.body : undefined,
        }}
        overlayProps={{ className: "z-[100]" }}
        className="z-[100]"
      >
        <ProgressTabs
          value={tab}
          onValueChange={(v) => {
            const order = [Tab.STORE, Tab.SHIPPING, Tab.PAYMENT, Tab.CATALOG]
            const target = v as Tab
            if (
              order.indexOf(target) <= order.indexOf(tab) ||
              tabState[target] === "completed"
            ) {
              setTab(target)
            }
          }}
          className="flex h-full flex-col overflow-hidden"
        >
          <FocusModal.Header>
            <div className="flex w-full min-w-0 items-center">
              <div className="-my-2 w-full max-w-[720px] border-l">
                <ProgressTabs.List className="flex items-center">
                  <ProgressTabs.Trigger
                    value={Tab.STORE}
                    status={tabState[Tab.STORE]}
                  >
                    Store
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.SHIPPING}
                    status={tabState[Tab.SHIPPING]}
                  >
                    Shipping
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.PAYMENT}
                    status={tabState[Tab.PAYMENT]}
                  >
                    Payment
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.CATALOG}
                    status={tabState[Tab.CATALOG]}
                    className="border-r-0"
                  >
                    Catalog
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="size-full overflow-y-auto">
            {showAgencySuccess ? (
              <div className="flex justify-center px-4 py-12">
                <AgencyAccessSuccess
                  agencyName={agencyName || agencyId || "your agency"}
                  agencyUid={agencyId}
                  storeName={storeName}
                  continueLabel="Go to my store"
                  onContinue={() => {
                    onComplete?.()
                    handleOpenChange(false)
                  }}
                />
              </div>
            ) : (
            <div className="mx-auto w-full max-w-[560px] space-y-6 px-4 py-10">
              <div>
                <Text
                  size="xsmall"
                  className="text-ui-fg-muted mb-1 font-bold uppercase tracking-widest"
                >
                  {mode === "agency"
                    ? "Configure client store"
                    : "Finish store setup"}
                </Text>
                <Heading level="h1" className="txt-compact-xlarge-plus">
                  {tab === Tab.STORE && "Store details"}
                  {tab === Tab.SHIPPING && "Shipping regions"}
                  {tab === Tab.PAYMENT && "Payment gateway"}
                  {tab === Tab.CATALOG && "Catalog import"}
                </Heading>
                <Text className="text-ui-fg-subtle mt-1 text-sm">
                  {mode === "agency"
                    ? "Same onboarding as merchant signup. Completing this moves the store from New → Active."
                    : "Complete these steps so your agency can fully operate the store (New → Active)."}
                </Text>
              </div>

              <ProgressTabs.Content value={Tab.STORE} className="space-y-4">
                <div>
                  <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                    Store name
                  </label>
                  <Input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Urban Threads"
                  />
                </div>
                <div>
                  <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                    Subdomain prefix{" "}
                    <span className="text-ui-fg-muted font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={storeDomain}
                      onChange={(e) =>
                        setStoreDomain(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      placeholder="urbanthreads"
                      className="flex-1"
                    />
                    <Text size="small" className="text-ui-fg-muted shrink-0">
                      .bentoco.in
                    </Text>
                  </div>
                </div>
              </ProgressTabs.Content>

              <ProgressTabs.Content value={Tab.SHIPPING} className="space-y-4">
                <Text size="small" className="text-ui-fg-subtle">
                  Select Indian states you ship to first.
                </Text>
                <Input
                  value={stateQuery}
                  onChange={(e) => setStateQuery(e.target.value)}
                  placeholder="Type state name…"
                />
                {stateQuery && filteredStates.length > 0 && (
                  <div className="border-ui-border-base max-h-40 overflow-y-auto rounded-md border">
                    {filteredStates.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="hover:bg-ui-bg-subtle-hover block w-full px-3 py-2 text-left text-sm"
                        onClick={() => {
                          setTargetStates((prev) => [...prev, s])
                          setStateQuery("")
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {targetStates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {targetStates.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="bg-ui-bg-subtle border-ui-border-base rounded-full border px-3 py-1 text-xs"
                        onClick={() =>
                          setTargetStates((prev) => prev.filter((x) => x !== s))
                        }
                      >
                        {s} ×
                      </button>
                    ))}
                  </div>
                )}
              </ProgressTabs.Content>

              <ProgressTabs.Content value={Tab.PAYMENT} className="space-y-3">
                {GATEWAYS.map((gw) => {
                  const selected = selectedGateway === gw.name
                  return (
                    <button
                      key={gw.name}
                      type="button"
                      onClick={() => setSelectedGateway(gw.name)}
                      className={`border-ui-border-base flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm transition-colors ${
                        selected
                          ? "border-ui-fg-interactive bg-ui-bg-subtle"
                          : "hover:bg-ui-bg-subtle-hover"
                      }`}
                    >
                      <span className="font-medium">{gw.name}</span>
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          selected
                            ? "border-ui-fg-interactive bg-ui-fg-interactive"
                            : "border-ui-border-strong"
                        }`}
                      />
                    </button>
                  )
                })}
              </ProgressTabs.Content>

              <ProgressTabs.Content value={Tab.CATALOG} className="space-y-3">
                {IMPORT_SOURCES.map((src) => {
                  const selected = importSource === src.id
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setImportSource(src.id)}
                      className={`border-ui-border-base w-full rounded-lg border p-4 text-left transition-colors ${
                        selected
                          ? "border-ui-fg-interactive bg-ui-bg-subtle"
                          : "hover:bg-ui-bg-subtle-hover"
                      }`}
                    >
                      <div className="text-sm font-medium">{src.label}</div>
                      <div className="text-ui-fg-muted mt-1 text-xs">
                        {src.desc}
                      </div>
                    </button>
                  )
                })}
              </ProgressTabs.Content>

              {error && (
                <Text className="text-ui-fg-error text-sm">{error}</Text>
              )}
            </div>
            )}
          </FocusModal.Body>
        </ProgressTabs>

        {!showAgencySuccess && (
        <FocusModal.Footer>
          <FocusModal.Close asChild>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </FocusModal.Close>
          {tab !== Tab.CATALOG ? (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-white"
              onClick={handleContinue}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-white"
              disabled={isSubmitting}
              onClick={() => void handleFinish()}
            >
              {isSubmitting ? "Saving…" : "Finish & set Active"}
            </Button>
          )}
        </FocusModal.Footer>
        )}
      </FocusModal.Content>
    </FocusModal>
  )
}
