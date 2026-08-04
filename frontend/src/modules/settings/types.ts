export interface BusinessSettings {
  businessName: string;
  gstin: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  trackInventory: boolean;
}

export type BusinessSettingsRequest = BusinessSettings;