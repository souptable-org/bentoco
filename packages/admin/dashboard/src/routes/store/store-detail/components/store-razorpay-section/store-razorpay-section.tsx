import { useState, useEffect } from "react"
import { Container, Heading, Button, Input, Label, toast, Badge } from "@bentoco/ui"
import { sdk } from "../../../../../lib/client"

export const StoreRazorpaySection = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<{
    configured: boolean
    key_id_masked: string | null
    business_name: string | null
    source: string | null
  } | null>(null)

  const [keyId, setKeyId] = useState("")
  const [keySecret, setKeySecret] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [businessName, setBusinessName] = useState("")

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await sdk.client.fetch<{
        configured: boolean
        key_id_masked: string | null
        business_name: string | null
        source: string | null
      }>("/admin/byog/razorpay")
      setConfig(res)
      if (res.business_name) setBusinessName(res.business_name)
    } catch (err: any) {
      console.error("Failed to load Razorpay config", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyId.trim() || !keySecret.trim()) {
      toast.error("Razorpay Key ID and Key Secret are required")
      return
    }

    setSaving(true)
    try {
      await sdk.client.fetch("/admin/byog/razorpay", {
        method: "POST",
        body: {
          key_id: keyId.trim(),
          key_secret: keySecret.trim(),
          webhook_secret: webhookSecret.trim() || undefined,
          business_name: businessName.trim() || undefined,
          test_connection: true,
        },
      })
      toast.success("Razorpay BYOK credentials saved and verified successfully!")
      setKeyId("")
      setKeySecret("")
      setWebhookSecret("")
      await loadConfig()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Razorpay keys. Verify credentials.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-6 space-y-6 border border-border rounded-lg bg-card text-card-foreground">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Heading level="h2">Razorpay Payment Gateway (BYOK)</Heading>
            {config?.configured ? (
              <Badge color="green">Configured ({config.source === "env" ? "Environment" : "Database"})</Badge>
            ) : (
              <Badge color="orange">Not Configured</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your merchant Razorpay account to receive direct online payments via UPI, Credit/Debit cards, and NetBanking.
          </p>
        </div>
      </div>

      {config?.key_id_masked && (
        <div className="p-4 rounded-md border border-border bg-muted/40 text-sm space-y-1">
          <p className="font-medium">Active Configuration:</p>
          <p className="text-muted-foreground font-mono">Key ID: {config.key_id_masked}</p>
          {config.business_name && <p className="text-muted-foreground">Business Name: {config.business_name}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rzp_key_id">Razorpay Key ID *</Label>
            <Input
              id="rzp_key_id"
              type="text"
              placeholder="rzp_test_..."
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rzp_key_secret">Razorpay Key Secret *</Label>
            <Input
              id="rzp_key_secret"
              type="password"
              placeholder="••••••••••••••••"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rzp_business_name">Display Business Name (Optional)</Label>
            <Input
              id="rzp_business_name"
              type="text"
              placeholder="e.g. My Store Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rzp_webhook_secret">Webhook Secret (Optional)</Label>
            <Input
              id="rzp_webhook_secret"
              type="password"
              placeholder="e.g. whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving} disabled={saving || loading}>
            {saving ? "Testing & Saving..." : "Save & Verify Credentials"}
          </Button>
        </div>
      </form>
    </Container>
  )
}
