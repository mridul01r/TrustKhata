import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/modules/auth/LoginPage"
import DashboardPage from "@/modules/dashboard/DashboardPage"
import RequireAuth from "@/modules/auth/RequireAuth"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App