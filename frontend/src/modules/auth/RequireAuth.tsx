import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

interface RequireAuthProps {
  children: ReactNode
  allowedRoles?: string[]
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const token = localStorage.getItem("auth_token")
  const role = localStorage.getItem("role")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Logged in, but this role isn't allowed here — send cashiers to their one screen
    return <Navigate to="/pos" replace />
  }

  return <>{children}</>
}