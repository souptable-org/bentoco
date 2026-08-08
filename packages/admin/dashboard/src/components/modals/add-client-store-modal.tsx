import React, { useMemo, useState } from "react"
import { useInviteStoreMutation } from "@/redux/api"
import { Button } from "@/components/ui/button"
import {
  FocusModal,
  Heading,
  Input,
  ProgressStatus,
  ProgressTabs,
  RadioGroup,
  Text,
} from "@bentoco/ui"

type InviteType = "new_merchant" | "existing_merchant"

enum Tab {
  TYPE = "type",
  DETAILS = "details",
  REVIEW = "review",
}

type TabState = Record<Tab, ProgressStatus>

const initialTabState: TabState = {
  [Tab.TYPE]: "in-progress",
  [Tab.DETAILS]: "not-started",
  [Tab.REVIEW]: "not-started",
}

interface AddClientStoreModalProps {
  trigger?: React.ReactNode
  initialStep?: number
  initialMerchantEmail?: string
  initialStoreDisplayName?: string
  onVerified?: () => void
}

function getAgencyUid(): string {
  if (typeof window === "undefined") return "AGENCY-849201"
  try {
    const m = localStorage.getItem("bentoco_agency_membership")
    if (m) {
      const parsed = JSON.parse(m)
      if (parsed?.agencyUid || parsed?.uniqueUid) {
        return parsed.agencyUid || parsed.uniqueUid
      }
    }
  } catch {
    // ignore
  }
  return localStorage.getItem("bentoco_agency_uid") || "AGENCY-849201"
}

/**
 * Two different processes after Type:
 * 1) New merchant  → setup brand + email → send signup invite (they create store)
 * 2) Existing merchant → email only → send access request (they already own store)
 * Agency never creates the store alone.
 */
