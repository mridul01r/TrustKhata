import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { usePurchaseImportPreview, usePurchaseImportCommit } from "./usePurchases";
import type { PurchaseImportRowResult, PurchaseItemInput } from "./types";

interface PurchaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (items: PurchaseItemInput[]) => void;
}

type Stage = "pick" | "preview";

export default function PurchaseImportDialog({
  open,
  onOpenChange,
  onImported,
}: PurchaseImportDialogProps) {
  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PurchaseImportRowResult[]>([]);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = usePurchaseImportPreview();
  const commit = usePurchaseImportCommit();

  const reset = () => {
    setStage("pick");
    setFile(null);
    setRows([]);
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    try {
      const result = await preview.mutateAsync(selected);
      setRows(result.rows);
      setStage("preview");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Couldn't read that file. Please check the format and try again."
      );
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setError(null);
    try {
      const result = await commit.mutateAsync(file);
      const items: PurchaseItemInput[] = result.rows
        .filter((r) => r.action !== "ERROR" && r.productId && r.quantity && r.unitCost)
        .map((r) => ({
          productId: r.productId as string,
          quantity: r.quantity as number,
          unitCost: r.unitCost as number,
        }));
      onImported(items);
      handleClose(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Import failed. Please try again.");
    }
  };

  const errorCount = rows.filter((r) => r.action === "ERROR").length;
  const createCount = rows.filter((r) => r.action === "CREATE_NEW").length;
  const matchCount = rows.filter((r) => r.action === "MATCH_EXISTING").length;
  const importableCount = rows.length - errorCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-5xl flex flex-col p-0 gap-0"
        style={{ height: "80vh" }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl">Import purchase items</DialogTitle>
        </DialogHeader>

        {stage === "pick" && (
          <div className="flex-1 min-h-0 flex flex-col px-6 py-5 gap-4 overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowFormatGuide((v) => !v)}
              className="text-sm text-primary text-left w-fit hover:underline"
            >
              {showFormatGuide ? "Hide" : "Show"} file format guide
            </button>

            {showFormatGuide && (
              <div className="rounded-lg border border-border p-4 text-sm shrink-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Required?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>A</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Required</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>B</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Required</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>C</TableCell>
                      <TableCell>Cost (per unit)</TableCell>
                      <TableCell>Required</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>D</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Only required if the product name doesn't already exist</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="mt-3 text-muted-foreground">
                  Row 1 is treated as a header and always skipped. Product names are matched
                  case-insensitively against your existing products — a match reuses that
                  product; no match creates a new one using the category and cost you provide.
                </p>
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg gap-3">
              <p className="text-muted-foreground">Upload a .xlsx file to import</p>
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="max-w-xs"
              />
              {preview.isPending && (
                <p className="text-sm text-muted-foreground">Reading file…</p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        )}

        {stage === "preview" && (
          <>
            <div className="px-6 pt-4 pb-2 shrink-0 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {matchCount} will use existing products, {createCount} will create new products
                {errorCount > 0 ? `, ${errorCount} have errors and will be skipped` : ""}.
              </p>
              <Button variant="outline" size="sm" onClick={reset}>
                Choose a different file
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="font-medium">{row.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.categoryName || "—"}</TableCell>
                      <TableCell className="text-right">{row.quantity ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {row.unitCost != null ? `₹${row.unitCost.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {row.action === "ERROR" ? (
                          <span className="text-destructive">{row.errorMessage}</span>
                        ) : row.action === "CREATE_NEW" ? (
                          <span className="text-amber-500">Will create new product</span>
                        ) : (
                          <span className="text-emerald-500">Matches existing product</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {error && (
              <p className="px-6 pt-2 text-sm text-destructive shrink-0">{error}</p>
            )}
          </>
        )}

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          {stage === "preview" && (
            <Button onClick={handleCommit} disabled={commit.isPending || importableCount === 0}>
              {commit.isPending ? "Importing…" : `Import ${importableCount} item(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}