export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  gstin: string | null;
}

export interface SupplierInput {
  name: string;
  contact?: string;
  gstin?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  referenceNumber: string | null;
  purchaseDate: string;
  totalAmount: number;
  items: PurchaseItem[];
}

export interface PurchaseInput {
  supplierId: string;
  referenceNumber?: string;
  purchaseDate: string;
  items: PurchaseItemInput[];
}

export type PurchaseImportAction = "MATCH_EXISTING" | "CREATE_NEW" | "ERROR";

export interface PurchaseImportRowResult {
  rowNumber: number;
  productName: string;
  categoryName: string | null;
  quantity: number | null;
  unitCost: number | null;
  productId: string | null;
  action: PurchaseImportAction;
  errorMessage: string | null;
}

export interface PurchaseImportSummaryResponse {
  rows: PurchaseImportRowResult[];
}