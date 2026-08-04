import { useMemo, useState } from "react";
import { Receipt, TrendingUp, AlertCircle, FileX, Loader2 } from "lucide-react";
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
import { useSales } from "./useSales";
import ReceiptDialog from "./ReceiptDialog";
import type { SaleResponse } from "./types";

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

export default function SalesHistoryPage() {
  const today = useMemo(() => new Date(), []);
  const isCashier = useMemo(() => localStorage.getItem("role") === "CASHIER", []);
  const [quickRange, setQuickRange] = useState<QuickRange>("today");
  const [customFrom, setCustomFrom] = useState(toDateString(today));
  const [customTo, setCustomTo] = useState(toDateString(today));
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);

  const { from, to } = useMemo(() => {
    if (isCashier || quickRange === "today") {
      const t = toDateString(today);
      return { from: t, to: t };
    }
    if (quickRange === "week") {
      return { from: toDateString(startOfWeek(today)), to: toDateString(today) };
    }
    return { from: customFrom, to: customTo };
  }, [isCashier, quickRange, customFrom, customTo, today]);

  const { data: sales, isLoading, isError } = useSales(from, to);

  const summary = useMemo(() => {
    if (!sales) return { count: 0, total: 0 };
    return {
      count: sales.length,
      total: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    };
  }, [sales]);

  const formatPaymentMethods = (sale: SaleResponse) =>
    sale.payments.map((p) => p.method).join(" + ");

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Sales history</h1>
        <p className="text-sm text-muted-foreground">Browse and review past transactions.</p>
      </div>

      {!isCashier && (
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
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sales
              </p>
              <p className="text-xl font-bold text-foreground">{summary.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Revenue
              </p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.total)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Loading sales…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load sales history. Check your connection and try again.</p>
        </div>
      )}

      {sales && sales.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <FileX className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">No sales in this range.</p>
          <p className="text-xs">Try a different date range.</p>
        </div>
      )}

      {sales && sales.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Invoice #</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Total</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Payment</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer transition-colors hover:bg-accent/60"
                  onClick={() => setSelectedSale(sale)}
                >
                  <TableCell className="text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(sale.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      {formatPaymentMethods(sale)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === "COMPLETED" ? (
                      <Badge className="border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{sale.status}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReceiptDialog sale={selectedSale} onClose={() => setSelectedSale(null)} autoPrint={false} />
    </div>
  );
}