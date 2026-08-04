export type PaymentMethod = "CASH" | "CARD" | "UPI" | "CREDIT";

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
}

export interface CheckoutPaymentRequest {
  method: PaymentMethod;
  amount: number;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
  payments: CheckoutPaymentRequest[];
  isInterstate: boolean;
  customerId?: string;
}

export interface SaleItemResponse {
  productId: string;
  productName: string;
  hsnCode: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface SalePaymentResponse {
  method: PaymentMethod;
  amount: number;
}

export interface SaleResponse {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  status: string;
  isInterstate: boolean;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
  items: SaleItemResponse[];
  payments: SalePaymentResponse[];
}

export interface HeldSaleItem {
  productId: string;
  quantity: number;
}

export interface HeldSaleRequest {
  items: HeldSaleItem[];
  customerId?: string;
  isInterstate: boolean;
  label?: string;
}

export interface HeldSaleResponse {
  id: string;
  items: HeldSaleItem[];
  customerId: string | null;
  isInterstate: boolean;
  label: string | null;
  createdAt: string;
}