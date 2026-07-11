import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Hardcoded for now - will come from a tenant-selection step later
const TENANT_ID = "11111111-1111-1111-1111-111111111111"

interface LoginResponse {
  token: string
  userId: string
  username: string
  role: string
  tenantId: string
}

async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    `/auth/login/${TENANT_ID}`,
    { username, password }
  )
  return response.data
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("username", data.username)
      localStorage.setItem("role", data.role)
      navigate("/dashboard")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Retail ERP</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">
                Invalid username or password
              </p>
            )}

            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}