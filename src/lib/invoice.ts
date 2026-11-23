/** Invoice numbers are derived from the record, so the same sale or plan invoice always prints the same number. */
export const saleInvoiceNo = (s: { id: string; paidAt?: unknown; createdAt: string; invoiceNo?: unknown }) =>
  String(s.invoiceNo || `INV-${String(s.paidAt || s.createdAt).slice(2, 7).replace("-", "")}-${s.id.slice(0, 6).toUpperCase()}`);

export type InvoiceData = {
  kind: "sale" | "plan";
  number: string;
  date: string;
  status: string;
  seller: { name: string; email?: string };
  buyer: { name: string; email: string; phone?: string };
  item: string;
  total: number;
  base: number;
  gst: number;
  gstRate: number;
  coupon?: string | null;
  method?: string;
  paymentId?: string | null;
  refunded?: boolean;
};
