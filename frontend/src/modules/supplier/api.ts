import { apiClient } from "@/lib/apiClient";
import type {
  Purchase,
  PurchaseInput,
  PurchaseImportSummaryResponse,
  Supplier,
  SupplierInput,
} from "./types";

export const supplierApi = {
  listSuppliers: async (): Promise<Supplier[]> => {
    const res = await apiClient.get("/suppliers");
    return res.data;
  },

  createSupplier: async (input: SupplierInput): Promise<Supplier> => {
    const res = await apiClient.post("/suppliers", input);
    return res.data;
  },
};

export const purchaseApi = {
  listPurchases: async (from: string, to: string): Promise<Purchase[]> => {
    const res = await apiClient.get("/purchases", { params: { from, to } });
    return res.data;
  },

  getPurchase: async (id: string): Promise<Purchase> => {
    const res = await apiClient.get("/purchases/" + id);
    return res.data;
  },

  createPurchase: async (input: PurchaseInput): Promise<Purchase> => {
    const res = await apiClient.post("/purchases", input);
    return res.data;
  },

  importPreview: async (file: File): Promise<PurchaseImportSummaryResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/purchases/import/preview", formData);
    return res.data;
  },

  importCommit: async (file: File): Promise<PurchaseImportSummaryResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/purchases/import/commit", formData);
    return res.data;
  },

  // Returns the raw PDF as a Blob rather than forcing a file-system download -
  // callers decide whether to open it inline (Export) or send it straight to
  // the print dialog (Print).
  fetchPurchasePdf: async (id: string): Promise<Blob> => {
    const res = await apiClient.get(`/purchases/${id}/pdf`, { responseType: "blob" });
    return new Blob([res.data], { type: "application/pdf" });
  },
};