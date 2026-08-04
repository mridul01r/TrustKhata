import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

const MARGIN_REPORT_KEY = ["margin-report"];

export function useMarginReport(from: string, to: string) {
  return useQuery({
    queryKey: [...MARGIN_REPORT_KEY, from, to],
    queryFn: () => reportsApi.getMarginReport(from, to),
    enabled: Boolean(from && to),
  });
}