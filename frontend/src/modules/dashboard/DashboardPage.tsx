import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const navigate = useNavigate()
  const username = localStorage.getItem("username")
  const role = localStorage.getItem("role")

  function handleLogout() {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("username")
    localStorage.removeItem("role")
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-3xl font-bold text-foreground">
        Welcome, {username}
      </h1>
      <p className="text-muted-foreground">Role: {role}</p>
      <Button variant="outline" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}