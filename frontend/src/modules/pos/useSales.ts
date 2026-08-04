import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "./api";
import type { CheckoutRequest } from "./types";

export function useSales(from?: string, to?: string) {
  return useQuery({
    queryKey: ["sales", from, to],
    queryFn: () => salesApi.getAll(from, to),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CheckoutRequest) => salesApi.checkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}