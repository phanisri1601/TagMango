import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { saleInvoiceNo, type InvoiceData } from "@/lib/invoice";
import { BRAND } from "@/lib/brand";

/**
 * Invoice data for a paid order or a plan payment.
 * Orders use the unguessable order id (the same link the buyer gets on their receipt).
 * Plan invoices are only shown to the creator who paid, or to an admin.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind"), id = sp.get("id") || "";
  if (kind === "sale") {
    const s = await store.get("sales", id);
    if (!s || !["Success", "Refunded"].includes(String(s.status))) return NextResponse.json({ error: "No paid invoice for this order." }, { status: 404 });
    const seller = await store.get("users", String(s.userId));
    const total = Number(s.amount || 0);
    const out: InvoiceData = {
      kind: "sale", number: saleInvoiceNo(s as never), date: String(s.paidAt || s.createdAt), status: s.status === "Refunded" ? "Refunded" : "Paid",
      seller: { name: String(seller?.name || BRAND) }, buyer: { name: String(s.customer || ""), email: String(s.email || ""), phone: String(s.phone || "") },
      item: String(s.mango || "Programme"), total, base: total, gst: 0, gstRate: 0, coupon: (s.coupon as string) || null, method: String(s.method || ""), paymentId: (s.rzpPaymentId as string) || null, refunded: s.status === "Refunded",
    };
    return NextResponse.json(out);
  }
  if (kind === "plan") {
    const me = await currentUser();
    const inv = await store.get("invoices", id);
    if (!me || !inv || (inv.userId !== me.id && !isAdminUser(me))) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    const payer = await store.get("users", String(inv.userId));
    const total = Number(inv.amount || 0);
    const base = Math.round((total / 1.18) * 100) / 100;
    const out: InvoiceData = {
      kind: "plan", number: String(inv.number), date: String(inv.createdAt), status: String(inv.status || ""),
      seller: { name: BRAND }, buyer: { name: String(payer?.name || ""), email: String(payer?.email || ""), phone: String(payer?.phone || "") },
      item: String(inv.product || "Plan"), total, base, gst: Math.round((total - base) * 100) / 100, gstRate: 18,
    };
    return NextResponse.json(out);
  }
  return NextResponse.json({ error: "Unknown invoice type." }, { status: 400 });
}
