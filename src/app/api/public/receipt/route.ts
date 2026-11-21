import { NextResponse } from "next/server";
import { store } from "@/lib/db";

/** Receipt data for the confirmation page. The order id is random and unguessable; no contact details beyond the buyer's own are returned. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("sale") || "";
  const s = id ? await store.get("sales", id) : null;
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const creator = await store.get("users", String(s.userId));
  return NextResponse.json({
    id: s.id, status: s.status, customer: s.customer, email: s.email, item: s.mango, amount: s.amount, coupon: s.coupon || null, method: s.method,
    paymentId: s.rzpPaymentId || null, createdAt: s.createdAt, paidAt: s.paidAt || null, refundedAt: s.refundedAt || null, seller: creator?.name || "",
  });
}
