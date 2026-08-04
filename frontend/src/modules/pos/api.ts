import { apiClient } from "@/lib/apiClient";
import type {
  CheckoutRequest,
  SaleResponse,
  HeldSaleRequest,
  HeldSaleResponse,
} from "./types";

const SALES_BASE = "/pos/sales";
const HELD_BASE = "/pos/held";

export const salesApi = {
  checkout: async (request: CheckoutRequest): Promise<SaleResponse> => {
    const { data } = await apiClient.post<SaleResponse>(`${SALES_BASE}/checkout`, request);
    return data;
  },

  // from/to are "YYYY-MM-DD" date strings. Omit both to get the full history.
  getAll: async (from?: string, to?: string): Promise<SaleResponse[]> => {
    const { data } = await apiClient.get<SaleResponse[]>(SALES_BASE, {
      params: from && to ? { from, to } : undefined,
    });
    return data;
  },

  getById: async (id: string): Promise<SaleResponse> => {
    const { data } = await apiClient.get<SaleResponse>(`${SALES_BASE}/${id}`);
    return data;
  },
};

export const heldSaleApi = {
  hold: async (request: HeldSaleRequest): Promise<HeldSaleResponse> => {
    const { data } = await apiClient.post<HeldSaleResponse>(HELD_BASE, request);
    return data;
  },

  list: async (): Promise<HeldSaleResponse[]> => {
    const { data } = await apiClient.get<HeldSaleResponse[]>(HELD_BASE);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${HELD_BASE}/${id}`);
  },
};