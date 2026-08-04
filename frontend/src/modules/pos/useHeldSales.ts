import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { heldSaleApi } from "./api";
import type { HeldSaleRequest } from "./types";

const HELD_SALES_KEY = ["held-sales"];

export function useHeldSales() {
  return useQuery({
    queryKey: HELD_SALES_KEY,
    queryFn: heldSaleApi.list,
  });
}

export function useHoldSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: HeldSaleRequest) => heldSaleApi.hold(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HELD_SALES_KEY });
    },
  });
}

export function useDeleteHeldSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => heldSaleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HELD_SALES_KEY });
    },
  });
}