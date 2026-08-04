import { apiClient } from "@/lib/apiClient";
import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  LedgerEntry,
  ProfitLoss,
} from "./types";

export const accountingApi = {
  listCategories: async (): Promise<ExpenseCategory[]> => {
    const res = await apiClient.get("/accounting/expense-categories");
    return res.data;
  },

  createCategory: async (name: string): Promise<ExpenseCategory> => {
    const res = await apiClient.post("/accounting/expense-categories", { name });
    return res.data;
  },

  listExpenses: async (from: string, to: string): Promise<Expense[]> => {
    const res = await apiClient.get("/accounting/expenses", { params: { from, to } });
    return res.data;
  },

  createExpense: async (input: ExpenseInput): Promise<Expense> => {
    const res = await apiClient.post("/accounting/expenses", input);
    return res.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await apiClient.delete("/accounting/expenses/" + id);
  },

  getDayBook: async (from: string, to: string): Promise<LedgerEntry[]> => {
    const res = await apiClient.get("/accounting/reports/day-book", { params: { from, to } });
    return res.data;
  },

  getProfitLoss: async (from: string, to: string): Promise<ProfitLoss> => {
    const res = await apiClient.get("/accounting/reports/profit-loss", { params: { from, to } });
    return res.data;
  },
};