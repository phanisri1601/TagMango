import "server-only";
import { id, now, store } from "./db";
import { PLANS, type Plan } from "./db";

/** Monthly plan prices in rupees, before GST. */
export const PLAN_PRICE: Record<Plan, number> = { basic: 0, pro: 5000, advanced: 15000, ultimate: 35000 };
export const FREEDOM_PRICE = 24999;
export const GST = 0.18;

export const withGst = (rupees: number) => Math.round(rupees * (1 + GST));
export const planIndex = (p: string) => (PLANS as readonly string[]).indexOf(p);

/**
 * Apply a paid plan order: switch the plan (or switch on Freedom Setup), issue the invoice, and tell the creator.
 * Safe to call twice (the browser and the Razorpay webhook may both report the same payment): the second call does nothing.
 */
export async function applyPlanOrder(orderId: string, paymentId: string, method?: string) {
  return store.tx(async (t) => {
    const o = await t.get("planOrders", orderId);
    if (!o || o.status === "Paid") return false;
    const user = await t.get("users", String(o.userId));
    if (!user) return false;
    const label = o.kind === "freedom" ? "Freedom Setup" : `${String(o.plan)[0].toUpperCase()}${String(o.plan).slice(1)} plan`;
    const patch: Record<string, unknown> = o.kind === "freedom" ? { whiteLabel: true } : { plan: o.plan, planPaidAt: now() };
    t.update("users", String(o.userId), patch);
    t.set("invoices", id(), { userId: o.userId, createdAt: now(), number: `TM-${Date.now().toString().slice(-8)}`, product: label, amount: o.amount, status: "Paid", paymentId, orderId: o.rzpOrderId });
    t.update("planOrders", orderId, { status: "Paid", paymentId, paidAt: now(), ...(method ? { method } : {}) });
    t.set("notifications", id(), { userId: o.userId, createdAt: now(), read: false, text: `Payment received. ${label} is now active.` });
    return true;
  });
}
