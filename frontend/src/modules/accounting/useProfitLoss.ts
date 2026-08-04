import { useQuery } from "@tanstack/react-query";
import { accountingApi } from "./api";

const PROFIT_LOSS_KEY = ["profit-loss"];

export function useProfitLoss(from: string, to: string) {
  return useQuery({
    queryKey: [...PROFIT_LOSS_KEY, from, to],
    queryFn: () => accountingApi.getProfitLoss(from, to),
    enabled: Boolean(from && to),
  });
}