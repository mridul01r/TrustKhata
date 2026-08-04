import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";
import type { BusinessSettingsRequest } from "./types";

const SETTINGS_KEY = ["business-settings"];

export function useBusinessSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: settingsApi.get,
  });
}

export function useSaveBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BusinessSettingsRequest) => settingsApi.save(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}