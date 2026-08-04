import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBusinessSettings } from "@/modules/settings/useBusinessSettings";
import type { SaleResponse } from "./types";

interface ReceiptDialogProps {
  sale: SaleResponse | null;
  onClose: () => void;
  autoPrint?: boolean;
}

// Joins whatever address parts BusinessSettings has into one display line -
// same non-destructive join approach used for the Purchase PDF's letterhead.
function formatAddress(settings: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
} | undefined): string {
  if (!settings) return "";
  return [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.pincode]
    .filter((part) => part && part.trim())
    .join(", ");
}

export default function ReceiptDialog({ sale, onClose, autoPrint = true }: ReceiptDialogProps) {
  const printedForSaleId = useRef<string | null>(null);
  const { data: businessSettings } = useBusinessSettings();

  useEffect(() => {
    if (sale && autoPrint && printedForSaleId.current !== sale.id) {
      printedForSaleId.current = sale.id;
      const timer = setTimeout(() => window.print(), 200);
      return () => clearTimeout(timer);
    }
  }, [sale, autoPrint]);

  if (!sale) return null;

  const addressLine = formatAddress(businessSettings);

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{autoPrint ? "Sale complete" : "Receipt"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 font-mono text-sm">
          <div className="text-center space-y-0.5 border-b border-dashed border-border pb-3">
            <p className="font-semibold text-base">
              {businessSettings?.businessName || "Business name not set"}
            </p>
            {addressLine && <p className="text-xs text-muted-foreground">{addressLine}</p>}
            {businessSettings?.gstin && (
              <p className="text-xs text-muted-foreground">GSTIN: {businessSettings.gstin}</p>
            )}
          </div>

          <div className="text-center">
            <p className="font-semibold">{sale.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 border-y border-dashed border-border py-3">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.productName} x{item.quantity}
                </span>
                <span>₹{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>₹{sale.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>₹{sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1 border-t border-dashed border-border pt-3">
            {sale.payments.map((payment, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{payment.method}</span>
                <span>₹{payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.open(`/invoice/${sale.id}`, "_blank")}
          >
            View Tax Invoice
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            {autoPrint ? "Print again" : "Print"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}