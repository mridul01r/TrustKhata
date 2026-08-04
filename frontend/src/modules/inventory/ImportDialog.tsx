import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { importApi } from "./api";
import type { ImportSummaryResponse } from "./types";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = "pick" | "previewing" | "preview" | "committing" | "done";

export default function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const reset = () => {
    setStage("pick");
    setFile(null);
    setSummary(null);
    setError(null);
    setShowGuide(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileSelected = async (selected: File) => {
    setFile(selected);
    setError(null);
    setStage("previewing");
    try {
      const result = await importApi.preview(selected);
      setSummary(result);
      setStage("preview");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't read this file. Make sure it's a valid .xlsx export.");
      setStage("pick");
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setStage("committing");
    setError(null);
    try {
      const result = await importApi.commit(file);
      setSummary(result);
      setStage("done");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Import failed. Nothing was saved.");
      setStage("preview");
    }
  };

  const isDone = stage === "done";
  const hasBlockingErrors = summary?.rows.some((r) => r.productAction === "ERROR") ?? false;

  const statusLabel = (action: "CREATE" | "UPDATE" | "ERROR") => {
    if (action === "CREATE") return isDone ? "Created" : "Will create";
    if (action === "UPDATE") return isDone ? "Updated" : "Will update";
    return "Error";
  };

  const statusPillClass = (action: "CREATE" | "UPDATE" | "ERROR") => {
    if (action === "CREATE")
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (action === "UPDATE")
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] !max-w-5xl w-full flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              Import products from Excel
            </DialogTitle>
            {stage === "pick" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setShowGuide((prev) => !prev)}
              >
                <Info className="h-4 w-4" />
                File format
              </Button>
            )}
          </div>
        </DialogHeader>

        {stage === "pick" && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
            {showGuide && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <p className="font-medium text-foreground">Column order</p>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-1.5 font-semibold uppercase tracking-wide text-muted-foreground">Column</th>
                        <th className="px-3 py-1.5 font-semibold uppercase tracking-wide text-muted-foreground">Header</th>
                        <th className="px-3 py-1.5 font-semibold uppercase tracking-wide text-muted-foreground">Required?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-3 py-1.5 font-mono">A</td>
                        <td className="px-3 py-1.5">Category</td>
                        <td className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400">Yes</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono">B</td>
                        <td className="px-3 py-1.5">Product Name</td>
                        <td className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400">Yes</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono">C</td>
                        <td className="px-3 py-1.5">Price</td>
                        <td className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400">Yes</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono">D</td>
                        <td className="px-3 py-1.5">Quantity</td>
                        <td className="px-3 py-1.5 text-muted-foreground">Optional</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono">E</td>
                        <td className="px-3 py-1.5">GST Rate</td>
                        <td className="px-3 py-1.5 text-muted-foreground">Optional</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono">F</td>
                        <td className="px-3 py-1.5">Purchase Price</td>
                        <td className="px-3 py-1.5 text-muted-foreground">Optional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground">
                  Row 1 is a header and gets skipped. Leave any optional column (D–F) blank to
                  skip it — new products default to 0, existing products keep their current
                  value untouched. GST rate is a plain number (18, not 0.18). Updates match by{" "}
                  <span className="font-medium text-foreground">product name</span>, so renaming
                  a product creates a new one instead of updating it.
                </p>
              </div>
            )}

            <label
              htmlFor="import-file-input"
              className="group flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Choose an .xlsx file to import
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Category, Product Name, Price, and optionally Quantity, GST Rate, and Purchase
                Price
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Browse files
              </span>
              <input
                ref={fileInputRef}
                id="import-file-input"
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileSelected(selected);
                }}
                className="sr-only"
              />
            </label>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        {stage === "previewing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Reading file…</p>
          </div>
        )}

        {(stage === "preview" || stage === "committing" || stage === "done") && summary && (
          <div className="flex min-h-0 flex-1 flex-col space-y-3 py-2">
            {isDone && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Import complete. Your product list has been updated.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                {summary.totalRows} rows
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                {summary.newProducts} {isDone ? "created" : "new"}
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-medium text-blue-600 dark:text-blue-400">
                {summary.updatedProducts} updated
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                {summary.newCategories} new {summary.newCategories === 1 ? "category" : "categories"}
              </span>
              {summary.errorCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                  {summary.errorCount} {summary.errorCount === 1 ? "error" : "errors"}
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14 text-xs font-semibold uppercase tracking-wide">Row</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Product</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Price</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Quantity</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">GST Rate</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Purchase Price</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.rows.map((row) => (
                    <TableRow key={row.rowNumber} className="transition-colors hover:bg-accent/60">
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          {row.categoryName}
                          {row.categoryIsNew && (
                            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              new
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.price != null ? `₹${row.price.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.quantity != null ? row.quantity : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.gstRate != null ? `${row.gstRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.purchasePrice != null ? `₹${row.purchasePrice.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {row.productAction === "ERROR" ? (
                          <span
                            className={`inline-block max-w-[220px] truncate rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass(row.productAction)}`}
                            title={row.errorMessage ?? undefined}
                          >
                            {row.errorMessage}
                          </span>
                        ) : (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass(row.productAction)}`}>
                            {statusLabel(row.productAction)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {stage !== "done" && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
          )}
          {stage === "preview" && (
            <Button onClick={handleConfirm} disabled={hasBlockingErrors} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Confirm import
            </Button>
          )}
          {stage === "committing" && (
            <Button disabled className="gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing…
            </Button>
          )}
          {stage === "done" && <Button onClick={() => handleClose(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}