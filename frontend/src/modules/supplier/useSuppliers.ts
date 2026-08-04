import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "./api";
import type { SupplierInput } from "./types";

const SUPPLIERS_KEY = ["suppliers"];

export function useSuppliers() {
  return useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: supplierApi.listSuppliers,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) => supplierApi.createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
}