import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryResetApi } from "./api";

export function useClearAllInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => inventoryResetApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}