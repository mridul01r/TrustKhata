import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

const SALES_ANALYTICS_KEY = ["sales-analytics"];

export function useSalesAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: [...SALES_ANALYTICS_KEY, from, to],
    queryFn: () => reportsApi.getSalesAnalytics(from, to),
    enabled: Boolean(from && to),
  });
}