export function AddClientStoreModal({
  trigger,
  initialMerchantEmail = "",
  initialStoreDisplayName = "",
  onVerified,
}: AddClientStoreModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<Tab>(Tab.TYPE)
  const [tabState, setTabState] = useState<TabState>(initialTabState)

  const [inviteType, setInviteType] = useState<InviteType>("new_merchant")
  const [merchantEmail, setMerchantEmail] = useState(initialMerchantEmail)
  const [storeDisplayName, setStoreDisplayName] = useState(
    initialStoreDisplayName
  )
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState("")
  const [emailError, setEmailError] = useState("")
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)

  const [inviteStore, { isLoading: isSubmitting }] = useInviteStoreMutation()

  const agencyUid = useMemo(() => getAgencyUid(), [isOpen])
  const isNew = inviteType === "new_merchant"

  const tabLabels = isNew
    ? { type: "Type", details: "Setup", review: "Invite" }
    : { type: "Type", details: "Request", review: "Send" }

  const validateEmail = (email: string) => {
    if (!email) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const reset = () => {
    setTab(Tab.TYPE)
    setTabState(initialTabState)
    setInviteType("new_merchant")
    setMerchantEmail(initialMerchantEmail)
    setStoreDisplayName(initialStoreDisplayName)
    setPhone("")
    setNote("")
    setEmailError("")
    setLastInviteUrl(null)
    setEmailPreviewUrl(null)
    setDevToken(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
    } else {
      if (initialMerchantEmail) setMerchantEmail(initialMerchantEmail)
      if (initialStoreDisplayName) setStoreDisplayName(initialStoreDisplayName)
    }
  }

  const markCompleteAndGo = (from: Tab, to: Tab) => {
    setTabState((prev) => ({
      ...prev,
      [from]: "completed",
      [to]: "in-progress",
    }))
    setTab(to)
  }

  const handleContinue = () => {
    if (tab === Tab.TYPE) {
      markCompleteAndGo(Tab.TYPE, Tab.DETAILS)
      return
    }
    if (tab === Tab.DETAILS) {
      if (!validateEmail(merchantEmail.trim())) {
        setEmailError("Enter a valid merchant email.")
        return
      }
      if (isNew && !storeDisplayName.trim()) {
        setEmailError("Enter the store / brand name they will open.")
        return
      }
      setEmailError("")
      markCompleteAndGo(Tab.DETAILS, Tab.REVIEW)
    }
  }

  const handleSendInvite = async () => {
    try {
      const res = await inviteStore({
        agencyId: agencyUid,
        merchantEmail: merchantEmail.trim().toLowerCase(),
        storeDisplayName:
          storeDisplayName.trim() ||
          (isNew
            ? merchantEmail.split("@")[0] || "Store"
            : "Existing store"),
        inviteType,
      }).unwrap()

      setLastInviteUrl(res.inviteUrl || null)
      setEmailPreviewUrl(res.emailPreviewUrl || null)
      setDevToken(res.inviteToken || null)
      setTabState((prev) => ({
        ...prev,
        [Tab.REVIEW]: "completed",
      }))
      if (onVerified) onVerified()
      // Ethereal never hits real inboxes — open preview if we got one
      if (res.emailPreviewUrl) {
        window.open(res.emailPreviewUrl, "_blank", "noopener,noreferrer")
      }
    } catch (err: any) {
      alert(err?.data?.error || err?.message || "Failed to send.")
    }
  }

  const sent = !!lastInviteUrl || tabState[Tab.REVIEW] === "completed"

  return (
    <FocusModal open={isOpen} onOpenChange={handleOpenChange}>
      <FocusModal.Trigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 font-semibold text-white">
            New Store
          </Button>
        )}
      </FocusModal.Trigger>
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
            const order = [Tab.TYPE, Tab.DETAILS, Tab.REVIEW]
            const target = v as Tab
            const targetIdx = order.indexOf(target)
            const currentIdx = order.indexOf(tab)
            if (targetIdx <= currentIdx || tabState[target] === "completed") {
              setTab(target)
            }
          }}
          className="flex h-full flex-col overflow-hidden"
        >
          <FocusModal.Header>
            <div className="flex w-full min-w-0 items-center">
              <div className="-my-2 w-full max-w-[600px] border-l">
                <ProgressTabs.List className="flex items-center">
                  <ProgressTabs.Trigger
                    value={Tab.TYPE}
                    status={tabState[Tab.TYPE]}
                  >
                    {tabLabels.type}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.DETAILS}
                    status={tabState[Tab.DETAILS]}
                  >
                    {tabLabels.details}
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.REVIEW}
                    status={tabState[Tab.REVIEW]}
                    className="border-r-0"
                  >
                    {tabLabels.review}
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="size-full overflow-hidden">
            {/* ── Step 1: choose path ── */}
            <ProgressTabs.Content
              value={Tab.TYPE}
              className="size-full overflow-y-auto"
            >
              <div className="flex size-full flex-col items-center">
                <div className="w-full max-w-[720px] space-y-6 px-4 py-12">
                  <div>
                    <Heading level="h1" className="txt-compact-xlarge-plus">
                      Add client store
                    </Heading>
                    <Text className="text-ui-fg-subtle mt-2 text-sm">
                      Pick which process you need. These are different — you
                      never create the store by yourself.
                    </Text>
                  </div>

                  <RadioGroup
                    value={inviteType}
                    onValueChange={(v) => {
                      setInviteType(v as InviteType)
                      setEmailError("")
                      setStoreDisplayName("")
                      setPhone("")
                      setNote("")
                    }}
                    className="flex-col gap-y-3"
                  >
                    <RadioGroup.ChoiceBox
                      value="new_merchant"
                      label="Configure new merchant"
                      description="Brand is new to Bentoco. You invite them to sign up, name their store, and confirm your agency code. The store is created only when they finish."
                    />
                    <RadioGroup.ChoiceBox
                      value="existing_merchant"
                      label="Add existing merchant"
                      description="Brand already has a Bentoco store. You only request access. They log in, confirm your agency code, and grant you partner access — no new store."
                    />
                  </RadioGroup>

                  {/* Live path summary so choice feels real before Continue */}
                  <div
                    className={
                      isNew
                        ? "rounded-lg border border-ui-tag-blue-border bg-ui-tag-blue-bg px-4 py-3 text-sm text-ui-tag-blue-text"
                        : "rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg px-4 py-3 text-sm text-ui-tag-orange-text"
                    }
                  >
                    <Text weight="plus" size="small" className="mb-1 block">
                      {isNew
                        ? "Path A — New merchant"
                        : "Path B — Existing merchant"}
                    </Text>
                    <ol className="list-decimal space-y-1 pl-4 text-xs opacity-90">
                      {isNew ? (
                        <>
                          <li>You send a signup invite (email + brand name).</li>
                          <li>Merchant creates their Bentoco account.</li>
                          <li>They confirm your 6-digit agency code.</li>
                          <li>Store is created under them → you get access.</li>
                        </>
                      ) : (
                        <>
                          <li>You send an access request to their email.</li>
                          <li>Merchant logs into their existing store.</li>
                          <li>They confirm your 6-digit agency code.</li>
                          <li>You get partner access — store already exists.</li>
                        </>
                      )}
                    </ol>
                  </div>
                </div>
              </div>
            </ProgressTabs.Content>

            {/* ── Step 2: different forms ── */}
            <ProgressTabs.Content
              value={Tab.DETAILS}
              className="size-full overflow-y-auto"
            >
              <div className="flex size-full flex-col items-center">
                <div className="w-full max-w-[560px] space-y-6 px-4 py-12">
                  {isNew ? (
                    <>
                      <div>
                        <div className="text-ui-tag-blue-text mb-2 text-[10px] font-bold uppercase tracking-widest">
                          New merchant · setup
                        </div>
                        <Heading level="h2" className="txt-compact-large-plus">
                          Who is opening the store?
                        </Heading>
                        <Text className="text-ui-fg-subtle mt-1 text-sm">
                          They do not have Bentoco yet. We email a signup link.
                          The store only appears after they finish.
                        </Text>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                            Store / brand name{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={storeDisplayName}
                            onChange={(e) => {
                              setStoreDisplayName(e.target.value)
                              setEmailError("")
                            }}
                            placeholder="Acme Fashion"
                          />
                          <Text size="xsmall" className="text-ui-fg-muted mt-1">
                            Shown in their signup and on your roster while
                            pending.
                          </Text>
                        </div>

                        <div>
                          <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                            Merchant email{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="email"
                            value={merchantEmail}
                            onChange={(e) => {
                              setMerchantEmail(e.target.value)
                              setEmailError("")
                            }}
                            placeholder="owner@brand.com"
                          />
                        </div>

                        <div>
                          <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                            Phone{" "}
                            <span className="text-ui-fg-muted font-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 …"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-ui-tag-orange-text mb-2 text-[10px] font-bold uppercase tracking-widest">
                          Existing merchant · access request
                        </div>
                        <Heading level="h2" className="txt-compact-large-plus">
                          Request access to their store
                        </Heading>
                        <Text className="text-ui-fg-subtle mt-1 text-sm">
                          They already own a Bentoco store. You are only asking
                          for partner access — no new store is created.
                        </Text>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                            Merchant email{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="email"
                            value={merchantEmail}
                            onChange={(e) => {
                              setMerchantEmail(e.target.value)
                              setEmailError("")
                            }}
                            placeholder="owner@already-on-bentoco.com"
                          />
                          <Text size="xsmall" className="text-ui-fg-muted mt-1">
                            Must be the email on their merchant account.
                          </Text>
                        </div>

                        <div>
                          <label className="text-ui-fg-base mb-1 block text-sm font-medium">
                            Internal note{" "}
                            <span className="text-ui-fg-muted font-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Diwali campaign client"
                          />
                        </div>

                        <div className="bg-ui-bg-subtle border-ui-border-base rounded-lg border p-3 text-xs text-ui-fg-subtle">
                          <Text weight="plus" size="small" className="mb-1 block">
                            Other way (same outcome)
                          </Text>
                          Merchant can also open Settings → Users → Request
                          agency access and type your code{" "}
                          <span className="text-ui-fg-base font-mono">
                            {agencyUid}
                          </span>
                          . You then Accept on Stores.
                        </div>
                      </div>
                    </>
                  )}

                  {emailError && (
                    <Text className="text-ui-fg-error text-sm">{emailError}</Text>
                  )}

                  <div className="bg-ui-bg-subtle border-ui-border-base rounded-lg border p-4 text-sm">
                    <Text weight="plus" size="small">
                      Your agency code (they confirm this)
                    </Text>
                    <Text className="text-ui-fg-base mt-1 font-mono text-lg">
                      {agencyUid}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted mt-1">
                      {isNew
                        ? "Prefills on their signup from the invite link."
                        : "They enter this when approving access (or from the link)."}
                    </Text>
                  </div>
                </div>
              </div>
            </ProgressTabs.Content>

            {/* ── Step 3: different review + next steps ── */}
            <ProgressTabs.Content
              value={Tab.REVIEW}
              className="size-full overflow-y-auto"
            >
              <div className="flex size-full flex-col items-center">
                <div className="w-full max-w-[560px] space-y-6 px-4 py-12">
                  <div>
                    <div
                      className={
                        isNew
                          ? "text-ui-tag-blue-text mb-2 text-[10px] font-bold uppercase tracking-widest"
                          : "text-ui-tag-orange-text mb-2 text-[10px] font-bold uppercase tracking-widest"
                      }
                    >
                      {isNew ? "New merchant" : "Existing merchant"}
                    </div>
                    <Heading level="h2" className="txt-compact-large-plus">
                      {sent
                        ? isNew
                          ? "Signup invite sent"
                          : "Access request sent"
                        : isNew
                          ? "Send signup invite"
                          : "Send access request"}
                    </Heading>
                    <Text className="text-ui-fg-subtle mt-1 text-sm">
                      {sent
                        ? isNew
                          ? "Waiting for them to create the account and confirm your code. No store exists until then."
                          : "Waiting for them to approve access on their existing store."
                        : isNew
                          ? "Nothing is created until they finish signup."
                          : "Nothing changes on their store until they approve."}
                    </Text>
                  </div>

                  <dl className="border-ui-border-base divide-ui-border-base divide-y rounded-lg border text-sm">
                    <div className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-ui-fg-muted">Process</dt>
                      <dd className="text-ui-fg-base font-medium">
                        {isNew
                          ? "Configure new merchant"
                          : "Add existing merchant"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-ui-fg-muted">Email</dt>
                      <dd className="text-ui-fg-base font-medium">
                        {merchantEmail}
                      </dd>
                    </div>
                    {isNew && storeDisplayName && (
                      <div className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-ui-fg-muted">Store to open</dt>
                        <dd className="text-ui-fg-base font-medium">
                          {storeDisplayName}
                        </dd>
                      </div>
                    )}
                    {!isNew && note && (
                      <div className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-ui-fg-muted">Note</dt>
                        <dd className="text-ui-fg-base font-medium">{note}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-ui-fg-muted">Agency code</dt>
                      <dd className="text-ui-fg-base font-mono font-medium">
                        {agencyUid}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-ui-fg-muted">Creates store?</dt>
                      <dd className="text-ui-fg-base font-medium">
                        {isNew
                          ? "Yes — when merchant finishes signup"
                          : "No — store already exists"}
                      </dd>
                    </div>
                  </dl>

                  {!sent && (
                    <div className="bg-ui-bg-subtle border-ui-border-base rounded-lg border p-4 text-xs">
                      <Text weight="plus" size="small" className="mb-2 block">
                        After you send
                      </Text>
                      <ol className="text-ui-fg-subtle list-decimal space-y-1.5 pl-4">
                        {isNew ? (
                          <>
                            <li>Merchant gets signup email / invite link.</li>
                            <li>They create password + name the store.</li>
                            <li>
                              Signup asks for your agency code (prefilled).
                            </li>
                            <li>
                              Store is created under them → status Active for
                              you.
                            </li>
                          </>
                        ) : (
                          <>
                            <li>Merchant gets “agency wants access” email.</li>
                            <li>They sign in to their existing store.</li>
                            <li>They confirm your agency code.</li>
                            <li>
                              You get partner access; their store is unchanged.
                            </li>
                          </>
                        )}
                      </ol>
                    </div>
                  )}

                  {sent && (
                    <div
                      className={
                        isNew
                          ? "space-y-2 rounded-lg border border-ui-tag-blue-border bg-ui-tag-blue-bg p-4 text-sm text-ui-tag-blue-text"
                          : "space-y-2 rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg p-4 text-sm text-ui-tag-orange-text"
                      }
                    >
                      <Text weight="plus">
                        {isNew
                          ? "Waiting on new merchant signup"
                          : "Waiting on existing merchant approval"}
                      </Text>
                      <ol className="list-decimal space-y-1 pl-4 text-xs opacity-90">
                        {isNew ? (
                          <>
                            <li>They open the invite and create an account.</li>
                            <li>They confirm your agency code.</li>
                            <li>
                              Store appears under them; you can Open store.
                            </li>
                          </>
                        ) : (
                          <>
                            <li>They open the request while logged in.</li>
                            <li>They confirm your agency code.</li>
                            <li>
                              Roster moves to Active — no new store created.
                            </li>
                          </>
                        )}
                      </ol>
                      <div className="mt-3 space-y-2 border-t border-current/20 pt-3">
                        <Text size="xsmall" className="opacity-90 font-medium">
                          Ethereal does not deliver to Gmail. Open the preview:
                        </Text>
                        {emailPreviewUrl ? (
                          <a
                            href={emailPreviewUrl}
                            className="mt-1 block break-all text-xs font-semibold underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open email in Ethereal →
                          </a>
                        ) : (
                          <Text size="xsmall" className="opacity-80">
                            No preview URL (SMTP may have failed). Use the invite
                            link below, or log in at ethereal.email as
                            vivianne84@ethereal.email
                          </Text>
                        )}
                        {lastInviteUrl && (
                          <>
                            <Text size="xsmall" className="opacity-80 mt-2">
                              Or open the invite directly (no email needed):
                            </Text>
                            <a
                              href={lastInviteUrl}
                              className="mt-1 block break-all text-xs underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {lastInviteUrl}
                            </a>
                          </>
                        )}
                        {devToken && (
                          <Text size="xsmall" className="font-mono opacity-70">
                            token: {devToken.slice(0, 12)}…
                          </Text>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ProgressTabs.Content>
          </FocusModal.Body>
        </ProgressTabs>

        <FocusModal.Footer>
          <FocusModal.Close asChild>
            <Button type="button" variant="outline" size="sm">
              {sent ? "Close" : "Cancel"}
            </Button>
          </FocusModal.Close>

          {!sent && tab !== Tab.REVIEW && (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-white"
              onClick={handleContinue}
            >
              {tab === Tab.TYPE
                ? isNew
                  ? "Continue to setup"
                  : "Continue to request"
                : "Continue to review"}
            </Button>
          )}

          {!sent && tab === Tab.REVIEW && (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-white"
              disabled={isSubmitting}
              onClick={() => void handleSendInvite()}
            >
              {isSubmitting
                ? "Sending…"
                : isNew
                  ? "Send signup invite"
                  : "Send access request"}
            </Button>
          )}

          {sent && (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-white"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          )}
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
