import React, { useState } from "react"
import { useInviteStoreMutation } from "@/redux/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ArrowRight } from "lucide-react"
import { FocusModal } from "@bentoco/ui"

interface SubscriptionModalProps {
  trigger?: React.ReactNode
  storeDisplayName?: string
  merchantEmail?: string
  onSuccess?: () => void
}

export function SubscriptionModal({
  trigger,
  storeDisplayName = "Your Store",
  merchantEmail = "merchant@example.com",
  onSuccess,
}: SubscriptionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tier, setTier] = useState<"free" | "basic" | "pro" | "enterprise">(
    "pro"
  )
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  )
  const [promoCode, setPromoCode] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [promoApplied, setPromoApplied] = useState(false)

  const [inviteStore, { isLoading: isSubmitting }] = useInviteStoreMutation()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTier("pro")
      setBillingCycle("yearly")
      setPromoCode("")
      setPromoApplied(false)
    }
  }

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCode.trim()) return

    setIsApplyingPromo(true)
    setTimeout(() => {
      setIsApplyingPromo(false)
      setPromoApplied(true)
    }, 800)
  }

  const handleFinalize = async () => {
    try {
      await inviteStore({
        agencyId:
          (typeof window !== "undefined" &&
            localStorage.getItem("bentoco_agency_uid")) ||
          "AGENCY-849201",
        merchantEmail,
        storeDisplayName,
      }).unwrap()

      alert("Plan selected and store access invitation sent successfully!")
      handleOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      alert(err?.data?.error || "Failed to finalize store configuration.")
    }
  }

  const pricing = {
    free: { monthly: 0, yearly: 0, label: "Free Plan - Staging Only" },
    basic: { monthly: 9, yearly: 49, label: "Basic Plan" },
    pro: { monthly: 19, yearly: 89, label: "Pro Plan" },
    enterprise: { monthly: 99, yearly: 399, label: "Enterprise Plan" },
  }

  return (
    <FocusModal open={isOpen} onOpenChange={handleOpenChange}>
      <FocusModal.Trigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 font-semibold text-white">
            Select Plan
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
          <div className="mx-auto w-full max-w-lg space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <FocusModal.Title className="txt-compact-xlarge-plus text-ui-fg-base">
                Select plan
              </FocusModal.Title>
              <FocusModal.Description className="text-ui-fg-subtle text-sm">
                Configure billing plan for{" "}
                <strong className="text-ui-fg-base">{storeDisplayName}</strong>
              </FocusModal.Description>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tier-select"
                className="text-ui-fg-muted block text-xs font-semibold uppercase tracking-wider"
              >
                Select Plan Tier
              </label>
              <div className="relative">
                <select
                  id="tier-select"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-ui-border-interactive w-full appearance-none rounded-md border px-4 py-3 text-sm transition-all focus:outline-none"
                >
                  <option value="free">Free - Staging (Staging Only)</option>
                  <option value="basic">Basic - $9/mo (Live Ready)</option>
                  <option value="pro">Pro - $19/mo (Live Ready)</option>
                  <option value="enterprise">
                    Enterprise - Custom (Live Ready)
                  </option>
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

            <div className="border-ui-border-base bg-ui-bg-base overflow-hidden rounded-md border">
              <label
                className={`flex cursor-pointer items-center justify-between border-b p-4 transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-ui-bg-subtle"
                    : "hover:bg-ui-bg-subtle-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="billing"
                    value="yearly"
                    checked={billingCycle === "yearly"}
                    onChange={() => setBillingCycle("yearly")}
                    className="text-primary"
                  />
                  <span className="text-ui-fg-base text-sm font-semibold">
                    Yearly
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-ui-fg-base text-xl font-bold">
                    ${pricing[tier].yearly}
                  </span>
                  <span className="text-ui-fg-muted ml-1 text-xs">/year</span>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between p-4 transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-ui-bg-subtle"
                    : "hover:bg-ui-bg-subtle-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="billing"
                    value="monthly"
                    checked={billingCycle === "monthly"}
                    onChange={() => setBillingCycle("monthly")}
                    className="text-primary"
                  />
                  <span className="text-ui-fg-base text-sm font-semibold">
                    Monthly
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-ui-fg-base text-xl font-bold">
                    ${pricing[tier].monthly}
                  </span>
                  <span className="text-ui-fg-muted ml-1 text-xs">/month</span>
                </div>
              </label>

              <div className="border-ui-border-base text-ui-fg-muted flex items-center justify-between border-t p-4 text-xs">
                <span>Need a custom solution?</span>
                <a
                  href="mailto:support@bentoco.com"
                  className="text-primary font-semibold hover:underline focus:outline-none"
                >
                  Contact Support
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="promo"
                className="text-ui-fg-muted block text-xs font-semibold uppercase tracking-wider"
              >
                Promo Code
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  id="promo"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value)
                    setPromoApplied(false)
                  }}
                  disabled={promoApplied}
                  placeholder="Enter discount code"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={handleApplyPromo}
                  disabled={
                    !promoCode.trim() || isApplyingPromo || promoApplied
                  }
                  className="whitespace-nowrap px-4"
                >
                  {isApplyingPromo
                    ? "Applying..."
                    : promoApplied
                      ? "Applied ✓"
                      : "Apply"}
                </Button>
              </div>
            </div>

            <div className="border-ui-border-base bg-ui-bg-subtle rounded-md border p-5 sm:p-6">
              <h3 className="text-ui-fg-base mb-3 text-sm font-bold">
                What&apos;s Included
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Access to all premium components and templates",
                  "Advanced theming and customization tools",
                  "Priority support and dedicated assistance",
                  "Early access to new features and components",
                  "Unlimited projects and commercial usage",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-ui-fg-subtle text-xs leading-snug sm:text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
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
            onClick={() => void handleFinalize()}
            disabled={isSubmitting}
            className="bg-primary group flex items-center gap-2 font-semibold text-white"
          >
            {isSubmitting ? "Processing..." : "Pay Now"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
