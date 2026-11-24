import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/db";
import { fetchPayment, verifyPaymentSignature } from "@/lib/razorpay";
import { applyPlanOrder } from "@/lib/planPayments";

export const maxDuration = 60;

/** The browser reports a finished plan payment. We check Razorpay's signature, then the payment itself, before changing anything. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const orderId = String(b.orderId || ""), paymentId = String(b.paymentId || ""), signature = String(b.signature || "");
  const [order] = await store.find("planOrders", [["rzpOrderId", orderId], ["userId", me.id]], { limit: 1 });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!verifyPaymentSignature(orderId, paymentId, signature)) return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
  const pay = await fetchPayment(paymentId).catch(() => null);
  if (!pay || pay.order_id !== orderId || pay.status !== "captured" || pay.amount !== Math.round(Number(order.amount) * 100)) return NextResponse.json({ error: "Payment is not confirmed yet. If money was taken, your plan will update shortly." }, { status: 409 });
  await applyPlanOrder(String(order.id), paymentId, pay.method ? `Razorpay · ${pay.method}` : undefined);
  const fresh = await store.get("users", me.id);
  return NextResponse.json({ ok: true, plan: fresh?.plan || "basic", whiteLabel: Boolean(fresh?.whiteLabel) });
}
