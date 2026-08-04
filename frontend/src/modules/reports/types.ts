export interface BestSellingProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySales {
  categoryId: string | null;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface DailySales {
  date: string; // ISO date, YYYY-MM-DD
  revenue: number;
  saleCount: number;
}

export interface HourlySales {
  hour: number; // 0-23
  revenue: number;
  saleCount: number;
}

export interface SalesAnalytics {
  bestSellers: BestSellingProduct[];
  byCategory: CategorySales[];
  byDay: DailySales[];
  byHour: HourlySales[];
}

export interface HsnSummary {
  hsnCode: string | null;
  unit: string;
  gstRate: number;
  totalQuantity: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
}

export interface TaxRateSummary {
  gstRate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
}

export interface GstReport {
  totalTaxableValue: number;
  totalIgst: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  totalInvoiceValue: number;
  byTaxRate: TaxRateSummary[];
  byHsn: HsnSummary[];
}

export interface ProductMargin {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  excludedLineItems: number;
}

export interface CategoryMargin {
  categoryId: string | null;
  categoryName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  excludedLineItems: number;
}

export interface MarginReport {
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  overallMarginPercent: number;
  totalExcludedLineItems: number;
  byProduct: ProductMargin[];
  byCategory: CategoryMargin[];
}

export interface ProductValuation {
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  stockQuantity: number;
  purchasePrice: number;
  stockValue: number;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
}

export interface DeadStockItem {
  productId: string;
  productName: string;
  unit: string;
  stockQuantity: number;
  lastSoldAt: string | null; // ISO datetime, null if never sold
}

export interface StockReport {
  totalStockValue: number;
  valuation: ProductValuation[];
  lowStock: LowStockItem[];
  deadStock: DeadStockItem[];
}

export interface SummaryReport {
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalTax: number;
  totalTransactions: number;
  totalProfit: number;
  marginPercent: number;
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  byDay: {
    date: string;
    revenue: number;
    saleCount: number;
  }[];
  totalStockValue: number;
  lowStockCount: number;
  deadStockCount: number;
  // Previous period (same length, immediately preceding periodStart) — for KPI trend arrows.
  previousTotalSales: number;
  previousTotalTransactions: number;
  previousTotalProfit: number;
  previousMarginPercent: number;
}

