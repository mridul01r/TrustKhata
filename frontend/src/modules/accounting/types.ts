export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  note: string | null;
  expenseDate: string; // ISO date
}

export interface ExpenseInput {
  categoryId: string;
  amount: number;
  note?: string;
  expenseDate: string; // ISO date
}

export interface LedgerEntry {
  id: string;
  entryDate: string;
  type: "SALE" | "EXPENSE";
  description: string;
  credit: number;
  debit: number;
  runningBalance: number;
}

export interface ProfitLossCategoryBreakdown {
  categoryName: string;
  amount: number;
}

export interface ProfitLoss {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  expenseBreakdown: ProfitLossCategoryBreakdown[];
}