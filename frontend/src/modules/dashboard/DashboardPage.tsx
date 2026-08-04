import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
  TrendingUp,
  TrendingDown,
  Boxes,
  Wallet,
  Receipt,
  Users,
  ArrowRight,
  AlertTriangle,
  Clock,
  PackageSearch,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSalesAnalytics } from "@/modules/reports/useSalesAnalytics"
import { useStockReport } from "@/modules/reports/useStockReport"
import { useProfitLoss } from "@/modules/accounting/useProfitLoss"
import { useSales } from "@/modules/pos/useSales"
import { useCustomers } from "@/modules/customer/useCustomers"
import { useBusinessSettings } from "@/modules/settings/useBusinessSettings"

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/** Reusable stat card - keeps the 4 top-row metrics visually consistent
 * without repeating the same markup four times. */
function StatCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  isLoading,
  value,
  valueColorClass = "text-foreground",
  sub,
}: {
  icon: LucideIcon
  iconBgClass: string
  iconColorClass: string
  label: string
  isLoading: boolean
  value: React.ReactNode
  valueColorClass?: string
  sub: React.ReactNode
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className={`truncate text-xl font-bold ${valueColorClass}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Small pill-style "View all" link, used consistently across every panel header. */
function ViewAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      View all
      <ArrowRight className="h-3 w-3" />
    </Link>
  )
}

/** Centered empty-state block, matching the pattern used elsewhere in the app. */
function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
      <Icon className="h-7 w-7 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const username = localStorage.getItem("username")
  const today = todayISO()

  const { data: businessSettings } = useBusinessSettings()
  const trackInventory = businessSettings?.trackInventory ?? true

  const salesAnalytics = useSalesAnalytics(today, today)
  const stockReport = useStockReport(60)
  const profitLoss = useProfitLoss(today, today)
  const recentSales = useSales()
  const customers = useCustomers()

  const todayRevenue = salesAnalytics.data?.byDay.reduce((sum, d) => sum + d.revenue, 0) ?? 0
  const todaySaleCount = salesAnalytics.data?.byDay.reduce((sum, d) => sum + d.saleCount, 0) ?? 0

  const lowStockItems = stockReport.data?.lowStock ?? []
  const netProfit = profitLoss.data?.netProfit ?? 0
  const isProfitPositive = netProfit >= 0

  const sortedRecentSales = [...(recentSales.data ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const customersWithBalance = [...(customers.data ?? [])]
    .filter((c) => c.outstandingBalance > 0)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
  const totalOutstanding = customersWithBalance.reduce((sum, c) => sum + c.outstandingBalance, 0)

  return (
    <div className="flex h-screen flex-col gap-4 overflow-hidden p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome, {username}
        </h1>
        <p className="text-sm text-muted-foreground">{formatToday()} · Here's today's overview.</p>
      </div>

      {/* Stat row - fixed height; 3 or 4 columns depending on whether Low Stock is shown */}
      <div
        className={`grid shrink-0 grid-cols-2 gap-3 ${
          trackInventory ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}
      >
        <StatCard
          icon={TrendingUp}
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          label="Today's Sales"
          isLoading={salesAnalytics.isLoading}
          value={formatCurrency(todayRevenue)}
          sub={`${todaySaleCount} ${todaySaleCount === 1 ? "sale" : "sales"}`}
        />

        <StatCard
          icon={isProfitPositive ? TrendingUp : TrendingDown}
          iconBgClass={isProfitPositive ? "bg-emerald-500/10" : "bg-destructive/10"}
          iconColorClass={isProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
          label="Today's Profit"
          isLoading={profitLoss.isLoading}
          value={formatCurrency(netProfit)}
          valueColorClass={isProfitPositive ? "text-foreground" : "text-destructive"}
          sub={`Exp ${formatCurrency(profitLoss.data?.totalExpenses ?? 0)}`}
        />

        {trackInventory && (
          <StatCard
            icon={lowStockItems.length > 0 ? AlertTriangle : Boxes}
            iconBgClass={lowStockItems.length > 0 ? "bg-amber-500/10" : "bg-muted"}
            iconColorClass={
              lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            }
            label="Low Stock"
            isLoading={stockReport.isLoading}
            value={lowStockItems.length}
            valueColorClass={lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}
            sub="need reorder"
          />
        )}

        <StatCard
          icon={Wallet}
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
          label="Outstanding Credit"
          isLoading={customers.isLoading}
          value={formatCurrency(totalOutstanding)}
          sub={`${customersWithBalance.length} ${customersWithBalance.length === 1 ? "customer" : "customers"}`}
        />
      </div>

      {/* Detail row - fills remaining height, each panel scrolls internally */}
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 gap-4 ${
          trackInventory ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        <Card className="flex min-h-0 flex-col shadow-sm">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Recent Sales
            </CardTitle>
            <ViewAllLink to="/sales" />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto pt-3">
            {recentSales.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sortedRecentSales.length === 0 ? (
              <EmptyState icon={Receipt} message="No sales yet today." />
            ) : (
              <div className="space-y-1">
                {sortedRecentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{sale.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.customerName ?? "Walk-in"} · {formatTime(sale.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {trackInventory && (
          <Card className="flex min-h-0 flex-col shadow-sm">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PackageSearch className="h-3.5 w-3.5 text-muted-foreground" />
                Products to Reorder
              </CardTitle>
              <ViewAllLink to="/reports/stock" />
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-3">
              {stockReport.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : lowStockItems.length === 0 ? (
                <EmptyState icon={CheckCircle2} message="Nothing needs reordering right now." />
              ) : (
                <div className="space-y-1">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/60"
                    >
                      <p className="truncate font-medium text-foreground">{item.productName}</p>
                      <Badge variant="destructive" className="shrink-0">
                        {item.stockQuantity} {item.unit} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex min-h-0 flex-col shadow-sm">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              Outstanding Balances
            </CardTitle>
            <ViewAllLink to="/customers" />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto pt-3">
            {customers.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : customersWithBalance.length === 0 ? (
              <EmptyState icon={CheckCircle2} message="No outstanding balances." />
            ) : (
              <div className="space-y-1.5">
                {customersWithBalance.map((c) => (
                  <Link
                    key={c.id}
                    to={`/customers/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-2.5 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-foreground">
                      <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {c.name}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-destructive">
                      {formatCurrency(c.outstandingBalance)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}