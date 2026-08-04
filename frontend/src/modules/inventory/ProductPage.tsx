import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Upload,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Package,
  PackageX,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useBusinessSettings } from "@/modules/settings/useBusinessSettings";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import SearchableCombobox from "@/components/shared/SearchableCombobox";
import { useCategories } from "./useCategories";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  useActivateProduct,
  useDeleteProduct,
} from "./useProducts";
import ImportDialog from "./ImportDialog";
import type { Product, ProductRequest } from "./types";

const emptyForm: ProductRequest = {
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

// Turns a product name into a slug-style SKU, matching the same convention
// the backend's Excel-import auto-SKU generator uses (e.g. "Butter Chicken 500g" -> "BUTTER-CHICKEN-500G")
function slugifySku(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 30);
}

/** Small section label used to visually group fields inside the product dialog. */
function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-2 -mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </p>
  );
}

export default function ProductPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: businessSettings } = useBusinessSettings();
  const trackInventory = businessSettings?.trackInventory ?? true;

  // Always fetch everything; active/inactive filtering happens client-side below,
  // since the backend's activeOnly flag only supports "active" or "all", not "inactive only".
  const { data: products, isLoading, isError } = useProducts(false);
  const { data: categories } = useCategories(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deactivateProduct = useDeactivateProduct();
  const activateProduct = useActivateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Options for the searchable Category combobox below.
  const categoryOptions = useMemo(
    () => (categories ?? []).map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    if (!products) return products;

    const statusFiltered = products.filter((product) =>
      showInactive ? !product.isActive : product.isActive
    );

    const term = searchTerm.trim().toLowerCase();
    if (!term) return statusFiltered;

    return statusFiltered.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        (product.categoryName ?? "").toLowerCase().includes(term)
    );
  }, [products, searchTerm, showInactive]);

  const updateField = <K extends keyof ProductRequest>(
    key: K,
    value: ProductRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      sku: !editingProduct && !skuManuallyEdited ? slugifySku(name) : prev.sku,
    }));
  };

  const handleSkuChange = (sku: string) => {
    setSkuManuallyEdited(true);
    updateField("sku", sku);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setSkuManuallyEdited(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId,
      unit: product.unit,
      hsnCode: product.hsnCode ?? "",
      gstRate: product.gstRate,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
    });
    setSkuManuallyEdited(true);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, request: form });
      } else {
        await createProduct.mutateAsync(form);
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this product? It will stop appearing in POS billing.")) {
      return;
    }
    await deactivateProduct.mutateAsync(id);
  };

  const handleActivate = async (id: string) => {
    await activateProduct.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this product? This cannot be undone.")) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteProduct.mutateAsync(id);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Couldn't delete this product. Please try again.";
      setDeleteError(message);
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog and pricing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-1.5">
            <Upload className="h-4 w-4" />
            Import from Excel
          </Button>
          <Button onClick={openCreateDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, or category…"
            className="pl-8"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <Checkbox
            id="show-inactive-products"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked === true)}
          />
          <Label htmlFor="show-inactive-products" className="cursor-pointer text-sm font-normal">
            Show inactive
          </Label>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{deleteError}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Loading products…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load products. Check your connection and try again.</p>
        </div>
      )}

      {products && products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <Package className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">No products yet.</p>
          <p className="text-xs">Add one to start tracking stock.</p>
        </div>
      )}

      {products && products.length > 0 && filteredProducts && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <PackageX className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {searchTerm
              ? `No products match "${searchTerm}".`
              : showInactive
              ? "No inactive products."
              : "No active products."}
          </p>
          {!searchTerm && !showInactive && (
            <p className="text-xs">Check "Show inactive" to see deactivated ones.</p>
          )}
        </div>
      )}

      {filteredProducts && filteredProducts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">SKU</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                {trackInventory && (
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Stock</TableHead>
                )}
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Price</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="transition-colors hover:bg-accent/60">
                  <TableCell className="font-mono text-sm text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.categoryName || "—"}
                  </TableCell>
                  {trackInventory && (
                    <TableCell className="text-right tabular-nums">
                      {product.stockQuantity} {product.unit}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold tabular-nums">
                    ₹{product.sellingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {product.isActive ? (
                      <Badge className="border-transparent bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {product.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                          title="Deactivate"
                          aria-label={`Deactivate ${product.name}`}
                          onClick={() => handleDeactivate(product.id)}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Activate"
                          aria-label={`Activate ${product.name}`}
                          onClick={() => handleActivate(product.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <FormSection>Basic details</FormSection>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Basmati Rice 1kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-sku">
                SKU <span className="text-xs font-normal text-muted-foreground">(auto-filled, editable)</span>
              </Label>
              <Input
                id="product-sku"
                value={form.sku}
                onChange={(e) => handleSkuChange(e.target.value)}
                placeholder="Generated from name"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableCombobox
                options={categoryOptions}
                value={form.categoryId ?? ""}
                onChange={(id) => updateField("categoryId", id || null)}
                placeholder="Search category…"
                ariaLabel="Select category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-unit">Unit</Label>
              <Input
                id="product-unit"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="e.g. PCS, KG, L"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-hsn">HSN code</Label>
              <Input
                id="product-hsn"
                value={form.hsnCode}
                onChange={(e) => updateField("hsnCode", e.target.value)}
                placeholder="Optional"
              />
            </div>

            <FormSection>Pricing</FormSection>

            <div className="space-y-2">
              <Label htmlFor="product-gst">GST rate (%)</Label>
              <Input
                id="product-gst"
                type="number"
                value={form.gstRate === 0 ? "" : form.gstRate}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  updateField("gstRate", e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-purchase-price">Purchase price</Label>
              <Input
                id="product-purchase-price"
                type="number"
                value={form.purchasePrice === 0 ? "" : form.purchasePrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  updateField("purchasePrice", e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-selling-price">Selling price</Label>
              <Input
                id="product-selling-price"
                type="number"
                value={form.sellingPrice === 0 ? "" : form.sellingPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  updateField("sellingPrice", e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0"
              />
            </div>

            {trackInventory && (
              <>
                <FormSection>Inventory</FormSection>

                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock quantity</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    value={form.stockQuantity === 0 ? "" : form.stockQuantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateField("stockQuantity", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-reorder">Reorder level</Label>
                  <Input
                    id="product-reorder"
                    type="number"
                    value={form.reorderLevel === 0 ? "" : form.reorderLevel}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      updateField("reorderLevel", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Input
                id="product-description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Optional"
              />
            </div>

            {formError && (
              <p className="col-span-2 text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.name.trim() || !form.sku.trim()}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}