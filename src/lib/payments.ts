import "server-only";
import { id, now, store } from "./db";
import { automatedEmail } from "./automation";
import { sendWhatsApp } from "./messaging";
import { onCheckoutStarted, onPurchase, appUrl, findLead, getGrowth, mark } from "./growth/core";

const rupees = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

/** Everything that happens after a payment is confirmed: notify the creator, email the buyer, open the portal. */
export async function afterSuccess(saleId: string) {
  const s = await store.get("sales", saleId);
  if (!s) return;
  const creatorId = String(s.userId);
  const name = String(s.customer), email = String(s.email), phone = String(s.phone || "");
  await store.write([{ type: "set", coll: "notifications", id: id(), data: { userId: creatorId, createdAt: now(), read: false, text: `New sale: ${name} bought ${s.mango} for ${rupees(Number(s.amount))}` } }]);
  const receipt = `${appUrl()}/confirmation?sale=${saleId}`;
  await automatedEmail(creatorId, "Confirmation Email on Mango Purchase", email, { name, mango: String(s.mango), amount: rupees(Number(s.amount)) }, {
    subject: `You're in! ${s.mango}`,
    body: `Hi {name},\n\nThanks for purchasing "{mango}" ({amount}). You now have access.\nYour receipt: ${receipt}\n\n— {creator}`,
  }).catch(() => {});
  await onPurchase(creatorId, String(s.mangoId), { name, email, phone }).catch(() => {});
}

/** Mark a pending sale paid. Safe to call twice (browser verify + webhook). Returns true only the first time. */
export async function completeSale(saleId: string, paymentId: string, method?: string) {
  const first = await store.tx(async (t) => {
    const s = await t.get("sales", saleId);
    if (!s || s.status === "Success" || s.status === "Refunded") return false;
    t.update("sales", saleId, { status: "Success", rzpPaymentId: paymentId, paidAt: now(), ...(method ? { method: `Razorpay · ${method}` } : {}) });
    for (const l of await t.find("leads", [["userId", s.userId], ["type", "dropoff"], ["email", s.email]])) if (l.mango === s.mango) t.delete("leads", l.id);
    return true;
  });
  if (first) await afterSuccess(saleId);
  return first;
}

/** A payment attempt failed: keep the order visible as Failed and start the "payment pending or failed" reminders. */
export async function failSale(saleId: string, reason?: string) {
  const s = await store.get("sales", saleId);
  if (!s || s.status !== "Pending") return false;
  await store.write([{ type: "update", coll: "sales", id: saleId, patch: { status: "Failed", failReason: (reason || "").slice(0, 200), failedAt: now() } }]);
  await onCheckoutStarted(String(s.userId), String(s.mangoId), { name: String(s.customer), email: String(s.email), phone: String(s.phone || "") }).catch(() => {});
  return true;
}

/**
 * Refund a sale: refunds at Razorpay when it was paid there, marks the sale Refunded, tells the buyer by email
 * and WhatsApp, and keeps a record on the order.
 */
export async function refundSale(creatorId: string, saleId: string, opts: { reason?: string; refundFn?: (paymentId: string, amount: number) => Promise<{ id: string }> } = {}) {
  const s = await store.get("sales", saleId);
  if (!s || s.userId !== creatorId) throw new Error("Order not found");
  if (s.status === "Refunded") throw new Error("This order is already refunded");
  if (s.status !== "Success") throw new Error("Only paid orders can be refunded");
  let refundId = "";
  if (s.rzpPaymentId && opts.refundFn) refundId = (await opts.refundFn(String(s.rzpPaymentId), Number(s.amount))).id;
  await store.write([{ type: "update", coll: "sales", id: saleId, patch: { status: "Refunded", refundedAt: now(), refundId, refundReason: (opts.reason || "").slice(0, 300) } }]);
  const amount = rupees(Number(s.amount));
  // programme refunds run the "Refund processed" workflow (email + WhatsApp); other products get a plain email
  const g = await getGrowth(creatorId);
  const lead = g && g.programmeMango === s.mangoId ? await findLead(creatorId, String(s.email), String(s.phone || "")) : null;
  if (lead) await mark(creatorId, lead.id, "refunded", { detail: amount, refire: true });
  else {
    await automatedEmail(creatorId, "Refund Confirmation", String(s.email), { name: String(s.customer), mango: String(s.mango), amount }, {
      subject: `Your refund for ${s.mango}`,
      body: `Hi {name},\n\nYour refund of {amount} for "{mango}" has been processed. It reaches your original payment method in 5 to 7 working days.\n\n— {creator}`,
    }).catch(() => {});
    if (s.phone) await sendWhatsApp(String(s.phone), `Hi ${s.customer}, your refund of ${amount} for ${s.mango} has been processed. It reaches your account in 5 to 7 working days.`).catch(() => {});
  }
  await store.write([{ type: "set", coll: "notifications", id: id(), data: { userId: creatorId, createdAt: now(), read: false, text: `Refunded ${amount} to ${s.customer} (${s.mango})` } }]);
  return { refundId };
}
