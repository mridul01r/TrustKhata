import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountingApi } from "./api";

const EXPENSE_CATEGORIES_KEY = ["expense-categories"];

export function useExpenseCategories() {
  return useQuery({
    queryKey: EXPENSE_CATEGORIES_KEY,
    queryFn: accountingApi.listCategories,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => accountingApi.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY });
    },
  });
}