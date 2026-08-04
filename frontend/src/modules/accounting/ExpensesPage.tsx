import { useMemo, useRef, useState } from "react";
import { Plus, FolderPlus, Wallet, Trash2, AlertCircle, Loader2, FileX } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableCombobox from "@/components/shared/SearchableCombobox";
import { useExpenseCategories, useCreateExpenseCategory } from "./useExpenseCategories";
import { useExpenses, useCreateExpense, useDeleteExpense } from "./useExpenses";
import type { ExpenseInput } from "./types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

const emptyForm: ExpenseInput = {
  categoryId: "",
  amount: 0,
  note: "",
  expenseDate: todayIso(),
};

export default function ExpensesPage() {
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());

  const { data: expenses, isLoading, isError } = useExpenses(from, to);
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createCategory = useCreateExpenseCategory();

  // Options for the searchable Category combobox in the Add Expense dialog.
  const categoryOptions = useMemo(
    () => (categories ?? []).map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) => {
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
      await createExpense.mutateAsync(form);
      setDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense.mutateAsync(id);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync(newCategoryName.trim());
    setNewCategoryName("");
    setNewCategoryDialogOpen(false);
  };

  const isSaving = createExpense.isPending;
  const totalForRange = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track business spending by category.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewCategoryDialogOpen(true)} className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            New category
          </Button>
          <Button onClick={openCreateDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="from-date">From</Label>
          <Input id="from-date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-date">To</Label>
          <Input id="to-date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <Wallet className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-lg font-bold leading-tight text-foreground">
                {formatCurrency(totalForRange)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Loading expenses…</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Couldn't load expenses. Check your connection and try again.</p>
        </div>
      )}

      {expenses && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <FileX className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium text-foreground">No expenses recorded in this range.</p>
          <p className="text-xs">Try a different date range.</p>
        </div>
      )}

      {expenses && expenses.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Note</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Amount</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} className="transition-colors hover:bg-accent/60">
                  <TableCell className="text-muted-foreground">{expense.expenseDate}</TableCell>
                  <TableCell className="font-medium">{expense.categoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.note || "—"}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                      aria-label={`Delete expense on ${expense.expenseDate}`}
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-md"
          // The dialog would otherwise auto-focus the Category combobox
          // (the first field), and this combobox opens its list on focus -
          // so the dropdown would pop open immediately every time.
          // Redirect initial focus to Amount instead. (This Dialog wraps
          // Base UI, not Radix - initialFocus is Base UI's equivalent of
          // Radix's onOpenAutoFocus, and takes a ref directly.)
          initialFocus={amountInputRef}
        >
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableCombobox
                options={categoryOptions}
                value={form.categoryId}
                onChange={(id) => updateField("categoryId", id)}
                placeholder="Search category…"
                ariaLabel="Select category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                ref={amountInputRef}
                id="expense-amount"
                type="number"
                value={form.amount === 0 ? "" : form.amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateField("amount", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.expenseDate}
                onChange={(e) => updateField("expenseDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-note">Note</Label>
              <Input
                id="expense-note"
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                placeholder="Optional"
              />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.categoryId || form.amount <= 0}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New expense category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-category-name">Name</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Marketing"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}