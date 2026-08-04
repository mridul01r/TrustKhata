import { useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff, Trash2, Tags, AlertCircle, Loader2, FolderX } from "lucide-react";
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
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeactivateCategory,
  useActivateCategory,
  useDeleteCategory,
} from "./useCategories";
import type { Category } from "./types";

export default function CategoryPage() {
  const [showInactive, setShowInactive] = useState(false);

  // Always fetch everything; active/inactive filtering happens client-side below,
  // since the backend's activeOnly flag only supports "active" or "all", not "inactive only".
  const { data: categories, isLoading, isError } = useCategories(false);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deactivateCategory = useDeactivateCategory();
  const activateCategory = useActivateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!categories) return categories;
    return categories.filter((category) =>
      showInactive ? !category.isActive : category.isActive
    );
  }, [categories, showInactive]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          request: { name, description },
        });
      } else {
        await createCategory.mutateAsync({ name, description });
      }
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this category? Products in it will keep their existing assignment.")) {
      return;
    }
    await deactivateCategory.mutateAsync(id);
  };

  const handleActivate = async (id: string) => {
    await activateCategory.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this category? This cannot be undone.")) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(id);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Couldn't delete this category. Please try again.";
      setDeleteError(message);
    }
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products into groups.</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <Checkbox
          id="show-inactive-categories"
          checked={showInactive}
          onCheckedChange={(checked) => setShowInactive(checked === true)}
        />
        <Label htmlFor="show-inactive-categories" className="cursor-pointer text-sm font-normal">
          Show inactive categories
        </Label>
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
          <p className="text-sm">Loading categories…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load categories. Check your connection and try again.</p>
        </div>
      )}

      {categories && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <Tags className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">No categories yet.</p>
          <p className="text-xs">Add one to start organizing your products.</p>
        </div>
      )}

      {categories && categories.length > 0 && filteredCategories && filteredCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <FolderX className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {showInactive ? "No inactive categories." : "No active categories."}
          </p>
          {!showInactive && <p className="text-xs">Check "Show inactive" to see deactivated ones.</p>}
        </div>
      )}

      {filteredCategories && filteredCategories.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Description</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="transition-colors hover:bg-accent/60">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    {category.isActive ? (
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
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {category.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                          title="Deactivate"
                          aria-label={`Deactivate ${category.name}`}
                          onClick={() => handleDeactivate(category.id)}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Activate"
                          aria-label={`Activate ${category.name}`}
                          onClick={() => handleActivate(category.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => handleDelete(category.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit category" : "Add category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}