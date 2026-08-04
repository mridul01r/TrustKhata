import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Trophy,
  Clock,
  Award,
  Tags,
  AlertCircle,
  Loader2,
  FileX,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSalesAnalytics } from "./useSalesAnalytics";
import { SortableHead, useSortableRows } from "./SortableHeader";
import type { BestSellingProduct, CategorySales } from "./types";
import { MiniBar } from "./MiniBar";

type QuickRange = "today" | "week" | "custom";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function KpiCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold tabular-nums text-foreground">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-base font-semibold">{children}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
      <FileX className="h-7 w-7 opacity-40" />
      <p className="text-sm font-medium text-foreground">{message}</p>
    </div>
  );
}

type BestSellerSortKey = "productName" | "quantitySold" | "revenue";
type CategorySortKey = "categoryName" | "quantitySold" | "revenue";

export default function SalesAnalyticsPage() {
  const today = useMemo(() => new Date(), []);
  const [quickRange, setQuickRange] = useState<QuickRange>("week");
  const [customFrom, setCustomFrom] = useState(toDateString(startOfMonth(today)));
  const [customTo, setCustomTo] = useState(toDateString(today));

  const { from, to } = useMemo(() => {
    if (quickRange === "today") {
      const t = toDateString(today);
      return { from: t, to: t };
    }
    if (quickRange === "week") {
      return { from: toDateString(startOfWeek(today)), to: toDateString(today) };
    }
    return { from: customFrom, to: customTo };
  }, [quickRange, customFrom, customTo, today]);

  const { data: analytics, isLoading, isError } = useSalesAnalytics(from, to);

  const dailyChartData = useMemo(
    () => (analytics?.byDay ?? []).map((d) => ({ ...d, label: d.date.slice(5) })),
    [analytics]
  );

  const hourlyChartData = useMemo(
    () => (analytics?.byHour ?? []).map((h) => ({ ...h, label: formatHour(h.hour) })),
    [analytics]
  );

  const categoryChartData = useMemo(
    () =>
      (analytics?.byCategory ?? [])
        .slice(0, 8)
        .map((c) => ({ ...c, label: c.categoryName })),
    [analytics]
  );

  const summary = useMemo(() => {
    if (!dailyChartData.length) return null;
    const totalRevenue = dailyChartData.reduce((sum, d) => sum + d.revenue, 0);
    const avgPerDay = totalRevenue / dailyChartData.length;
    const bestDay = dailyChartData.reduce((best, d) => (d.revenue > best.revenue ? d : best));
    const busiestHour = hourlyChartData.length
      ? hourlyChartData.reduce((best, h) => (h.revenue > best.revenue ? h : best))
      : null;
    return { totalRevenue, avgPerDay, bestDay, busiestHour };
  }, [dailyChartData, hourlyChartData]);

  const bestSellers = analytics?.bestSellers ?? [];
  const byCategory = analytics?.byCategory ?? [];

  const bestSellerSort = useSortableRows<BestSellingProduct, BestSellerSortKey>(
    bestSellers,
    (row, key) => row[key],
    "revenue",
    "desc"
  );

  const categorySort = useSortableRows<CategorySales, CategorySortKey>(
    byCategory,
    (row, key) => row[key],
    "revenue",
    "desc"
  );
  const maxBestSellerRevenue = Math.max(0, ...bestSellers.map((p) => p.revenue));
  const maxCategoryRevenue = Math.max(0, ...byCategory.map((c) => c.revenue));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sales analytics</h1>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
          <Button
            variant={quickRange === "today" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setQuickRange("today")}
          >
            Today
          </Button>
          <Button
            variant={quickRange === "week" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setQuickRange("week")}
          >
            This week
          </Button>
          <Button
            variant={quickRange === "custom" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setQuickRange("custom")}
          >
            Custom range
          </Button>
        </div>

        {quickRange === "custom" && (
          <div className="flex items-center gap-2 pl-1">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 w-40 text-sm"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 w-40 text-sm"
            />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Loading analytics…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load sales analytics. Check your connection and try again.</p>
        </div>
      )}

      {analytics && (
        <div className="space-y-10">
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                icon={TrendingUp}
                iconBgClass="bg-emerald-500/10"
                iconColorClass="text-emerald-600 dark:text-emerald-400"
                label="Total revenue"
                value={formatCurrency(summary.totalRevenue)}
              />
              <KpiCard
                icon={Calendar}
                iconBgClass="bg-primary/10"
                iconColorClass="text-primary"
                label="Avg. per day"
                value={formatCurrency(summary.avgPerDay)}
              />
              <KpiCard
                icon={Trophy}
                iconBgClass="bg-violet-500/10"
                iconColorClass="text-violet-600 dark:text-violet-400"
                label="Best day"
                value={summary.bestDay.label}
                sublabel={formatCurrency(summary.bestDay.revenue)}
              />
              {summary.busiestHour ? (
                <KpiCard
                  icon={Clock}
                  iconBgClass="bg-amber-500/10"
                  iconColorClass="text-amber-600 dark:text-amber-400"
                  label="Busiest hour"
                  value={summary.busiestHour.label}
                  sublabel={formatCurrency(summary.busiestHour.revenue)}
                />
              ) : (
                <KpiCard
                  icon={Clock}
                  iconBgClass="bg-muted"
                  iconColorClass="text-muted-foreground"
                  label="Busiest hour"
                  value="—"
                />
              )}
            </div>
          )}

          <section>
            <SectionHeading icon={TrendingUp}>Sales trend</SectionHeading>
            {dailyChartData.length === 0 ? (
              <EmptyState message="No sales in this range." />
            ) : (
              <div className="h-64 rounded-xl border border-border bg-card p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value) => `₹${Number(value).toFixed(2)}`}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section>
            <SectionHeading icon={Clock}>Sales by hour</SectionHeading>
            {hourlyChartData.length === 0 ? (
              <EmptyState message="No sales in this range." />
            ) : (
              <div className="h-64 rounded-xl border border-border bg-card p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section>
            <SectionHeading icon={Award}>Best-selling products</SectionHeading>
            {bestSellers.length === 0 ? (
              <EmptyState message="No sales in this range." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <SortableHead
                        label="Product"
                        sortKeyValue="productName"
                        currentKey={bestSellerSort.sortKey}
                        currentDirection={bestSellerSort.sortDirection}
                        onSort={bestSellerSort.toggleSort}
                      />
                      <SortableHead
                        label="Quantity sold"
                        sortKeyValue="quantitySold"
                        currentKey={bestSellerSort.sortKey}
                        currentDirection={bestSellerSort.sortDirection}
                        onSort={bestSellerSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Revenue"
                        sortKeyValue="revenue"
                        currentKey={bestSellerSort.sortKey}
                        currentDirection={bestSellerSort.sortDirection}
                        onSort={bestSellerSort.toggleSort}
                        align="right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestSellerSort.sorted.map((p) => (
                      <TableRow key={p.productId} className="transition-colors hover:bg-accent/60">
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.quantitySold}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold tabular-nums">{formatCurrency(p.revenue)}</span>
                            <MiniBar value={p.revenue} maxValue={maxBestSellerRevenue} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <SectionHeading icon={Tags}>Sales by category</SectionHeading>
            {categoryChartData.length === 0 ? (
              <EmptyState message="No sales in this range." />
            ) : (
              <>
                <div className="mb-4 h-64 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis dataKey="label" type="category" width={120} fontSize={12} />
                      <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableHead
                          label="Category"
                          sortKeyValue="categoryName"
                          currentKey={categorySort.sortKey}
                          currentDirection={categorySort.sortDirection}
                          onSort={categorySort.toggleSort}
                        />
                        <SortableHead
                          label="Quantity sold"
                          sortKeyValue="quantitySold"
                          currentKey={categorySort.sortKey}
                          currentDirection={categorySort.sortDirection}
                          onSort={categorySort.toggleSort}
                          align="right"
                        />
                        <SortableHead
                          label="Revenue"
                          sortKeyValue="revenue"
                          currentKey={categorySort.sortKey}
                          currentDirection={categorySort.sortDirection}
                          onSort={categorySort.toggleSort}
                          align="right"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorySort.sorted.map((c) => (
                        <TableRow key={c.categoryId ?? "uncategorized"} className="transition-colors hover:bg-accent/60">
                          <TableCell className="font-medium">{c.categoryName}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.quantitySold}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold tabular-nums">{formatCurrency(c.revenue)}</span>
                              <MiniBar value={c.revenue} maxValue={maxCategoryRevenue} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}