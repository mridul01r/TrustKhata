import { useEffect, useState } from "react";
import { AlertTriangle, Building2, Package, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessSettings, useSaveBusinessSettings } from "./useBusinessSettings";
import { useClearAllInventory } from "@/modules/inventory/useInventoryReset";
import type { BusinessSettingsRequest } from "./types";

const emptyForm: BusinessSettingsRequest = {
  businessName: "",
  gstin: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  trackInventory: true,
};

export default function SettingsPage() {
  const { data: settings, isLoading } = useBusinessSettings();
  const saveSettings = useSaveBusinessSettings();
  const clearAllInventory = useClearAllInventory();

  const [form, setForm] = useState<BusinessSettingsRequest>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearResultMessage, setClearResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        businessName: settings.businessName ?? "",
        gstin: settings.gstin ?? "",
        addressLine1: settings.addressLine1 ?? "",
        addressLine2: settings.addressLine2 ?? "",
        city: settings.city ?? "",
        state: settings.state ?? "",
        pincode: settings.pincode ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        trackInventory: settings.trackInventory ?? true,
      });
    }
  }, [settings]);

  const updateField = <K extends keyof BusinessSettingsRequest>(
    key: K,
    value: BusinessSettingsRequest[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(false);
  };

  const handleSave = async () => {
    setFormError(null);
    setSavedMessage(false);
    try {
      await saveSettings.mutateAsync(form);
      setSavedMessage(true);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        const firstMessage = Object.values(fieldErrors)[0];
        setFormError(typeof firstMessage === "string" ? firstMessage : "Please check the highlighted fields.");
      } else {
        setFormError(err?.response?.data?.message ?? "Couldn't save settings. Please try again.");
      }
    }
  };

  const handleClearAll = async () => {
    setClearError(null);
    setClearResultMessage(null);
    try {
      const result = await clearAllInventory.mutateAsync();
      const parts: string[] = [];
      if (result.productsDeleted > 0) parts.push(`${result.productsDeleted} product${result.productsDeleted === 1 ? "" : "s"} deleted`);
      if (result.productsDeactivated > 0) parts.push(`${result.productsDeactivated} product${result.productsDeactivated === 1 ? "" : "s"} deactivated (has sales history)`);
      if (result.categoriesDeleted > 0) parts.push(`${result.categoriesDeleted} categor${result.categoriesDeleted === 1 ? "y" : "ies"} deleted`);
      if (result.categoriesDeactivated > 0) parts.push(`${result.categoriesDeactivated} categor${result.categoriesDeactivated === 1 ? "y" : "ies"} deactivated`);
      setClearResultMessage(parts.length > 0 ? parts.join(", ") + "." : "Nothing to clear — catalog was already empty.");
      setClearConfirmText("");
    } catch (err: any) {
      setClearError(err?.response?.data?.message ?? "Couldn't clear the catalog. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-semibold">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage your business details, inventory behavior, and account-level actions.
      </p>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 data-[state=active]:text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Danger zone
          </TabsTrigger>
        </TabsList>

        {/* Business tab */}
        <TabsContent value="business" className="mt-6">
          <div className="space-y-4 rounded-xl border border-border p-6">
            <div>
              <h2 className="text-lg font-semibold">Business details</h2>
              <p className="text-sm text-muted-foreground">
                These details appear on every printed Tax Invoice.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={form.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="e.g. Sharma General Store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-gstin">
                GSTIN <span className="text-xs font-normal text-muted-foreground">(leave blank if not registered)</span>
              </Label>
              <Input
                id="business-gstin"
                value={form.gstin ?? ""}
                onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                placeholder="e.g. 22AAAAA0000A1Z5"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit/letter, "Z", 1 digit/letter (15 characters total)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address-line1">Address line 1</Label>
                <Input
                  id="address-line1"
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  placeholder="Shop no., street"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address-line2">Address line 2</Label>
                <Input
                  id="address-line2"
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="e.g. Madhya Pradesh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {savedMessage && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Settings saved.
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={saveSettings.isPending || !form.businessName.trim()}
            >
              {saveSettings.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </TabsContent>

        {/* Inventory tab */}
        <TabsContent value="inventory" className="mt-6">
          <div className="space-y-4 rounded-xl border border-border p-6">
            <div>
              <h2 className="text-lg font-semibold">Inventory tracking</h2>
              <p className="text-sm text-muted-foreground">
                Turn this on for shops that stock and sell countable items (retail, groceries).
                Turn it off for businesses like cafes or restaurants where "stock quantity"
                doesn't apply — items are made to order rather than counted.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Checkbox
                id="track-inventory"
                checked={form.trackInventory}
                onCheckedChange={(checked) => updateField("trackInventory", checked === true)}
              />
              <div>
                <Label htmlFor="track-inventory" className="cursor-pointer">
                  Track product quantity and stock levels
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  When off: Stock quantity and Reorder level are hidden from the product form,
                  POS billing won't check or reduce stock, and the Dashboard's low-stock widget
                  plus the Stock Report page are hidden.
                </p>
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {savedMessage && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Settings saved.
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={saveSettings.isPending || !form.businessName.trim()}
            >
              {saveSettings.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </TabsContent>

        {/* Danger zone tab */}
        <TabsContent value="danger" className="mt-6">
          <div className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
                <p className="text-sm text-muted-foreground">
                  Permanently clears your product and category catalog — useful before a
                  fresh bulk import. Products that have already been sold are deactivated
                  instead of deleted, to keep past invoices intact; everything else is
                  permanently removed. <strong>This cannot be undone.</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-destructive/30 p-4">
              <Label htmlFor="clear-confirm" className="text-sm">
                Type <span className="font-mono font-semibold">CLEAR</span> to confirm
              </Label>
              <Input
                id="clear-confirm"
                value={clearConfirmText}
                onChange={(e) => {
                  setClearConfirmText(e.target.value);
                  setClearError(null);
                  setClearResultMessage(null);
                }}
                placeholder="CLEAR"
                className="max-w-xs font-mono"
              />

              {clearError && <p className="text-sm text-destructive">{clearError}</p>}
              {clearResultMessage && (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {clearResultMessage}
                </p>
              )}

              <Button
                variant="destructive"
                disabled={clearConfirmText !== "CLEAR" || clearAllInventory.isPending}
                onClick={handleClearAll}
              >
                {clearAllInventory.isPending ? "Clearing…" : "Clear all products and categories"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}