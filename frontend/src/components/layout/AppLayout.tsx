import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import {
  LayoutDashboard,
  Tags,
  Package,
  ShoppingCart,
  History,
  Wallet,
  BookOpen,
  LineChart,
  Truck,
  ClipboardList,
  BarChart3,
  Receipt,
  TrendingUp,
  Boxes,
  Users,
  Settings,
  LogOut,
  UserCog,
  ChevronRight,
  FileText,
  Store,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBusinessSettings } from "@/modules/settings/useBusinessSettings"

type NavLeaf = {
  to: string
  label: string
  icon: LucideIcon
  roles: string[]
}

type NavEntry =
  | ({ type: "link" } & NavLeaf)
  | { type: "group"; id: string; label: string; icon: LucideIcon; items: NavLeaf[] }

function buildNavStructure(trackInventory: boolean): NavEntry[] {
  return [
    { type: "link", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER"] },
    { type: "link", to: "/pos", label: "Billing", icon: ShoppingCart, roles: ["OWNER", "CASHIER"] },
    { type: "link", to: "/sales", label: "Sales history", icon: History, roles: ["OWNER", "CASHIER"] },
    {
      type: "group",
      id: "inventory",
      label: "Inventory",
      icon: Package,
      items: [
        { to: "/inventory/categories", label: "Categories", icon: Tags, roles: ["OWNER"] },
        { to: "/inventory/products", label: "Products", icon: Package, roles: ["OWNER"] },
        { to: "/suppliers", label: "Suppliers", icon: Truck, roles: ["OWNER"] },
        { to: "/purchases", label: "Purchases", icon: ClipboardList, roles: ["OWNER"] },
      ],
    },
    { type: "link", to: "/customers", label: "Customers", icon: Users, roles: ["OWNER"] },
    {
      type: "group",
      id: "accounting",
      label: "Accounting",
      icon: Wallet,
      items: [
        { to: "/accounting/expenses", label: "Expenses", icon: Wallet, roles: ["OWNER"] },
        { to: "/accounting/day-book", label: "Day book", icon: BookOpen, roles: ["OWNER"] },
        { to: "/accounting/profit-loss", label: "Profit & loss", icon: LineChart, roles: ["OWNER"] },
      ],
    },
    {
      type: "group",
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      items: [
        { to: "/reports/sales-analytics", label: "Sales analytics", icon: BarChart3, roles: ["OWNER"] },
        { to: "/reports/gst", label: "GST reports", icon: Receipt, roles: ["OWNER"] },
        { to: "/reports/margin", label: "Margin & profit", icon: TrendingUp, roles: ["OWNER"] },
        // Stock & inventory report is meaningless without quantity tracking - omit entirely when off
        ...(trackInventory
          ? [{ to: "/reports/stock", label: "Stock & inventory", icon: Boxes, roles: ["OWNER"] }]
          : []),
        { to: "/reports/summary", label: "Summary report", icon: FileText, roles: ["OWNER"] },
      ],
    },
    { type: "link", to: "/staff", label: "Staff", icon: UserCog, roles: ["OWNER"] },
    { type: "link", to: "/settings", label: "Settings", icon: Settings, roles: ["OWNER"] },
  ]
}

function filterForRole(entries: NavEntry[], role: string | null): NavEntry[] {
  return entries
    .map((entry) => {
      if (entry.type === "link") {
        return !role || entry.roles.includes(role) ? entry : null
      }
      const items = entry.items.filter((item) => !role || item.roles.includes(role))
      return items.length > 0 ? { ...entry, items } : null
    })
    .filter((entry): entry is NavEntry => entry !== null)
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + second).toUpperCase() || "?"
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const username = localStorage.getItem("username")
  const role = localStorage.getItem("role")

  const { data: businessSettings } = useBusinessSettings()
  const trackInventory = businessSettings?.trackInventory ?? true

  const navStructure = buildNavStructure(trackInventory)
  const visibleEntries = filterForRole(navStructure, role)

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const entry of visibleEntries) {
      if (entry.type === "group") {
        initial[entry.id] = entry.items.some((item) => location.pathname.startsWith(item.to))
      }
    }
    return initial
  })

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleLogout() {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("username")
    localStorage.removeItem("role")
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 flex-col border-r border-border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">RetailERP</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {visibleEntries.map((entry) => {
            if (entry.type === "link") {
              const Icon = entry.icon
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0] shadow-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {entry.label}
                </NavLink>
              )
            }

            const GroupIcon = entry.icon
            const isOpen = !!openGroups[entry.id]
            const groupIsActive = entry.items.some((item) => location.pathname.startsWith(item.to))

            return (
              <div key={entry.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    groupIsActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {entry.items.map((item) => {
                      const ItemIcon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                              isActive
                                ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0] shadow-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )
                          }
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(username)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{username}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Log out"
              title="Log out"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground/70">
            © 2026 Rakhecha's
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}