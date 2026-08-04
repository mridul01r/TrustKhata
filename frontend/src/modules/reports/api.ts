import { apiClient } from "@/lib/apiClient";
import type { GstReport, MarginReport, SalesAnalytics, StockReport, SummaryReport } from "./types";

export const reportsApi = {
  getSalesAnalytics: async (from: string, to: string): Promise<SalesAnalytics> => {
    const res = await apiClient.get("/reports/sales-analytics", { params: { from, to } });
    return res.data;
  },

  getGstReport: async (from: string, to: string): Promise<GstReport> => {
    const res = await apiClient.get("/reports/gst", { params: { from, to } });
    return res.data;
  },

  getMarginReport: async (from: string, to: string): Promise<MarginReport> => {
    const res = await apiClient.get("/reports/margin", { params: { from, to } });
    return res.data;
  },

  getStockReport: async (deadStockDays: number): Promise<StockReport> => {
    const res = await apiClient.get("/reports/stock", { params: { deadStockDays } });
    return res.data;
  },

  getSummaryReport: async (from: string, to: string): Promise<SummaryReport> => {
    const res = await apiClient.get("/reports/summary", { params: { from, to } });
    return res.data;
  },

  downloadSummaryPdf: async (from: string, to: string): Promise<Blob> => {
    const res = await apiClient.get("/reports/summary/pdf", {
      params: { from, to },
      responseType: "blob",
    });
    return res.data;
  },

  downloadSummaryExcel: async (from: string, to: string): Promise<Blob> => {
    const res = await apiClient.get("/reports/summary/excel", {
      params: { from, to },
      responseType: "blob",
    });
    return res.data;
  },
};