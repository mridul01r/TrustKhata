import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/modules/auth/LoginPage"
import DashboardPage from "@/modules/dashboard/DashboardPage"
import RequireAuth from "@/modules/auth/RequireAuth"
import AppLayout from "@/components/layout/AppLayout"
import CategoryPage from "@/modules/inventory/CategoryPage"
import ProductPage from "@/modules/inventory/ProductPage"
import PosPage from "@/modules/pos/PosPage"
import SalesHistoryPage from "@/modules/pos/SalesHistoryPage"
import SettingsPage from "@/modules/settings/SettingsPage"
import TaxInvoicePage from "@/modules/pos/TaxInvoicePage"
import ExpensesPage from "@/modules/accounting/ExpensesPage"
import DayBookPage from "@/modules/accounting/DayBookPage"
import ProfitLossPage from "@/modules/accounting/ProfitLossPage"
import SuppliersPage from "@/modules/supplier/SuppliersPage"
import PurchasesPage from "@/modules/supplier/PurchasesPage"
import SalesAnalyticsPage from "@/modules/reports/SalesAnalyticsPage"
import GstReportPage from "@/modules/reports/GstReportPage"
import MarginReportPage from "@/modules/reports/MarginReportPage"
import StockReportPage from "@/modules/reports/StockReportPage"
import SummaryReportPage from "@/modules/reports/SummaryReportPage"
import CustomersPage from "@/modules/customer/CustomersPage"
import CustomerDetailPage from "@/modules/customer/CustomerDetailPage"
import StaffPage from "@/modules/auth/StaffPage"
import LicenseGate from "@/modules/license/LicenseGate"

function App() {
  return (
    <LicenseGate>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Standalone, full-page route (no sidebar) so printing shows only the invoice */}
        <Route
          path="/invoice/:saleId"
          element={
            <RequireAuth>
              <TaxInvoicePage />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Shared: both OWNER and CASHIER can reach these */}
          <Route path="/pos" element={<PosPage />} />
          <Route path="/sales" element={<SalesHistoryPage />} />

          {/* Owner-only pages */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/inventory/categories"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <CategoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/inventory/products"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <ProductPage />
              </RequireAuth>
            }
          />
          <Route
            path="/customers"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <CustomersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <CustomerDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/sales-analytics"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <SalesAnalyticsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/gst"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <GstReportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/margin"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <MarginReportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/stock"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <StockReportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/summary"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <SummaryReportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/accounting/expenses"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <ExpensesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/accounting/day-book"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <DayBookPage />
              </RequireAuth>
            }
          />
          <Route
            path="/accounting/profit-loss"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <ProfitLossPage />
              </RequireAuth>
            }
          />
          <Route
            path="/suppliers"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <SuppliersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/purchases"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <PurchasesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/staff"
            element={
              <RequireAuth allowedRoles={["OWNER"]}>
                <StaffPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </LicenseGate>
  )
}

export default App