import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerHistory, useRecordCustomerPayment } from "./useCustomerHistory";
import type { PaymentMethod } from "./types";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomerHistory(id ?? null);
  const recordPayment = useRecordCustomerPayment(id ?? null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");

  async function handleRecordPayment() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    await recordPayment.mutateAsync({ amount: parsed, method, note: note || undefined });
    setAmount("");
    setNote("");
  }

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6 text-muted-foreground">Customer not found.</div>;
  }

  const { customer, purchases, payments } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
          ← Back
        </Button>
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>{customer.phone ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">GSTIN</CardTitle>
          </CardHeader>
          <CardContent>{customer.gstin ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent
            className={`text-lg font-semibold ${
              customer.outstandingBalance > 0 ? "text-red-600" : ""
            }`}
          >
            ₹{customer.outstandingBalance.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Purchase History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Credit Portion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No purchases yet.
                </TableCell>
              </TableRow>
            )}
            {purchases.map((sale) => (
              <TableRow
                key={sale.saleId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/invoice/${sale.saleId}`)}
              >
                <TableCell>{sale.invoiceNumber}</TableCell>
                <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {sale.creditPortion > 0 ? `₹${sale.creditPortion.toFixed(2)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Payments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            )}
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>{payment.note ?? "—"}</TableCell>
                <TableCell className="text-right">₹{payment.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32"
            />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger id="method" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="note">Note</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button
            onClick={handleRecordPayment}
            disabled={!amount || parseFloat(amount) <= 0 || recordPayment.isPending}
          >
            Record Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}