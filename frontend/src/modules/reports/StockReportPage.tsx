import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStockReport } from "./useStockReport";
import { SortableHead, useSortableRows } from "./SortableHeader";
import { useTableFilter, TableSearchInput } from "./TableSearchFilter";
import type { LowStockItem, DeadStockItem, ProductValuation } from "./types";

const deadStockOptions = [30, 60, 90];

function formatDate(iso: string | null): string {
  if (!iso) return "Never sold";
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

type LowStockSortKey = "productName" | "shortfall";
type DeadStockSortKey = "productName" | "stockQuantity" | "lastSoldAt";
type ValuationSortKey = "productName" | "categoryName" | "stockQuantity" | "purchasePrice" | "stockValue";

// Precomputed shortfall (how far below reorder level, or negative if already at/under zero) —
// this preserves the original "most urgent first" default sort as a proper sortable column.
type LowStockRow = LowStockItem & { shortfall: number };

export default function StockReportPage() {
  const [deadStockDays, setDeadStockDays] = useState(60);
  const { data: report, isLoading, isError } = useStockReport(deadStockDays);

  const lowStockRows: LowStockRow[] = useMemo(() => {
    if (!report) return [];
    return report.lowStock.map((item) => ({
      ...item,
      shortfall: item.stockQuantity - item.reorderLevel,
    }));
  }, [report]);

  const deadStockRows = report?.deadStock ?? [];
  const valuationRows = report?.valuation ?? [];

  const lowStockSort = useSortableRows<LowStockRow, LowStockSortKey>(
    lowStockRows,
    (row, key) => row[key],
    "shortfall",
    "asc"
  );

  const deadStockSort = useSortableRows<DeadStockItem, DeadStockSortKey>(
    deadStockRows,
    (row, key) => {
      if (key === "lastSoldAt") {
        // Never-sold items sort first (most urgent), then oldest last-sold date first.
        return row.lastSoldAt ? new Date(row.lastSoldAt).getTime() : -Infinity;
      }
      return row[key];
    },
    "lastSoldAt",
    "asc"
  );

  const valuationFilter = useTableFilter(
    valuationRows,
    (row) => `${row.productName} ${row.categoryName}`
  );

  const valuationSort = useSortableRows<ProductValuation, ValuationSortKey>(
    valuationFilter.filtered,
    (row, key) => row[key],
    "stockValue",
    "desc"
  );

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-semibold">Stock &amp; inventory</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Current stock valuation, low-stock alerts, and slow-moving items — a live snapshot, not a
        date-range report
      </p>

      {isLoading && <p className="text-muted-foreground">Loading stock report…</p>}
      {isError && (
        <p className="text-destructive">
          Couldn't load the stock report. Check your connection and try again.
        </p>
      )}

      {report && (
        <div className="space-y-10">
          <p className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed">
            <span className="font-semibold text-foreground">₹{report.totalStockValue.toFixed(2)}</span>{" "}
            tied up in stock.{" "}
            {report.lowStock.length === 0 ? (
              "Nothing needs reordering right now"
            ) : (
              <span className="font-semibold text-amber-500">
                {report.lowStock.length} item{report.lowStock.length === 1 ? "" : "s"} need
                {report.lowStock.length === 1 ? "s" : ""} reordering
              </span>
            )}
            , and{" "}
            {report.deadStock.length === 0 ? (
              "everything has sold recently"
            ) : (
              <span className="font-semibold text-muted-foreground">
                {report.deadStock.length} item{report.deadStock.length === 1 ? "" : "s"} haven't
                sold in {deadStockDays}+ days
              </span>
            )}
            .
          </p>

          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Total stock value on hand</p>
            <p className="text-2xl font-semibold">₹{report.totalStockValue.toFixed(2)}</p>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-medium">Low stock</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a column to sort — defaults to most urgent shortfall first.
            </p>
            {lowStockRows.length === 0 ? (
              <p className="text-muted-foreground">Nothing is at or below its reorder level.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="Product"
                      sortKeyValue="productName"
                      currentKey={lowStockSort.sortKey}
                      currentDirection={lowStockSort.sortDirection}
                      onSort={lowStockSort.toggleSort}
                    />
                    <SortableHead
                      label="Stock status"
                      sortKeyValue="shortfall"
                      currentKey={lowStockSort.sortKey}
                      currentDirection={lowStockSort.sortDirection}
                      onSort={lowStockSort.toggleSort}
                      align="right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockSort.sorted.map((item) => {
                    const isOut = item.stockQuantity <= 0;
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              isOut
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOut ? "bg-destructive" : "bg-amber-500"
                              }`}
                            />
                            {isOut
                              ? `Out of stock (reorder at ${item.reorderLevel} ${item.unit})`
                              : `${item.stockQuantity} ${item.unit} left (reorder at ${item.reorderLevel} ${item.unit})`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium">Dead stock</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">No sales in the last</span>
                {deadStockOptions.map((days) => (
                  <Button
                    key={days}
                    variant={deadStockDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDeadStockDays(days)}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a column to sort — defaults to longest unsold first.
            </p>
            {deadStockRows.length === 0 ? (
              <p className="text-muted-foreground">
                Nothing has been sitting unsold for {deadStockDays}+ days.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="Product"
                      sortKeyValue="productName"
                      currentKey={deadStockSort.sortKey}
                      currentDirection={deadStockSort.sortDirection}
                      onSort={deadStockSort.toggleSort}
                    />
                    <SortableHead
                      label="In stock"
                      sortKeyValue="stockQuantity"
                      currentKey={deadStockSort.sortKey}
                      currentDirection={deadStockSort.sortDirection}
                      onSort={deadStockSort.toggleSort}
                      align="right"
                    />
                    <SortableHead
                      label="Last sold"
                      sortKeyValue="lastSoldAt"
                      currentKey={deadStockSort.sortKey}
                      currentDirection={deadStockSort.sortDirection}
                      onSort={deadStockSort.toggleSort}
                      align="right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadStockSort.sorted.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">
                        {item.stockQuantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(item.lastSoldAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Stock valuation</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Click a column to sort — defaults to biggest tied-up capital first.
            </p>
            <TableSearchInput
              value={valuationFilter.query}
              onChange={valuationFilter.setQuery}
              placeholder="Search product or category…"
            />
            {valuationRows.length === 0 ? (
              <p className="text-muted-foreground">No active products.</p>
            ) : valuationSort.sorted.length === 0 ? (
              <p className="text-muted-foreground">No products match "{valuationFilter.query}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="Product"
                      sortKeyValue="productName"
                      currentKey={valuationSort.sortKey}
                      currentDirection={valuationSort.sortDirection}
                      onSort={valuationSort.toggleSort}
                    />
                    <SortableHead
                      label="Category"
                      sortKeyValue="categoryName"
                      currentKey={valuationSort.sortKey}
                      currentDirection={valuationSort.sortDirection}
                      onSort={valuationSort.toggleSort}
                    />
                    <SortableHead
                      label="In stock"
                      sortKeyValue="stockQuantity"
                      currentKey={valuationSort.sortKey}
                      currentDirection={valuationSort.sortDirection}
                      onSort={valuationSort.toggleSort}
                      align="right"
                    />
                    <SortableHead
                      label="Purchase price"
                      sortKeyValue="purchasePrice"
                      currentKey={valuationSort.sortKey}
                      currentDirection={valuationSort.sortDirection}
                      onSort={valuationSort.toggleSort}
                      align="right"
                    />
                    <SortableHead
                      label="Stock value"
                      sortKeyValue="stockValue"
                      currentKey={valuationSort.sortKey}
                      currentDirection={valuationSort.sortDirection}
                      onSort={valuationSort.toggleSort}
                      align="right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuationSort.sorted.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                      <TableCell className="text-right">
                        {item.stockQuantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.stockValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}