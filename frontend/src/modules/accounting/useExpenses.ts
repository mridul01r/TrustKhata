import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountingApi } from "./api";
import type { ExpenseInput } from "./types";

export function useExpenses(from: string, to: string) {
  return useQuery({
    queryKey: ["expenses", from, to],
    queryFn: () => accountingApi.listExpenses(from, to),
    enabled: Boolean(from && to),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => accountingApi.createExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["day-book"] });
      queryClient.invalidateQueries({ queryKey: ["profit-loss"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["day-book"] });
      queryClient.invalidateQueries({ queryKey: ["profit-loss"] });
    },
  });
}