import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomerHistory, recordCustomerPayment } from "./api";
import type { CustomerPaymentRequest } from "./types";

const CUSTOMER_HISTORY_KEY = ["customer-history"];

export function useCustomerHistory(customerId: string | null) {
  return useQuery({
    queryKey: [...CUSTOMER_HISTORY_KEY, customerId],
    queryFn: () => getCustomerHistory(customerId as string),
    enabled: !!customerId,
  });
}

export function useRecordCustomerPayment(customerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerPaymentRequest) =>
      recordCustomerPayment(customerId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...CUSTOMER_HISTORY_KEY, customerId],
      });
      // outstandingBalance on the list also changes after a payment
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}