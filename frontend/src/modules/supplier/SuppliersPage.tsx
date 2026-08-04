import { useState } from "react";
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
import { useSuppliers, useCreateSupplier } from "./useSuppliers";
import type { SupplierInput } from "./types";

const emptyForm: SupplierInput = { name: "", contact: "", gstin: "" };

export default function SuppliersPage() {
  const { data: suppliers, isLoading, isError } = useSuppliers();
  const createSupplier = useCreateSupplier();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SupplierInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateDialog = () => {
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      await createSupplier.mutateAsync(form);
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <Button onClick={openCreateDialog}>Add supplier</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading suppliers…</p>}
      {isError && (
        <p className="text-destructive">
          Couldn't load suppliers. Check your connection and try again.
        </p>
      )}

      {suppliers && suppliers.length === 0 && (
        <p className="text-muted-foreground">No suppliers yet. Add one to record purchases.</p>
      )}

      {suppliers && suppliers.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GSTIN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.contact || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.gstin || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add supplier</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Name</Label>
              <Input
                id="supplier-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Sharma Wholesale Traders"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-contact">Contact</Label>
              <Input
                id="supplier-contact"
                value={form.contact}
                onChange={(e) => updateField("contact", e.target.value)}
                placeholder="Phone or email, optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-gstin">GSTIN</Label>
              <Input
                id="supplier-gstin"
                value={form.gstin}
                onChange={(e) => updateField("gstin", e.target.value)}
                placeholder="Optional"
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSupplier.isPending || !form.name.trim()}
            >
              {createSupplier.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}