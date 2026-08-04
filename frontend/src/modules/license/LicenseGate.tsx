import { useEffect, useState } from "react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck } from "lucide-react"

interface LicenseStatus {
  valid: boolean
  reason?: string
  customerName?: string
  licenseType?: string
  expiryDate?: string
}

interface LicenseGateProps {
  children: React.ReactNode
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [keyInput, setKeyInput] = useState("")
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await apiClient.get<LicenseStatus>("/license/status")
      setStatus(res.data)
    } catch {
      setStatus({ valid: false, reason: "Could not reach the licensing service" })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleActivate = async () => {
    if (!keyInput.trim()) return
    setActivating(true)
    setError(null)
    try {
      const res = await apiClient.post<LicenseStatus>("/license/activate", {
        licenseKey: keyInput.trim(),
      })
      if (!res.data.valid) {
        setError(res.data.reason ?? "Activation failed")
      } else {
        setStatus(res.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.reason ?? "Activation failed. Check the key and try again.")
    } finally {
      setActivating(false)
    }
  }

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!status?.valid) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Activate Retail ERP</CardTitle>
            <CardDescription>
              {status?.reason ?? "Enter your license key to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-key">License key</Label>
              <Textarea
                id="license-key"
                rows={4}
                placeholder="Paste the license key you were given"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full"
              disabled={activating || !keyInput.trim()}
              onClick={handleActivate}
            >
              {activating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}