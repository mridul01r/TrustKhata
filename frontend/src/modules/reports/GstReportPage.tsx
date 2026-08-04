import { useMemo, useState } from "react";
import {
  Receipt,
  Landmark,
  Building2,
  ArrowLeftRight,
  Coins,
  FileText,
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
import { useGstReport } from "./useGstReport";
import { SortableHead, useSortableRows } from "./SortableHeader";
import { useTableFilter, TableSearchInput } from "./TableSearchFilter";
import type { TaxRateSummary, HsnSummary } from "./types";

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

type TaxRateSortKey = "gstRate" | "taxableValue" | "cgst" | "sgst" | "igst";
type HsnSortKey = "hsnCode" | "unit" | "gstRate" | "totalQuantity" | "taxableValue" | "cgst" | "sgst" | "igst";

/** Compact colored summary card - smaller than the dashboard's StatCard since
 * six of these need to sit in a row without overwhelming the page. */
function MiniStat({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
}: {
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}>
          <Icon className={`h-4 w-4 ${iconColorClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-sm font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GstReportPage() {
  const today = useMemo(() => new Date(), []);
  const [quickRange, setQuickRange] = useState<QuickRange>("custom");
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

  const { data: report, isLoading, isError } = useGstReport(from, to);

  const byTaxRate = report?.byTaxRate ?? [];
  const byHsn = report?.byHsn ?? [];

  const taxRateSort = useSortableRows<TaxRateSummary, TaxRateSortKey>(
    byTaxRate,
    (row, key) => row[key],
    "gstRate",
    "asc"
  );

  const hsnFilter = useTableFilter(byHsn, (row) => `${row.hsnCode ?? ""} ${row.unit}`);

  const hsnSort = useSortableRows<HsnSummary, HsnSortKey>(
    hsnFilter.filtered,
    (row, key) => {
      if (key === "hsnCode") return row.hsnCode ?? "";
      return row[key];
    },
    "taxableValue",
    "desc"
  );

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">GST reports</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        HSN-wise and tax rate-wise summaries for GSTR-1 / GSTR-3B filing (B2C summary only — no
        GSTIN capture on retail sales)
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
          <p className="text-sm">Loading GST report…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load the GST report. Check your connection and try again.</p>
        </div>
      )}

      {report && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MiniStat
              icon={Receipt}
              iconBgClass="bg-primary/10"
              iconColorClass="text-primary"
              label="Taxable value"
              value={formatCurrency(report.totalTaxableValue)}
            />
            <MiniStat
              icon={Landmark}
              iconBgClass="bg-blue-500/10"
              iconColorClass="text-blue-600 dark:text-blue-400"
              label="CGST"
              value={formatCurrency(report.totalCgst)}
            />
            <MiniStat
              icon={Building2}
              iconBgClass="bg-indigo-500/10"
              iconColorClass="text-indigo-600 dark:text-indigo-400"
              label="SGST"
              value={formatCurrency(report.totalSgst)}
            />
            <MiniStat
              icon={ArrowLeftRight}
              iconBgClass="bg-violet-500/10"
              iconColorClass="text-violet-600 dark:text-violet-400"
              label="IGST"
              value={formatCurrency(report.totalIgst)}
            />
            <MiniStat
              icon={Coins}
              iconBgClass="bg-amber-500/10"
              iconColorClass="text-amber-600 dark:text-amber-400"
              label="Total tax"
              value={formatCurrency(report.totalTax)}
            />
            <MiniStat
              icon={FileText}
              iconBgClass="bg-emerald-500/10"
              iconColorClass="text-emerald-600 dark:text-emerald-400"
              label="Invoice value"
              value={formatCurrency(report.totalInvoiceValue)}
            />
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold">Tax rate-wise summary</h2>
            {byTaxRate.length === 0 ? (
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
                        label="GST rate"
                        sortKeyValue="gstRate"
                        currentKey={taxRateSort.sortKey}
                        currentDirection={taxRateSort.sortDirection}
                        onSort={taxRateSort.toggleSort}
                      />
                      <SortableHead
                        label="Taxable value"
                        sortKeyValue="taxableValue"
                        currentKey={taxRateSort.sortKey}
                        currentDirection={taxRateSort.sortDirection}
                        onSort={taxRateSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="CGST"
                        sortKeyValue="cgst"
                        currentKey={taxRateSort.sortKey}
                        currentDirection={taxRateSort.sortDirection}
                        onSort={taxRateSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="SGST"
                        sortKeyValue="sgst"
                        currentKey={taxRateSort.sortKey}
                        currentDirection={taxRateSort.sortDirection}
                        onSort={taxRateSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="IGST"
                        sortKeyValue="igst"
                        currentKey={taxRateSort.sortKey}
                        currentDirection={taxRateSort.sortDirection}
                        onSort={taxRateSort.toggleSort}
                        align="right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRateSort.sorted.map((row) => (
                      <TableRow key={row.gstRate} className="transition-colors hover:bg-accent/60">
                        <TableCell className="font-medium">{row.gstRate}%</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.taxableValue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.cgst)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.sgst)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.igst)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">HSN-wise summary</h2>
            <TableSearchInput
              value={hsnFilter.query}
              onChange={hsnFilter.setQuery}
              placeholder="Search HSN code or unit…"
            />
            {byHsn.length === 0 ? (
              <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
                <FileX className="h-7 w-7 opacity-40" />
                <p className="text-sm font-medium text-foreground">No sales in this range.</p>
              </div>
            ) : hsnSort.sorted.length === 0 ? (
              <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
                <FileX className="h-7 w-7 opacity-40" />
                <p className="text-sm font-medium text-foreground">No rows match "{hsnFilter.query}".</p>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <SortableHead
                        label="HSN code"
                        sortKeyValue="hsnCode"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                      />
                      <SortableHead
                        label="UQC"
                        sortKeyValue="unit"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                      />
                      <SortableHead
                        label="Rate"
                        sortKeyValue="gstRate"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Quantity"
                        sortKeyValue="totalQuantity"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="Taxable value"
                        sortKeyValue="taxableValue"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="CGST"
                        sortKeyValue="cgst"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="SGST"
                        sortKeyValue="sgst"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                      <SortableHead
                        label="IGST"
                        sortKeyValue="igst"
                        currentKey={hsnSort.sortKey}
                        currentDirection={hsnSort.sortDirection}
                        onSort={hsnSort.toggleSort}
                        align="right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hsnSort.sorted.map((row, i) => (
                      <TableRow
                        key={`${row.hsnCode ?? "none"}-${row.gstRate}-${i}`}
                        className="transition-colors hover:bg-accent/60"
                      >
                        <TableCell className="font-medium">{row.hsnCode ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.gstRate}%</TableCell>
                        <TableCell className="text-right tabular-nums">{row.totalQuantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.taxableValue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.cgst)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.sgst)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.igst)}</TableCell>
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