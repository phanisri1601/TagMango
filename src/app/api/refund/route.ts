import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { refundSale } from "@/lib/payments";
import { razorpayConfigured, refundPayment } from "@/lib/razorpay";

/** Creator refunds one of their own orders: refunds at Razorpay (when paid there) and tells the learner. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    const r = await refundSale(me.id, String(b.saleId || ""), { reason: String(b.reason || ""), refundFn: razorpayConfigured() ? (pid, amt) => refundPayment(pid, amt) : undefined });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
