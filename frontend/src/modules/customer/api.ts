import { apiClient } from "@/lib/apiClient";
import type {
  Customer,
  CustomerRequest,
  CustomerHistoryResponse,
  CustomerPayment,
  CustomerPaymentRequest,
} from "./types";

export async function listCustomers(): Promise<Customer[]> {
  const res = await apiClient.get<Customer[]>("/customers");
  return res.data;
}

export async function createCustomer(data: CustomerRequest): Promise<Customer> {
  const res = await apiClient.post<Customer>("/customers", data);
  return res.data;
}

export async function updateCustomer(
  id: string,
  data: CustomerRequest
): Promise<Customer> {
  const res = await apiClient.put<Customer>(`/customers/${id}`, data);
  return res.data;
}

export async function getCustomerHistory(
  id: string
): Promise<CustomerHistoryResponse> {
  const res = await apiClient.get<CustomerHistoryResponse>(
    `/customers/${id}/history`
  );
  return res.data;
}

export async function recordCustomerPayment(
  id: string,
  data: CustomerPaymentRequest
): Promise<CustomerPayment> {
  const res = await apiClient.post<CustomerPayment>(
    `/customers/${id}/payments`,
    data
  );
  return res.data;
}