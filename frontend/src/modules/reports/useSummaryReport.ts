import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

const SUMMARY_REPORT_KEY = ["summary-report"];

export function useSummaryReport(from: string, to: string) {
  return useQuery({
    queryKey: [...SUMMARY_REPORT_KEY, from, to],
    queryFn: () => reportsApi.getSummaryReport(from, to),
    enabled: Boolean(from && to),
  });
}