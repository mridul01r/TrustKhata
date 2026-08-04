import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

const GST_REPORT_KEY = ["gst-report"];

export function useGstReport(from: string, to: string) {
  return useQuery({
    queryKey: [...GST_REPORT_KEY, from, to],
    queryFn: () => reportsApi.getGstReport(from, to),
    enabled: Boolean(from && to),
  });
}