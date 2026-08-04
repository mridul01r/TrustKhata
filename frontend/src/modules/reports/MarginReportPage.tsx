import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Info,
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
import { useMarginReport } from "./useMarginReport";
import { SortableHead, useSortableRows } from "./SortableHeader";
import { useTableFilter, TableSearchInput } from "./TableSearchFilter";
import type { ProductMargin, CategoryMargin } from "./types";

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

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function marginColor(marginPercent: number): string {
  if (marginPercent < 0) return "text-destructive";
  if (marginPercent < 15) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function KpiCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
  valueClassName = "",
}: {
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold tabular-nums text-foreground ${valueClassName}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type ProductSortKey = "productName" | "quantitySold" | "revenue" | "cogs" | "grossProfit" | "marginPercent";
type CategorySortKey = "categoryName" | "revenue" | "cogs" | "grossProfit" | "marginPercent";

export default function MarginReportPage() {
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

  const { data: report, isLoading, isError } = useMarginReport(from, to);

  const byProduct = report?.byProduct ?? [];
  const byCategory = report?.byCategory ?? [];

  const productFilter = useTableFilter(byProduct, (row) => row.productName);

  // Lowest margin first by default, same as before — now toggleable via column headers.
  const productSort = useSortableRows<ProductMargin, ProductSortKey>(
    productFilter.filtered,
    (row, key) => row[key],
    "marginPercent",
    "asc"
  );
  const categorySort = useSortableRows<CategoryMargin, CategorySortKey>(
    byCategory,
    (row, key) => row[key],
    "marginPercent",
    "asc"
  );

  const lossMakingCount = byProduct.filter((p) => p.marginPercent < 0).length;
  const isProfitPositive = (report?.totalGrossProfit ?? 0) >= 0;

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Margin &amp; profit</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Gross profit per product and category, based on purchase price at time of sale
      </p>

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
          <p className="text-sm">Loading margin report…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load the margin report. Check your connection and try again.</p>
        </div>
      )}

      {report && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              icon={TrendingUp}
              iconBgClass="bg-primary/10"
              iconColorClass="text-primary"
              label="Revenue"
              value={formatCurrency(report.totalRevenue)}
            />
            <KpiCard
              icon={isProfitPositive ? TrendingUp : TrendingDown}
              iconBgClass={isProfitPositive ? "bg-emerald-500/10" : "bg-destructive/10"}
              iconColorClass={isProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
              label="Gross profit"
              value={formatCurrency(report.totalGrossProfit)}
              valueClassName={isProfitPositive ? "" : "text-destructive"}
            />
            <KpiCard
              icon={Percent}
              iconBgClass="bg-muted"
              iconColorClass={marginColor(report.overallMarginPercent)}
              label="Margin"
              value={`${report.overallMarginPercent.toFixed(1)}%`}
              valueClassName={marginColor(report.overallMarginPercent)}
            />
            <KpiCard
              icon={lossMakingCount > 0 ? AlertTriangle : CheckCircle2}
              iconBgClass={lossMakingCount > 0 ? "bg-destructive/10" : "bg-emerald-500/10"}
              iconColorClass={lossMakingCount > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}
              label="Loss-making products"
              value={String(lossMakingCount)}
              valueClassName={lossMakingCount > 0 ? "text-destructive" : ""}
            />
          </div>

          {lossMakingCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {lossMakingCount} product{lossMakingCount === 1 ? "" : "s"} sold at a loss this
              period — see the top of the table below.
            </div>
          )}

          {report.totalExcludedLineItems > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0" />
              {report.totalExcludedLineItems} line item
              {report.totalExcludedLineItems === 1 ? "" : "s"} in this range had no recorded cost
              (product deleted since sale) and were excluded from COGS/margin figures.
            </div>
          )}

          <section>
            <h2 className="mb-3 text-base font-semibold">Margin by product</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a column to sort — defaults to lowest margin first.
            </p>
            <TableSearchInput
              value={productFilter.query}
              onChange={productFilter.setQuery}
              placeholder="Search product…"
            />
            {byProduct.length === 0 ? (
              <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
                <FileX className="h-7 w-7 opacity-40" />
                <p className="text-sm font-medium text-foreground">No sales in this range.</p>
              </div>
            ) : productSort.sorted.length === 0 ? (
              <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
                <FileX className="h-7 w-7 opacity-40" />
                <p className="text-sm font-medium text-foreground">No products match "{productFilter.query}".</p>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <SortableHead
                        label="Product"
                        sortKeyValue="productName"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                      />
                      <SortableHead
                        label="Quantity sold"
                        sortKeyValue="quantitySold"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Revenue"
                        sortKeyValue="revenue"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="COGS"
                        sortKeyValue="cogs"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Gross profit"
                        sortKeyValue="grossProfit"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Margin"
                        sortKeyValue="marginPercent"
                        currentKey={productSort.sortKey}
                        currentDirection={productSort.sortDirection}
                        onSort={productSort.toggleSort}
                        align="right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSort.sorted.map((p) => (
                      <TableRow key={p.productId} className="transition-colors hover:bg-accent/60">
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.quantitySold}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.cogs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.grossProfit)}</TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${marginColor(p.marginPercent)}`}>
                          {p.marginPercent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Margin by category</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a column to sort — defaults to lowest margin first.
            </p>
            {byCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
                <FileX className="h-7 w-7 opacity-40" />
                <p className="text-sm font-medium text-foreground">No sales in this range.</p>
              </div>
            ) : (
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
                        label="Revenue"
                        sortKeyValue="revenue"
                        currentKey={categorySort.sortKey}
                        currentDirection={categorySort.sortDirection}
                        onSort={categorySort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="COGS"
                        sortKeyValue="cogs"
                        currentKey={categorySort.sortKey}
                        currentDirection={categorySort.sortDirection}
                        onSort={categorySort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Gross profit"
                        sortKeyValue="grossProfit"
                        currentKey={categorySort.sortKey}
                        currentDirection={categorySort.sortDirection}
                        onSort={categorySort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Margin"
                        sortKeyValue="marginPercent"
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
                        <TableCell className="text-right tabular-nums">{formatCurrency(c.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(c.cogs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(c.grossProfit)}</TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${marginColor(c.marginPercent)}`}>
                          {c.marginPercent.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}