import { Heading, Text, Button as UiButton } from "@bentoco/ui"

/** App store links — override later via env if needed */
const IOS_APP_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_IOS_APP_URL) ||
  "https://apps.apple.com/app/bentoco"
const ANDROID_APP_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_ANDROID_APP_URL) ||
  "https://play.google.com/store/apps/details?id=com.bentoco.app"

type Props = {
  agencyName: string
  agencyUid?: string
  storeName?: string
  onContinue: () => void
  continueLabel?: string
}

/**
 * End-of-invite success: access granted to agency + download mobile app.
 */
export function AgencyAccessSuccess({
  agencyName,
  agencyUid,
  storeName,
  onContinue,
  continueLabel = "Go to my store",
}: Props) {
  const label = agencyName?.trim() || agencyUid || "your agency"

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="bg-ui-tag-green-bg text-ui-tag-green-text flex h-14 w-14 items-center justify-center rounded-full text-2xl">
        ✓
      </div>
      <div className="space-y-2">
        <Heading level="h1" className="txt-compact-xlarge-plus">
          You&apos;re all set
        </Heading>
        <Text className="text-ui-fg-base text-sm leading-relaxed">
          Store access has been given to{" "}
          <span className="font-semibold">{label}</span>
          {storeName ? (
            <>
              {" "}
              for <span className="font-semibold">{storeName}</span>
            </>
          ) : null}
          . They can open merchant admin from their agency dashboard. You can
          revoke access anytime under Settings → Users.
        </Text>
      </div>

      <div className="border-ui-border-base bg-ui-bg-subtle w-full space-y-3 rounded-lg border p-5 text-left">
        <Text weight="plus" size="small">
          Run your store on the go
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          Download the Bentoco mobile app to check orders, inventory, and
          updates from your phone.
        </Text>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={IOS_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-ui-bg-base border-ui-border-base hover:bg-ui-bg-base-hover flex flex-1 items-center justify-center rounded-md border px-3 py-2.5 text-sm font-medium"
          >
            Download for iOS
          </a>
          <a
            href={ANDROID_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-ui-bg-base border-ui-border-base hover:bg-ui-bg-base-hover flex flex-1 items-center justify-center rounded-md border px-3 py-2.5 text-sm font-medium"
          >
            Download for Android
          </a>
        </div>
      </div>

      <UiButton
        variant="primary"
        size="small"
        className="w-full sm:w-auto"
        onClick={onContinue}
      >
        {continueLabel}
      </UiButton>
    </div>
  )
}
