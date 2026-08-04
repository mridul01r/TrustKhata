import { useQuery } from "@tanstack/react-query";
import { accountingApi } from "./api";

const DAY_BOOK_KEY = ["day-book"];

export function useDayBook(from: string, to: string) {
  return useQuery({
    queryKey: [...DAY_BOOK_KEY, from, to],
    queryFn: () => accountingApi.getDayBook(from, to),
    enabled: Boolean(from && to),
  });
}