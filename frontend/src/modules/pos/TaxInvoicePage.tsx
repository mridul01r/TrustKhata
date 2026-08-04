import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { salesApi } from "@/modules/pos/api";
import { settingsApi } from "@/modules/settings/api";
import type { SaleResponse } from "@/modules/pos/types";
import type { BusinessSettings } from "@/modules/settings/types";

interface HsnSummaryRow {
  hsnCode: string;
  taxableValue: number;
  gstRate: number;
  totalTax: number;
}

export default function TaxInvoicePage() {
  const { saleId } = useParams<{ saleId: string }>();
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) return;
    Promise.all([salesApi.getById(saleId), settingsApi.get()])
      .then(([saleData, settingsData]) => {
        setSale(saleData);
        setSettings(settingsData);
      })
      .catch(() => setError("Couldn't load this invoice."));
  }, [saleId]);

  const hsnSummary = useMemo<HsnSummaryRow[]>(() => {
    if (!sale) return [];
    const map = new Map<string, HsnSummaryRow>();

    for (const item of sale.items) {
      const hsn = item.hsnCode || "—";
      const key = `${hsn}|${item.gstRate}`;

      const existing = map.get(key);
      if (existing) {
        existing.taxableValue += item.lineSubtotal;
        existing.totalTax += item.lineTax;
      } else {
        map.set(key, {
          hsnCode: hsn,
          taxableValue: item.lineSubtotal,
          gstRate: item.gstRate,
          totalTax: item.lineTax,
        });
      }
    }

    return Array.from(map.values());
  }, [sale]);

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  if (!sale || !settings) {
    return <div className="p-8 text-center text-muted-foreground">Loading invoice…</div>;
  }

  const addressParts = [
    settings.addressLine1,
    settings.addressLine2,
    [settings.city, settings.state, settings.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="mx-auto min-h-screen max-w-[210mm] bg-white p-8 text-black print:p-0">
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="border border-black">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black p-4">
          <div>
            <h1 className="text-xl font-bold">{settings.businessName || "Your Business Name"}</h1>
            {addressParts.map((line, i) => (
              <p key={i} className="text-sm">
                {line}
              </p>
            ))}
            {settings.gstin && <p className="text-sm">GSTIN: {settings.gstin}</p>}
            {settings.phone && <p className="text-sm">Phone: {settings.phone}</p>}
            {settings.email && <p className="text-sm">Email: {settings.email}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold tracking-wide">TAX INVOICE</h2>
            <p className="mt-2 text-sm">
              <span className="font-medium">Invoice #:</span> {sale.invoiceNumber}
            </p>
            <p className="text-sm">
              <span className="font-medium">Date:</span>{" "}
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="border-b border-black p-4">
          <p className="text-sm font-medium">Bill to</p>
          <p className="text-sm text-neutral-600">Walk-in Customer</p>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black bg-neutral-100">
              <th className="border-r border-black p-2 text-left">#</th>
              <th className="border-r border-black p-2 text-left">Description</th>
              <th className="border-r border-black p-2 text-left">HSN</th>
              <th className="border-r border-black p-2 text-right">Qty</th>
              <th className="border-r border-black p-2 text-right">Rate</th>
              <th className="border-r border-black p-2 text-right">Taxable Value</th>
              {sale.isInterstate ? (
                <th className="border-r border-black p-2 text-right">IGST</th>
              ) : (
                <>
                  <th className="border-r border-black p-2 text-right">CGST</th>
                  <th className="border-r border-black p-2 text-right">SGST</th>
                </>
              )}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => {
              const cgstRate = item.gstRate / 2;
              const sgstRate = item.gstRate / 2;
              const cgstAmount = item.lineTax / 2;
              const sgstAmount = item.lineTax / 2;
              return (
                <tr key={i} className="border-b border-neutral-300">
                  <td className="border-r border-neutral-300 p-2">{i + 1}</td>
                  <td className="border-r border-neutral-300 p-2">{item.productName}</td>
                  <td className="border-r border-neutral-300 p-2">{item.hsnCode || "—"}</td>
                  <td className="border-r border-neutral-300 p-2 text-right">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border-r border-neutral-300 p-2 text-right">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="border-r border-neutral-300 p-2 text-right">
                    ₹{item.lineSubtotal.toFixed(2)}
                  </td>
                  {sale.isInterstate ? (
                    <td className="border-r border-neutral-300 p-2 text-right">
                      {item.gstRate.toFixed(1)}%<br />₹{item.lineTax.toFixed(2)}
                    </td>
                  ) : (
                    <>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        {cgstRate.toFixed(1)}%<br />₹{cgstAmount.toFixed(2)}
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        {sgstRate.toFixed(1)}%<br />₹{sgstAmount.toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="p-2 text-right font-medium">₹{item.lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end border-b border-black p-4">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Taxable amount</span>
              <span>₹{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.isInterstate ? (
              <div className="flex justify-between">
                <span>IGST</span>
                <span>₹{sale.taxTotal.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{(sale.taxTotal / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span>₹{(sale.taxTotal / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-black pt-1 text-base font-bold">
              <span>Grand total</span>
              <span>₹{sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* HSN-wise tax summary */}
        <div className="border-b border-black p-4">
          <p className="mb-2 text-sm font-medium">HSN-wise tax summary</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black bg-neutral-100">
                <th className="border-r border-black p-2 text-left">HSN</th>
                <th className="border-r border-black p-2 text-right">Taxable Value</th>
                {sale.isInterstate ? (
                  <>
                    <th className="border-r border-black p-2 text-right">IGST Rate</th>
                    <th className="border-r border-black p-2 text-right">IGST Amt</th>
                  </>
                ) : (
                  <>
                    <th className="border-r border-black p-2 text-right">CGST Rate</th>
                    <th className="border-r border-black p-2 text-right">CGST Amt</th>
                    <th className="border-r border-black p-2 text-right">SGST Rate</th>
                    <th className="border-r border-black p-2 text-right">SGST Amt</th>
                  </>
                )}
                <th className="p-2 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {hsnSummary.map((row, i) => (
                <tr key={i} className="border-b border-neutral-300">
                  <td className="border-r border-neutral-300 p-2">{row.hsnCode}</td>
                  <td className="border-r border-neutral-300 p-2 text-right">
                    ₹{row.taxableValue.toFixed(2)}
                  </td>
                  {sale.isInterstate ? (
                    <>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        {row.gstRate.toFixed(1)}%
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        ₹{row.totalTax.toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        {(row.gstRate / 2).toFixed(1)}%
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        ₹{(row.totalTax / 2).toFixed(2)}
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        {(row.gstRate / 2).toFixed(1)}%
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right">
                        ₹{(row.totalTax / 2).toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="p-2 text-right">₹{row.totalTax.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment details */}
        <div className="border-b border-black p-4">
          <p className="mb-1 text-sm font-medium">Payment</p>
          {sale.payments.map((payment, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{payment.method}</span>
              <span>₹{payment.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between p-4 text-sm">
          <p className="text-neutral-500">This is a computer generated invoice.</p>
          <div className="text-center">
            <p className="mb-8">For {settings.businessName || "the business"}</p>
            <p className="border-t border-black pt-1">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}