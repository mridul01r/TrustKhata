export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unit: string;
  hsnCode: string | null;
  gstRate: number;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  unit: string;
  hsnCode?: string;
  gstRate: number;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel?: number;
}

export interface ImportRowResult {
  rowNumber: number;
  categoryName: string;
  categoryIsNew: boolean;
  productName: string;
  price: number;
  quantity: number | null;
  gstRate: number | null;
  purchasePrice: number | null;
  productAction: "CREATE" | "UPDATE" | "ERROR";
  errorMessage: string | null;
}

export interface ImportSummaryResponse {
  rows: ImportRowResult[];
  totalRows: number;
  newCategories: number;
  newProducts: number;
  updatedProducts: number;
  errorCount: number;
}

export interface ClearInventoryResponse {
  productsDeleted: number;
  productsDeactivated: number;
  categoriesDeleted: number;
  categoriesDeactivated: number;
}