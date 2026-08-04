import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

const STOCK_REPORT_KEY = ["stock-report"];

export function useStockReport(deadStockDays: number) {
  return useQuery({
    queryKey: [...STOCK_REPORT_KEY, deadStockDays],
    queryFn: () => reportsApi.getStockReport(deadStockDays),
  });
}