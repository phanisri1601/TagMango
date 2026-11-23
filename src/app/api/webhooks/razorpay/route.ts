import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { completeSale, failSale } from "@/lib/payments";
import { verifyWebhook } from "@/lib/razorpay";

/** Razorpay → us, for payments that finish after the browser closed. Set RAZORPAY_WEBHOOK_SECRET and add this URL in the Razorpay dashboard. */
export const maxDuration = 60;

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") || "")) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  const ev = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { id: string; order_id: string; method?: string; error_description?: string } }; refund?: { entity?: { payment_id: string } } } };
  const pay = ev.payload?.payment?.entity;
  if (pay?.order_id) {
    const [sale] = await store.find("sales", [["rzpOrderId", pay.order_id]], { limit: 1 });
    if (sale) {
      if (ev.event === "payment.captured" || ev.event === "order.paid") await completeSale(String(sale.id), pay.id, pay.method);
      if (ev.event === "payment.failed") await failSale(String(sale.id), pay.error_description);
    }
  }
  const rp = ev.payload?.refund?.entity?.payment_id;
  if (ev.event === "refund.processed" && rp) {
    const [sale] = await store.find("sales", [["rzpPaymentId", rp]], { limit: 1 });
    if (sale && sale.status === "Success") await store.write([{ type: "update", coll: "sales", id: String(sale.id), patch: { status: "Refunded", refundedAt: new Date().toISOString() } }]);
  }
  return NextResponse.json({ ok: true });
}
