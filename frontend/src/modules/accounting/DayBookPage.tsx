import { useMemo, useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Scale, AlertCircle, Loader2, BookX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDayBook } from "./useDayBook";

type QuickRange = "today" | "week" | "custom";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default function DayBookPage() {
  const today = useMemo(() => new Date(), []);
  const [quickRange, setQuickRange] = useState<QuickRange>("today");
  const [customFrom, setCustomFrom] = useState(toDateString(today));
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

  const { data: entries, isLoading, isError } = useDayBook(from, to);

  const summary = useMemo(() => {
    if (!entries) return { totalCredit: 0, totalDebit: 0, closingBalance: 0 };
    return {
      totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
      totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
      closingBalance: entries.length > 0 ? entries[entries.length - 1].runningBalance : 0,
    };
  }, [entries]);

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Day book</h1>
        <p className="text-sm text-muted-foreground">Running ledger of sales and expenses.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-2xl">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total credit
              </p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalCredit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <ArrowDownCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total debit
              </p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalDebit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Closing balance
              </p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.closingBalance)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Loading day book…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load the day book. Check your connection and try again.</p>
        </div>
      )}

      {entries && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <BookX className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">No entries in this range.</p>
          <p className="text-xs">Try a different date range.</p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Description</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Credit</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Debit</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="transition-colors hover:bg-accent/60">
                  <TableCell className="text-muted-foreground">{entry.entryDate}</TableCell>
                  <TableCell>
                    {entry.type === "SALE" ? (
                      <Badge className="border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        Sale
                      </Badge>
                    ) : (
                      <Badge className="border-transparent bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
                        Expense
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(entry.runningBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}