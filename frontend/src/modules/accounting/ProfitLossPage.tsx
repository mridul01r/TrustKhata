import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Scale, PieChart, AlertCircle, Loader2, FileX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfitLoss } from "./useProfitLoss";

type QuickRange = "today" | "week" | "custom";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
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

export default function ProfitLossPage() {
  const today = useMemo(() => new Date(), []);
  const [quickRange, setQuickRange] = useState<QuickRange>("today");
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

  const { data: report, isLoading, isError } = useProfitLoss(from, to);

  const netProfit = report?.netProfit ?? 0;
  const isProfitPositive = netProfit >= 0;

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Profit &amp; loss</h1>
        <p className="text-sm text-muted-foreground">Revenue, expenses, and net profit for the period.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
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
          <p className="text-sm">Loading report…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load the profit &amp; loss report. Check your connection and try again.</p>
        </div>
      )}

      {report && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-2xl">
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Revenue
                  </p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(report.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                  <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Expenses
                  </p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(report.totalExpenses)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isProfitPositive ? "bg-emerald-500/10" : "bg-destructive/10"
                  }`}
                >
                  <Scale
                    className={`h-5 w-5 ${
                      isProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Net profit
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      isProfitPositive ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Expense breakdown</h2>
          </div>

          {report.expenseBreakdown.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
              <FileX className="h-7 w-7 opacity-40" />
              <p className="text-sm font-medium text-foreground">No expenses in this range.</p>
            </div>
          )}

          {report.expenseBreakdown.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Amount</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide w-40">
                      % of expenses
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.expenseBreakdown.map((row) => {
                    const pct =
                      report.totalExpenses > 0 ? (row.amount / report.totalExpenses) * 100 : 0;
                    return (
                      <TableRow key={row.categoryName} className="transition-colors hover:bg-accent/60">
                        <TableCell className="font-medium">{row.categoryName}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="w-12 tabular-nums text-muted-foreground">
                              {report.totalExpenses > 0 ? `${pct.toFixed(1)}%` : "—"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}