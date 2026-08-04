import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseApi } from "./api";
import type { PurchaseInput } from "./types";

const PURCHASES_KEY = ["purchases"];

export function usePurchases(from: string, to: string) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, from, to],
    queryFn: () => purchaseApi.listPurchases(from, to),
    enabled: Boolean(from && to),
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, id],
    queryFn: () => purchaseApi.getPurchase(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseInput) => purchaseApi.createPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // stock/purchase price changed
    },
  });
}

// Preview doesn't touch the database, so nothing to invalidate.
export function usePurchaseImportPreview() {
  return useMutation({
    mutationFn: (file: File) => purchaseApi.importPreview(file),
  });
}

export function usePurchaseImportCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => purchaseApi.importCommit(file),
    onSuccess: () => {
      // May have created new products, so the Products list/dropdowns need a refresh.
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}