// Add these to the existing Purchases types.ts (alongside Purchase/PurchaseInput/etc.)

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