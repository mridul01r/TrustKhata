import { apiClient } from "@/lib/apiClient";
import type { Category, CategoryRequest, Product, ProductRequest } from "./types";
import type { ImportSummaryResponse, ClearInventoryResponse } from "./types";

export const importApi = {
  preview: async (file: File): Promise<ImportSummaryResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<ImportSummaryResponse>(
      "/inventory/import/preview",
      formData
    );
    return data;
  },

  commit: async (file: File): Promise<ImportSummaryResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<ImportSummaryResponse>(
      "/inventory/import/commit",
      formData
    );
    return data;
  },
};

export const inventoryResetApi = {
  clearAll: async (): Promise<ClearInventoryResponse> => {
    const { data } = await apiClient.post<ClearInventoryResponse>("/inventory/clear-all");
    return data;
  },
};

const CATEGORIES_BASE = "/inventory/categories";
const PRODUCTS_BASE = "/inventory/products";

export const categoryApi = {
  getAll: async (activeOnly = false): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>(CATEGORIES_BASE, {
      params: { activeOnly },
    });
    return data;
  },

  getById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<Category>(`${CATEGORIES_BASE}/${id}`);
    return data;
  },

  create: async (request: CategoryRequest): Promise<Category> => {
    const { data } = await apiClient.post<Category>(CATEGORIES_BASE, request);
    return data;
  },

  update: async (id: string, request: CategoryRequest): Promise<Category> => {
    const { data } = await apiClient.put<Category>(`${CATEGORIES_BASE}/${id}`, request);
    return data;
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`${CATEGORIES_BASE}/${id}`);
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.post(`${CATEGORIES_BASE}/${id}/activate`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${CATEGORIES_BASE}/${id}/permanent`);
  },
};

export const productApi = {
  getAll: async (activeOnly = false, categoryId?: string): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>(PRODUCTS_BASE, {
      params: { activeOnly, categoryId },
    });
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`${PRODUCTS_BASE}/${id}`);
    return data;
  },

  create: async (request: ProductRequest): Promise<Product> => {
    const { data } = await apiClient.post<Product>(PRODUCTS_BASE, request);
    return data;
  },

  update: async (id: string, request: ProductRequest): Promise<Product> => {
    const { data } = await apiClient.put<Product>(`${PRODUCTS_BASE}/${id}`, request);
    return data;
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`${PRODUCTS_BASE}/${id}`);
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.post(`${PRODUCTS_BASE}/${id}/activate`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${PRODUCTS_BASE}/${id}/permanent`);
  },
};