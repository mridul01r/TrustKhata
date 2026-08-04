import { apiClient } from "@/lib/apiClient";
import type { BusinessSettings, BusinessSettingsRequest } from "./types";

const SETTINGS_BASE = "/settings/business";

export const settingsApi = {
  get: async (): Promise<BusinessSettings> => {
    const { data } = await apiClient.get<BusinessSettings>(SETTINGS_BASE);
    return data;
  },

  save: async (request: BusinessSettingsRequest): Promise<BusinessSettings> => {
    const { data } = await apiClient.put<BusinessSettings>(SETTINGS_BASE, request);
    return data;
  },
};