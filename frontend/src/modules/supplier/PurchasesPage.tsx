import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableCombobox from "@/components/shared/SearchableCombobox";
import { useSuppliers } from "./useSuppliers";
import { usePurchases, useCreatePurchase } from "./usePurchases";
import { purchaseApi } from "./api";
import {
  useProducts,
  useCreateProduct,
} from "@/modules/inventory/useProducts";
import { useCategories } from "@/modules/inventory/useCategories";
import type { ProductRequest } from "@/modules/inventory/types";
import PurchaseImportDialog from "./PurchaseImportDialog";
import type { Purchase, PurchaseInput, PurchaseItemInput } from "./types";

type QuickRange = "today" | "week" | "custom";

const NEW_PRODUCT_SENTINEL = "__new_product__";
const PRODUCT_FIELD_HEIGHT = "h-11 pl-9 pr-8 text-sm";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function todayIso(): string {
  return toDateString(new Date());
}

const emptyLineItem: PurchaseItemInput = { productId: "", quantity: 1, unitCost: 0 };

const emptyQuickAddForm: ProductRequest = {
  sku: "",
  name: "",
  description: "",
  categoryId: null,
  unit: "PCS",
  hsnCode: "",
  gstRate: 0,
  purchasePrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  reorderLevel: 0,
};

function slugifySku(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 30);
}

