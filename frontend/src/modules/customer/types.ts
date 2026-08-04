export type PaymentMethod = "CASH" | "CARD" | "UPI" | "CREDIT";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  outstandingBalance: number;
  createdAt: string;
}

export interface CustomerRequest {
  name: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

export interface SaleSummary {
  saleId: string;
  invoiceNumber: string;
  totalAmount: number;
  creditPortion: number;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  createdAt: string;
}

export interface CustomerPaymentRequest {
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface CustomerHistoryResponse {
  customer: Customer;
  purchases: SaleSummary[];
  payments: CustomerPayment[];
}