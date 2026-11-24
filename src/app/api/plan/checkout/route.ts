import { NextResponse } from "next/server";
import { currentUser, impersonation, IMP_BLOCK } from "@/lib/auth";
import { id, now, store } from "@/lib/db";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import { testBilling } from "@/lib/plans";
import { FREEDOM_PRICE, PLAN_PRICE, planIndex, withGst } from "@/lib/planPayments";

/**
 * Start a plan payment. Creates a Razorpay order for the price plus 18% GST and remembers it,
 * so the plan is only changed after Razorpay confirms the payment (never on the browser's say-so).
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (await impersonation()) return NextResponse.json({ error: IMP_BLOCK }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const freedom = b.kind === "freedom";
  const plan = String(b.plan || "");

  if (freedom ? me.whiteLabel : !(planIndex(plan) > planIndex(me.plan || "basic"))) return NextResponse.json({ error: freedom ? "Freedom Setup is already active" : "Choose a higher plan to upgrade" }, { status: 400 });
  const price = freedom ? FREEDOM_PRICE : PLAN_PRICE[plan as keyof typeof PLAN_PRICE];
  if (price === undefined) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  if (!razorpayConfigured()) {
    // Local testing without Razorpay keys: the page switches the plan directly (only when test billing is on).
    return testBilling() ? NextResponse.json({ test: true }) : NextResponse.json({ error: "Online payments are not set up yet. Please contact support." }, { status: 503 });
  }
  const amount = withGst(price);
  const orderId = id();
  try {
    const order = await createOrder(amount, `plan-${orderId}`, { kind: "plan", planOrder: orderId, userId: me.id, item: freedom ? "freedom" : plan });
    await store.write([{ type: "set", coll: "planOrders", id: orderId, data: { userId: me.id, createdAt: now(), kind: freedom ? "freedom" : "plan", plan: freedom ? null : plan, amount, price, rzpOrderId: order.id, status: "Pending" } }]);
    return NextResponse.json({ keyId: razorpayKeyId(), orderId: order.id, amount: order.amount, name: me.name, email: me.email, phone: me.phone, item: freedom ? "Freedom Setup" : `${plan[0].toUpperCase()}${plan.slice(1)} plan`, price, total: amount, testKey: razorpayKeyId().startsWith("rzp_test") });
  } catch (e) {
    return NextResponse.json({ error: `We could not start the payment: ${(e as Error).message}` }, { status: 502 });
  }
}