export default function PurchasesPage() {
  const today = useMemo(() => new Date(), []);
  const [quickRange, setQuickRange] = useState<QuickRange>("today");
  const [customFrom, setCustomFrom] = useState(todayIso());
  const [customTo, setCustomTo] = useState(todayIso());

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

  const { data: purchases, isLoading, isError } = usePurchases(from, to);
  const { data: suppliers } = useSuppliers();
  // Fetch ALL products (active + inactive), matching ProductPage's convention -
  // otherwise a matched-but-inactive product from an import can resolve to a
  // real productId while its name never shows in the dropdown/label lookup.
  const { data: products } = useProducts(false);
  const { data: categories } = useCategories(true);
  const createPurchase = useCreatePurchase();
  const createProduct = useCreateProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [items, setItems] = useState<PurchaseItemInput[]>([{ ...emptyLineItem }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [quickAddLineIndex, setQuickAddLineIndex] = useState<number | null>(null);
  const [quickAddForm, setQuickAddForm] = useState<ProductRequest>(emptyQuickAddForm);
  const [quickAddSkuManuallyEdited, setQuickAddSkuManuallyEdited] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const supplierItems = useMemo(
    () => (suppliers ?? []).map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
  );
  const productOptions = useMemo(
    () => (products ?? []).map((p) => ({ id: p.id, name: p.name })),
    [products]
  );
  const quickAddCategoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  const openCreateDialog = () => {
    setSupplierId(suppliers?.[0]?.id ?? "");
    setReferenceNumber("");
    setPurchaseDate(todayIso());
    setItems([{ ...emptyLineItem }]);
    setFormError(null);
    setDialogOpen(true);
  };

  const updateItem = (index: number, patch: Partial<PurchaseItemInput>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLineItem = () => {
    setItems((prev) => [...prev, { ...emptyLineItem }]);
  };

  const removeLineItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImported = (importedItems: PurchaseItemInput[]) => {
    setItems((prev) => {
      const kept = prev.filter((item) => item.productId);
      return [...kept, ...importedItems];
    });
  };

  const handleProductSelect = (index: number, value: string) => {
    if (value === NEW_PRODUCT_SENTINEL) {
      setQuickAddLineIndex(index);
      setQuickAddForm({
        ...emptyQuickAddForm,
        purchasePrice: items[index]?.unitCost || 0,
      });
      setQuickAddSkuManuallyEdited(false);
      setQuickAddError(null);
      return;
    }
    updateItem(index, { productId: value });
  };

  const handleQuickAddNameChange = (name: string) => {
    setQuickAddForm((prev) => ({
      ...prev,
      name,
      sku: !quickAddSkuManuallyEdited ? slugifySku(name) : prev.sku,
    }));
  };

  const closeQuickAdd = () => {
    setQuickAddLineIndex(null);
    setQuickAddForm(emptyQuickAddForm);
    setQuickAddSkuManuallyEdited(false);
    setQuickAddError(null);
  };

  const handleQuickAddSubmit = async () => {
    if (quickAddLineIndex === null) return;
    setQuickAddError(null);
    if (!quickAddForm.name.trim() || !quickAddForm.sku.trim()) {
      setQuickAddError("Name is required.");
      return;
    }
    try {
      const created = await createProduct.mutateAsync(quickAddForm);
      const newProductId = (created as { id: string })?.id;
      if (newProductId) {
        updateItem(quickAddLineIndex, { productId: newProductId });
      }
      closeQuickAdd();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Couldn't create the product. Please try again.";
      setQuickAddError(message);
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleSubmit = async () => {
    setFormError(null);
    const validItems = items.filter((i) => i.productId && i.quantity > 0 && i.unitCost > 0);
    if (validItems.length === 0) {
      setFormError("Add at least one line item with product, quantity, and cost.");
      return;
    }
    const input: PurchaseInput = {
      supplierId,
      referenceNumber: referenceNumber || undefined,
      purchaseDate,
      items: validItems,
    };
    try {
      await createPurchase.mutateAsync(input);
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  // Opens the PDF inline in a new browser tab (native PDF viewer) instead of
  // forcing a raw file download - avoids the OS "how do you want to open
  // this file?" prompt that shows up when there's no default PDF app set.
  const handleExport = async () => {
    if (!viewingPurchase) return;
    setExportError(null);
    setExporting(true);
    try {
      const blob = await purchaseApi.fetchPurchasePdf(viewingPurchase.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      setExportError(err?.response?.data?.message ?? "Couldn't export the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Loads the same PDF into a hidden iframe and triggers the browser's native
  // print dialog directly, without needing the user to open/save the file first.
  const handlePrint = async () => {
    if (!viewingPurchase) return;
    setExportError(null);
    setPrinting(true);
    try {
      const blob = await purchaseApi.fetchPurchasePdf(viewingPurchase.id);
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 60_000);
    } catch (err: any) {
      setExportError(err?.response?.data?.message ?? "Couldn't print the PDF. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Purchases</h1>
        <Button onClick={openCreateDialog} disabled={!suppliers || suppliers.length === 0}>
          Record purchase
        </Button>
      </div>

      {suppliers && suppliers.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Add a supplier first before recording a purchase.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={quickRange === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickRange("today")}
        >
          Today
        </Button>
        <Button
          variant={quickRange === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickRange("week")}
        >
          This week
        </Button>
        <Button
          variant={quickRange === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setQuickRange("custom")}
        >
          Custom range
        </Button>

        {quickRange === "custom" && (
          <div className="flex items-center gap-2 pl-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-40"
            />
          </div>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading purchases…</p>}
      {isError && (
        <p className="text-destructive">
          Couldn't load purchases. Check your connection and try again.
        </p>
      )}

      {purchases && purchases.length === 0 && (
        <p className="text-muted-foreground">No purchases recorded in this range.</p>
      )}

      {purchases && purchases.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow
                key={purchase.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => {
                  setExportError(null);
                  setViewingPurchase(purchase);
                }}
              >
                <TableCell className="text-muted-foreground">{purchase.purchaseDate}</TableCell>
                <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                <TableCell className="text-muted-foreground">{purchase.referenceNumber || "—"}</TableCell>
                <TableCell className="text-right">{purchase.items.length}</TableCell>
                <TableCell className="text-right">₹{purchase.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Record purchase dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="flex flex-col p-0 gap-0"
          style={{ width: "70vw", maxWidth: "70vw", height: "80vh" }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-xl">Record purchase</DialogTitle>
          </DialogHeader>

          <div className="px-6 pt-6 pb-4 shrink-0">
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-2 min-w-0">
                <Label className="text-sm">Supplier</Label>
                <Select value={supplierId || undefined} onValueChange={(v) => setSupplierId(v ?? "")}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select supplier" className="truncate" items={supplierItems} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="purchase-date" className="text-sm">Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full h-11"
                />
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="purchase-reference" className="text-sm">Reference #</Label>
                <Input
                  id="purchase-reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-11"
                />
              </div>
            </div>
          </div>

          <div className="px-6 flex flex-col flex-1 min-h-0">
            <div className="mb-4 flex items-center justify-between shrink-0">
              <Label className="text-base">Line items</Label>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  Import
                </Button>
                <Button variant="outline" onClick={addLineItem}>
                  Add item
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border flex flex-col flex-1 min-h-0">
              <div className="grid grid-cols-12 gap-5 border-b border-border bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground shrink-0">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit cost</div>
                <div className="col-span-2 text-right">Line total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
                {items.map((item, index) => {
                  const lineTotal = item.quantity * item.unitCost;
                  return (
                    <div key={index} className="grid grid-cols-12 gap-5 items-center px-4 py-4">
                      <div className="col-span-5 min-w-0">
                        <SearchableCombobox
                          options={productOptions}
                          value={item.productId}
                          onChange={(id) => handleProductSelect(index, id)}
                          placeholder="Search product…"
                          ariaLabel="Select product"
                          pinnedOption={{ id: NEW_PRODUCT_SENTINEL, label: "+ Add new product" }}
                          inputClassName={PRODUCT_FIELD_HEIGHT}
                        />
                      </div>
                      <div className="col-span-2 min-w-0">
                        <Input
                          type="number"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateItem(index, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })
                          }
                          placeholder="Qty"
                          className="w-full h-11"
                        />
                      </div>
                      <div className="col-span-2 min-w-0">
                        <Input
                          type="number"
                          value={item.unitCost === 0 ? "" : item.unitCost}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateItem(index, { unitCost: e.target.value === "" ? 0 : Number(e.target.value) })
                          }
                          placeholder="Cost/unit"
                          className="w-full h-11"
                        />
                      </div>
                      <div className="col-span-2 text-right text-base font-medium">
                        ₹{lineTotal.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                          ✕
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-sm text-destructive">{formError}</p>
            <p className="text-base font-medium">
              Grand total: <span className="text-2xl font-semibold">₹{grandTotal.toFixed(2)}</span>
            </p>
          </div>

          <DialogFooter className="px-6 pb-6 shrink-0">
            <Button variant="outline" size="lg" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleSubmit} disabled={createPurchase.isPending || !supplierId}>
              {createPurchase.isPending ? "Saving…" : "Save purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk-import dialog for line items */}
      <PurchaseImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={handleImported}
      />

      {/* Quick-add product dialog, triggered from a line item's product picker */}
      <Dialog open={quickAddLineIndex !== null} onOpenChange={(open) => !open && closeQuickAdd()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add new product</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="quickadd-name">Name</Label>
              <Input
                id="quickadd-name"
                value={quickAddForm.name}
                onChange={(e) => handleQuickAddNameChange(e.target.value)}
                placeholder="e.g. Basmati Rice 1kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickadd-sku">
                SKU <span className="text-xs font-normal text-muted-foreground">(auto-filled, editable)</span>
              </Label>
              <Input
                id="quickadd-sku"
                value={quickAddForm.sku}
                onChange={(e) => {
                  setQuickAddSkuManuallyEdited(true);
                  setQuickAddForm((prev) => ({ ...prev, sku: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableCombobox
                options={quickAddCategoryOptions}
                value={quickAddForm.categoryId ?? ""}
                onChange={(id) => setQuickAddForm((prev) => ({ ...prev, categoryId: id || null }))}
                placeholder="Search category…"
                ariaLabel="Select category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickadd-unit">Unit</Label>
              <Input
                id="quickadd-unit"
                value={quickAddForm.unit}
                onChange={(e) => setQuickAddForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g. PCS, KG, L"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickadd-gst">GST rate (%)</Label>
              <Input
                id="quickadd-gst"
                type="number"
                value={quickAddForm.gstRate === 0 ? "" : quickAddForm.gstRate}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setQuickAddForm((prev) => ({
                    ...prev,
                    gstRate: e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickadd-purchase-price">
                Purchase price{" "}
                <span className="text-xs font-normal text-muted-foreground">(from this line's cost)</span>
              </Label>
              <Input
                id="quickadd-purchase-price"
                type="number"
                value={quickAddForm.purchasePrice === 0 ? "" : quickAddForm.purchasePrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setQuickAddForm((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickadd-selling-price">Selling price</Label>
              <Input
                id="quickadd-selling-price"
                type="number"
                value={quickAddForm.sellingPrice === 0 ? "" : quickAddForm.sellingPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setQuickAddForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </div>

            {quickAddError && (
              <p className="col-span-2 text-sm text-destructive">{quickAddError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeQuickAdd}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickAddSubmit}
              disabled={
                createProduct.isPending ||
                !quickAddForm.name.trim() ||
                !quickAddForm.sku.trim()
              }
            >
              {createProduct.isPending ? "Saving…" : "Add & use"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase detail dialog */}
      <Dialog
        open={!!viewingPurchase}
        onOpenChange={(open) => {
          if (!open) {
            setViewingPurchase(null);
            setExportError(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Purchase details</DialogTitle>
          </DialogHeader>

          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium truncate">{viewingPurchase.supplierName}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{viewingPurchase.purchaseDate}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium truncate">{viewingPurchase.referenceNumber || "—"}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit cost</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingPurchase.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-0 truncate">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{item.lineTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {exportError && <p className="text-sm text-destructive">{exportError}</p>}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleExport} disabled={exporting}>
                    {exporting ? "Opening…" : "Export"}
                  </Button>
                  <Button variant="outline" onClick={handlePrint} disabled={printing}>
                    {printing ? "Preparing…" : "Print"}
                  </Button>
                </div>
                <p className="font-medium">
                  Grand total: <span className="text-lg">₹{viewingPurchase.totalAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}