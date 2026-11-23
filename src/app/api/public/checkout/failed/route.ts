import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { failSale } from "@/lib/payments";
import { rateLimited } from "@/lib/ratelimit";

/** The Razorpay window reported a failed attempt, or the buyer closed it. Only Pending orders can be marked. */
export const maxDuration = 60;

export async function POST(req: Request) {
  if (await rateLimited("payfail", 30)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const sale = await store.get("sales", String(b.saleId || ""));
  if (!sale || !sale.rzpOrderId) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await failSale(String(sale.id), String(b.reason || "Payment not completed"));
  return NextResponse.json({ ok: true });
}
