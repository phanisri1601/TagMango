import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { completeSale } from "@/lib/payments";
import { fetchPayment, verifyPaymentSignature } from "@/lib/razorpay";
import { rateLimited } from "@/lib/ratelimit";

/** The browser reports a finished Razorpay payment; we trust only the signature, never the amount from the browser. */
export async function POST(req: Request) {
  if (await rateLimited("payverify", 30)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const sale = await store.get("sales", String(b.saleId || ""));
  if (!sale || !sale.rzpOrderId) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (sale.rzpOrderId !== b.razorpay_order_id || !verifyPaymentSignature(String(b.razorpay_order_id), String(b.razorpay_payment_id), String(b.razorpay_signature))) {
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  }
  let method = "";
  try { method = (await fetchPayment(String(b.razorpay_payment_id))).method || ""; } catch { /* method is only a label */ }
  await completeSale(String(sale.id), String(b.razorpay_payment_id), method);
  return NextResponse.json({ ok: true, saleId: sale.id, price: sale.amount });
}
